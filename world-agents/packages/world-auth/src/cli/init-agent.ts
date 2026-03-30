import { generateKeypair, generateAgentId } from '../core/agent';
import { createDelegation } from '../core/delegation';
import { uploadToIPFS } from '../storage/filecoin';
import bs58 from 'bs58';
import * as fs from 'fs';
import * as path from 'path';

const CONFIG_PATH = path.join(process.cwd(), '.worldauth.json');

/**
 * CLI init-agent flow:
 * 1. Load human identity from .worldauth.json (must run `login` first)
 * 2. Generate a new Ed25519 agent keypair
 * 3. Create a signed delegation binding the agent to the human
 * 4. Upload the delegation to Filecoin/IPFS via Lighthouse
 * 5. Save agent config to .worldauth.json
 *
 * Required env vars:
 *   LIGHTHOUSE_API_KEY — Lighthouse API key for Filecoin/IPFS uploads
 */
export async function initAgentFlow() {
  console.log('🤖 Initializing new agent identity...');

  // Validate prerequisites
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('❌ Human identity not found. Run `openclaw-world-auth login` first.');
    process.exit(1);
  }

  const lighthouseApiKey = process.env.LIGHTHOUSE_API_KEY;
  if (!lighthouseApiKey) {
    console.error('❌ Missing LIGHTHOUSE_API_KEY environment variable.');
    console.error('   Get your API key from https://files.lighthouse.storage/');
    process.exit(1);
  }

  const humanConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

  // Validate that the human config has a real nullifier (not a placeholder)
  if (!humanConfig.nullifierHash || humanConfig.nullifierHash === 'agentbook_verified') {
    console.error('❌ Invalid human identity. The nullifier hash is missing or is a placeholder.');
    console.error('   Re-run `openclaw-world-auth login` to verify with World ID.');
    process.exit(1);
  }

  // 1. Generate new agent identity
  const agentKp = generateKeypair();
  const agentId = generateAgentId(agentKp.publicKey);

  console.log(`🔑 Generated Agent ID: ${agentId}`);

  // 2. Delegate from Human -> Agent
  const session = {
    nullifierHash: humanConfig.nullifierHash,
    verifiedAt: humanConfig.verifiedAt,
  };

  const humanSecretBytes = bs58.decode(humanConfig.humanSecretKey);

  console.log('✍️  Signing delegation tying Agent to Human...');
  const delegation = createDelegation(
    agentId,
    humanSecretBytes,
    humanConfig.humanPublicKey,
    session
  );

  // 3. Upload delegation to Filecoin/IPFS via Lighthouse
  console.log('🌐 Uploading delegation to Filecoin via Lighthouse...');

  let delegationCid: string;
  try {
    delegationCid = await uploadToIPFS(delegation, { lighthouseApiKey });
  } catch (err) {
    console.error('❌ Failed to upload delegation to Filecoin:', (err as Error).message);
    process.exit(1);
  }

  console.log(`✅ Delegation uploaded. CID: ${delegationCid}`);

  // 4. Save agent configuration
  const agentConfig = {
    ...humanConfig,
    agentId,
    agentSecretKey: bs58.encode(agentKp.secretKey),
    agentPublicKey: bs58.encode(agentKp.publicKey),
    delegationCid,
  };

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(agentConfig, null, 2));
  console.log(`💾 Saved agent context to ${CONFIG_PATH}`);
}
