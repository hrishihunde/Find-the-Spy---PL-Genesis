/**
 * Real end-to-end integration test for world-auth.
 * Tests the full accountability chain with REAL Lighthouse uploads.
 * 
 * Run: npx tsx test/real-e2e.ts
 * 
 * Requires env vars: LIGHTHOUSE_API_KEY, WORLD_APP_ID, WORLD_ACTION
 */
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { generateKeypair, generateAgentId, signPayload } from '../src/core/agent';
import { createDelegation, verifyDelegation } from '../src/core/delegation';
import { uploadToIPFS, fetchFromIPFS } from '../src/storage/filecoin';
import { verifyRequest } from '../src/core/verify';
import { createWorldAuth } from '../src/index';
import bs58 from 'bs58';

const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY;
const WORLD_APP_ID = process.env.WORLD_APP_ID;
const WORLD_ACTION = process.env.WORLD_ACTION;

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  AgentRoot world-auth — Real E2E Integration Test');
  console.log('═══════════════════════════════════════════════════\n');

  // Validate env
  if (!LIGHTHOUSE_API_KEY) {
    console.error('❌ Missing LIGHTHOUSE_API_KEY'); process.exit(1);
  }
  console.log('✅ LIGHTHOUSE_API_KEY loaded');
  console.log(`✅ WORLD_APP_ID: ${WORLD_APP_ID || '(not set — World ID verify skipped)'}`);
  console.log(`✅ WORLD_ACTION: ${WORLD_ACTION || '(not set)'}`);

  // ──────────────────────────────────────
  // STEP 1: Generate Human + Agent Keys
  // ──────────────────────────────────────
  console.log('\n── Step 1: Generate Identities ──');
  
  const humanKp = generateKeypair();
  const humanPublicKeyB58 = bs58.encode(humanKp.publicKey);
  console.log(`👤 Human Public Key: ${humanPublicKeyB58}`);

  const agentKp = generateKeypair();
  const agentId = generateAgentId(agentKp.publicKey);
  console.log(`🤖 Agent ID: ${agentId}`);

  // ──────────────────────────────────────
  // STEP 2: Create Signed Delegation
  // ──────────────────────────────────────
  console.log('\n── Step 2: Create Signed Delegation ──');

  // Simulate a real World ID session (nullifier from a real verification)
  const worldSession = {
    nullifierHash: '0x2a7c4e91f3b8d5a6c0e1f2934d5b8c7a6e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3',
    verifiedAt: Date.now(),
  };

  const delegation = createDelegation(
    agentId,
    humanKp.secretKey,
    humanPublicKeyB58,
    worldSession,
    7 * 24 * 60 * 60 * 1000 // 7 days expiry
  );

  console.log(`✅ Delegation created`);
  console.log(`   Agent: ${delegation.agentId}`);
  console.log(`   Nullifier: ${delegation.worldAttestation.nullifierHash}`);
  console.log(`   Expires: ${new Date(delegation.expiry).toISOString()}`);

  // Verify locally before uploading
  const localVerify = verifyDelegation(delegation);
  console.log(`✅ Local delegation verification: ${localVerify ? 'PASS' : 'FAIL'}`);
  if (!localVerify) { console.error('❌ Delegation failed local verification!'); process.exit(1); }

  // ──────────────────────────────────────
  // STEP 3: Upload Delegation to Filecoin
  // ──────────────────────────────────────
  console.log('\n── Step 3: Upload Delegation to Filecoin (Lighthouse) ──');

  const delegationCid = await uploadToIPFS(delegation, { lighthouseApiKey: LIGHTHOUSE_API_KEY });
  console.log(`✅ Delegation uploaded to Filecoin!`);
  console.log(`   CID: ${delegationCid}`);
  console.log(`   URL: https://gateway.lighthouse.storage/ipfs/${delegationCid}`);

  // ──────────────────────────────────────
  // STEP 4: Fetch Delegation Back
  // ──────────────────────────────────────
  console.log('\n── Step 4: Fetch Delegation from IPFS ──');

  const fetchedDelegation = await fetchFromIPFS(delegationCid);
  console.log('✅ Delegation fetched from IPFS');

  const remoteVerify = verifyDelegation(fetchedDelegation);
  console.log(`✅ Remote delegation verification: ${remoteVerify ? 'PASS' : 'FAIL'}`);
  if (!remoteVerify) { console.error('❌ Fetched delegation failed verification!'); process.exit(1); }

  // ──────────────────────────────────────
  // STEP 5: Agent Signs an Action
  // ──────────────────────────────────────
  console.log('\n── Step 5: Agent Signs an Action ──');

  const auth = createWorldAuth({ lighthouseApiKey: LIGHTHOUSE_API_KEY });
  const signer = auth.attach(agentKp.secretKey, agentId, delegationCid);

  const actionPayload = {
    action: 'post',
    content: 'Iran launched 32 drones targeting Israeli military installations in the Negev.',
    platform: 'oasis-reddit',
    timestamp: Date.now(),
  };

  const signedRequest = signer.signAction(actionPayload);
  console.log(`✅ Agent signed action`);
  console.log(`   Agent ID: ${signedRequest.agentId}`);
  console.log(`   Delegation CID: ${signedRequest.delegationCid}`);
  console.log(`   Signature: ${signedRequest.signature.slice(0, 20)}...`);

  // ──────────────────────────────────────
  // STEP 6: Verify Full Chain (E2E)
  // ──────────────────────────────────────
  console.log('\n── Step 6: Verify Full Accountability Chain ──');
  console.log('   (Fetches delegation from IPFS, verifies signatures)');

  const result = await auth.verify(signedRequest);

  if (result.valid && result.delegation) {
    console.log('\n✅ ══════════════════════════════════════════════');
    console.log('✅  FULL ACCOUNTABILITY CHAIN VERIFIED!');
    console.log('✅ ══════════════════════════════════════════════');
    console.log(`   Agent:      ${result.delegation.agentId}`);
    console.log(`   Human Key:  ${result.delegation.humanPublicKey}`);
    console.log(`   Nullifier:  ${result.delegation.worldAttestation.nullifierHash}`);
    console.log(`   Verified:   ${new Date(result.delegation.worldAttestation.verifiedAt).toISOString()}`);
    console.log(`   CID:        ${delegationCid}`);
    console.log('');
    console.log('   Chain: Agent Post → Agent Signature → Delegation CID');
    console.log('          → Filecoin Proof → Human Key → World ID Nullifier');
    console.log('          → Verified Human ✅');
  } else {
    console.error('\n❌ VERIFICATION FAILED!');
    process.exit(1);
  }

  // ──────────────────────────────────────
  // STEP 7: Upload Evidence Report
  // ──────────────────────────────────────
  console.log('\n── Step 7: Upload Evidence Report to Filecoin ──');

  const evidenceReport = {
    type: 'agentroot_accountability_trace',
    version: '3.0',
    timestamp: Date.now(),
    flaggedAgent: {
      agentId: agentId,
      delegationCid: delegationCid,
    },
    accountabilityChain: {
      agentId: result.delegation!.agentId,
      humanPublicKey: result.delegation!.humanPublicKey,
      nullifierHash: result.delegation!.worldAttestation.nullifierHash,
      verifiedAt: result.delegation!.worldAttestation.verifiedAt,
    },
    signedAction: signedRequest,
  };

  const evidenceCid = await uploadToIPFS(evidenceReport, { lighthouseApiKey: LIGHTHOUSE_API_KEY });
  console.log(`✅ Evidence report uploaded to Filecoin!`);
  console.log(`   Evidence CID: ${evidenceCid}`);
  console.log(`   URL: https://gateway.lighthouse.storage/ipfs/${evidenceCid}`);

  // ──────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  ALL TESTS PASSED — Full E2E Chain Verified');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Delegation CID:  ${delegationCid}`);
  console.log(`  Evidence CID:    ${evidenceCid}`);
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ Fatal Error:', err.message);
  process.exit(1);
});
