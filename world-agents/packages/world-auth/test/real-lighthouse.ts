/**
 * Real Lighthouse upload/fetch test.
 * Run: npx tsx test/real-lighthouse.ts
 * Requires: LIGHTHOUSE_API_KEY env var
 */
import { uploadToIPFS, fetchFromIPFS } from '../src/storage/filecoin';

async function main() {
  const apiKey = process.env.LIGHTHOUSE_API_KEY;
  if (!apiKey) {
    console.error('❌ Set LIGHTHOUSE_API_KEY env var first');
    process.exit(1);
  }

  console.log('📤 Uploading test data to Filecoin via Lighthouse...');
  const testData = {
    test: true,
    message: 'AgentRoot world-auth Lighthouse integration test',
    timestamp: Date.now(),
  };

  const cid = await uploadToIPFS(testData, { lighthouseApiKey: apiKey });
  console.log(`✅ Uploaded! CID: ${cid}`);
  console.log(`🔗 View at: https://gateway.lighthouse.storage/ipfs/${cid}`);

  console.log('\n📥 Fetching back from IPFS...');
  const fetched = await fetchFromIPFS(cid);
  console.log('✅ Fetched:', JSON.stringify(fetched, null, 2));

  // Verify round-trip
  const original = JSON.stringify(testData);
  const retrieved = JSON.stringify(fetched);
  if (original === retrieved) {
    console.log('\n🎉 Round-trip successful! Lighthouse integration works.');
  } else {
    console.error('\n❌ Data mismatch!');
    console.error('Sent:', original);
    console.error('Got:', retrieved);
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
