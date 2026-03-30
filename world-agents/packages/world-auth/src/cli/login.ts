import bs58 from 'bs58';
import { generateKeypair } from '../core/agent';
import { signRequest } from '@worldcoin/idkit-server';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

const CONFIG_PATH = path.join(process.cwd(), '.worldauth.json');

/**
 * Replicates World ID's hashToField from @worldcoin/idkit-core.
 * This is critical: keccak256(input) >> 8n (BN254 field reduction)
 */
function hashToField(input: Uint8Array): Uint8Array {
  const hash = BigInt('0x' + bytesToHex(keccak_256(input))) >> 8n;
  return hexToBytes(hash.toString(16).padStart(64, '0'));
}

/**
 * Hash a signal string using World ID's hashSignal logic.
 * Matches @worldcoin/idkit-core generateSignal / hashSignal.
 */
function hashSignal(signal: string): string {
  const input = new TextEncoder().encode(signal);
  return '0x' + bytesToHex(hashToField(input));
}

/**
 * CLI login flow — World ID 4.0:
 * 1. Generate a device keypair (Human Key)
 * 2. Sign the action with RP signing key (Server-side)
 * 3. Start a local server to handle the browser-based QR scan
 * 4. Browser sends proof back to local server
 * 5. Node.js verifies the proof with World ID v4 API
 * 6. Save credentials to .worldauth.json
 */
