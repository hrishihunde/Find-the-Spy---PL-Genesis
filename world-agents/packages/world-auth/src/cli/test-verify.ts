import * as fs from 'fs';
import * as path from 'path';
import { createWorldAuth } from '../index';
import bs58 from 'bs58';

const CONFIG_PATH = path.join(process.cwd(), '.worldauth.json');

async function testVerify() {
  console.log('🧪 Starting Verification Test...');

  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('❌ .worldauth.json not found. Run login and init-agent first.');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  const { agentId, agentSecretKey, delegationCid } = config;

  console.log(`🤖 Agent ID: ${agentId}`);
  console.log(`📁 Delegation CID: ${delegationCid}`);

  // 1. Initialize SDK
  const auth = createWorldAuth({
    lighthouseApiKey: process.env.LIGHTHOUSE_API_KEY
  });

  // 2. Simulate an "Agent Action" (e.g. a post)
  const actionPayload = {
    type: 'post',
    content: 'Autonomous agents need human accountability.',
    timestamp: Date.now()
  };

  // 3. Attach authentication to the action (sign it)
  console.log('✍️  Signing action with Agent key...');
  const agentSK = bs58.decode(agentSecretKey);
  const signedRequest = auth.attach(agentSK, agentId, delegationCid).signAction(actionPayload);

  console.log('📜 Signed Request:', JSON.stringify(signedRequest, null, 2));

  // 4. Verify the request (The "OpenClaw" logic)
  console.log('\n🔍 Verifying Request (Tracing back to Human)...');
  try {
    const result = await auth.verify(signedRequest);

    if (!result.valid || !result.delegation) {
      throw new Error('Verification failed: Result not valid or delegation missing');
    }

    const { delegation } = result;

    console.log('\n✅ VERIFICATION SUCCESS!');
    console.log('══════════════════════════════════════════');
    console.log(`👤 Human Nullifier: ${delegation.worldAttestation.nullifierHash}`);
    console.log(`🔑 Human Public Key: ${delegation.humanPublicKey}`);
    console.log(`🤖 Agent ID: ${delegation.agentId}`);
    console.log(`📂 CID Source: ${config.delegationCid}`);
    console.log('══════════════════════════════════════════');
    console.log('\n🔗 Accountability Chain Verified:');
    console.log('Action ✅ -> Agent ✅ -> Wallet/CID ✅ -> WORLD ID HUMAN ✅');
  } catch (err) {
    console.error('❌ VERIFICATION FAILED:', (err as Error).message);
    process.exit(1);
  }
}

testVerify();