export async function loginFlow() {
  console.log('🔄 Starting login flow...');

  const appId = process.env.WORLD_APP_ID;
  const action = process.env.WORLD_ACTION;
  const rpId = process.env.WORLD_RP_ID;
  const signingKey = process.env.WORLD_APP_SIGNING_KEY;

  if (!appId || !action || !rpId || !signingKey) {
    console.error('❌ Missing required environment variables in .env:');
    if (!appId) console.error('   - WORLD_APP_ID');
    if (!action) console.error('   - WORLD_ACTION');
    if (!rpId) console.error('   - WORLD_RP_ID');
    if (!signingKey) console.error('   - WORLD_APP_SIGNING_KEY');
    process.exit(1);
  }

  // 1. Generate device keypair
  const kp = generateKeypair();
  const humanSecretKey = bs58.encode(kp.secretKey);
  const humanPublicKey = bs58.encode(kp.publicKey);
  console.log(`🔐 Generated device keypair. Public Key: ${humanPublicKey}`);

  // 2. Sign request and generate nonce
  const rpSig = signRequest(action, signingKey);
  const nonce = rpSig.nonce;
  console.log(`✍️  RP Signature generated. Nonce: ${nonce}`);

  // Compute signal_hash using World ID's hashToField (NOT plain keccak256)
  const signalHash = hashSignal(humanPublicKey);
  console.log(`🔑 Signal hash (hashToField): ${signalHash}`);

  // 3. Start local server
  const PORT = 4319;
  let resolveProof: (payload: any) => void;
  const proofPromise = new Promise<any>((resolve) => { resolveProof = resolve; });

  const html = buildVerifyPage(appId, action, humanPublicKey, nonce, rpSig);
  
  // Path to the local bundle
  const bundlePath = path.resolve(__dirname, '../../node_modules/@worldcoin/idkit-standalone/build/index.global.js');

  const server = http.createServer(async (req, res) => {
    // Serve HTML
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }

    // Serve Local IDKit Bundle
    if (req.method === 'GET' && req.url === '/idkit.js') {
      try {
        const content = fs.readFileSync(bundlePath);
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(content);
      } catch (err) {
        console.error('❌ Error reading IDKit bundle:', err);
        res.writeHead(404);
        res.end();
      }
      return;
    }

    // Handle verification proof from browser
    if (req.method === 'POST' && req.url === '/api/verify') {
      let body = '';
      req.on('data', (chunk) => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const proofData = JSON.parse(body);
          console.log('\n📥 Proof received from browser:', JSON.stringify(proofData, null, 2));

          // Build the v4 API payload per official docs
          const payload = {
            protocol_version: '3.0',
            nonce: nonce,
            action: action,
            environment: 'production',
            responses: [{
              identifier: proofData.verification_level || proofData.credential_type || 'device',
              merkle_root: proofData.merkle_root,
              nullifier: proofData.nullifier_hash,
              proof: proofData.proof,
              signal_hash: signalHash // Correctly computed with hashToField
            }]
          };

          console.log('📤 Sending to v4 verify API...');
          console.log('📦 Payload:', JSON.stringify(payload, null, 2));

          // Verify with World ID v4 API using rp_id
          const verifyRes = await fetch(`https://developer.world.org/api/v4/verify/${rpId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          const verifyResult = await verifyRes.json() as any;
          console.log('📬 API Response:', JSON.stringify(verifyResult, null, 2));

          if (verifyRes.ok && verifyResult.success) {
            console.log('✅ World ID API verification success!');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
            resolveProof(verifyResult); 
          } else {
            const detail = verifyResult.detail || verifyResult.code || verifyResult.message || 'Verification failed';
            console.error('❌ World ID API rejection:', detail);
            if (verifyResult.results) {
              for (const r of verifyResult.results) {
                console.error('   Result:', r.identifier, r.success, r.code, r.detail);
              }
            }
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: detail }));
          }
        } catch (err) {
          console.error('❌ Local server error:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: (err as Error).message }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(PORT, () => {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  World ID Verification');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  👉 Open: http://localhost:${PORT}`);
    console.log('  Scan the QR code with your World App.');
    console.log('  Waiting for verification...');
    console.log('═══════════════════════════════════════════════════\n');
  });

  // 4. Wait for browser result
  const verifiedPayload = await proofPromise;
  server.close();

  // Extract nullifier from verified response
  const nullifierHash = verifiedPayload.nullifier || '';

  console.log(`\n✅ World ID verified!`);
  console.log(`   Nullifier: ${nullifierHash}`);

  // 5. Save config
  const config = {
    humanSecretKey,
    humanPublicKey,
    nullifierHash,
    verifiedAt: Date.now(),
  };

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(`💾 Saved credentials to ${CONFIG_PATH}`);
  console.log('\n✅ Login complete! Now run: npx tsx src/cli/index.ts init-agent');
}

function buildVerifyPage(
  appId: string, action: string, signal: string, nonce: string,
  rpSig: { sig: string; nonce: string; createdAt: number; expiresAt: number }
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AgentRoot Login</title>
    <style>
        body { font-family: sans-serif; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #161616; padding: 2rem; border-radius: 1rem; border: 1px solid #222; text-align: center; max-width: 400px; }
        h1 { margin-bottom: 0.5rem; }
        p { color: #888; font-size: 0.9rem; margin-bottom: 2rem; }
        #status { margin-top: 1rem; font-weight: bold; }
        .spinner { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #fff; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto; display: none; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="card">
        <h1>🌍 AgentRoot</h1>
        <p>Verify your identity with World ID to create an agent.</p>
        <div id="spinner" class="spinner"></div>
        <div id="status">Initializing World ID...</div>
    </div>

    <script src="/idkit.js"></script>
    
    <script>
        const status = document.getElementById('status');
        const spinner = document.getElementById('spinner');

        async function init() {
            if (!window.IDKit) {
                status.innerText = "❌ IDKit failed to load.";
                return;
            }

            try {
                window.IDKit.init({
                    app_id: "${appId}",
                    action: "${action}",
                    signal: "${signal}",
                    verification_level: "device",
                    handleVerify: async (proof) => {
                        console.log("Proof received:", proof);
                        status.innerText = "⏳ Verifying...";
                        spinner.style.display = "block";

                        const res = await fetch('/api/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(proof)
                        });

                        const data = await res.json();
                        if (!data.success) {
                            throw new Error(data.error || "Verification failed");
                        }
                    },
                    onSuccess: () => {
                        status.innerText = "✅ Verified! Close this window.";
                        status.style.color = "#22c55e";
                        spinner.style.display = "none";
                    },
                    onError: (err) => {
                        status.innerText = "❌ " + (err.message || "Error");
                        status.style.color = "#ef4444";
                        spinner.style.display = "none";
                    }
                });

                window.IDKit.open();
                status.innerText = "📱 Scan QR with World App";

            } catch (err) {
                status.innerText = "❌ Init failed: " + err.message;
            }
        }

        setTimeout(init, 300);
    </script>
</body>
</html>`;
}
