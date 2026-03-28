/**
 * Update the agentURI for all 20 agents on the official ERC-8004 registry
 * so they display proper names on 8004scan instead of "Agent #XXXX"
 */
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const PRIVATE_KEY = "0x9b5f8005b6bf9248a7339f15b9a1d927cfce8a8011e5d0389e1ac72a7079667a";
const RPC_URL = "https://1rpc.io/sepolia";
const ERC8004_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";

const ERC8004_ABI = [
  "function setAgentURI(uint256 agentId, string newURI) external",
  "function tokenURI(uint256 agentId) view returns (string)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const registry = new ethers.Contract(ERC8004_REGISTRY, ERC8004_ABI, wallet);

  // Load the registration results to get token IDs
  const results = JSON.parse(fs.readFileSync(path.join(__dirname, "registration_results.json"), "utf-8"));
  
  // Load the v2 CID map (ERC-8004 compliant cards)
  const cidMapV2 = JSON.parse(fs.readFileSync(path.join(__dirname, "agent_cids_v2.json"), "utf-8"));

  console.log(`Updating URIs for ${results.length} agents...\n`);

  for (const agent of results) {
    if (!agent.erc8004TokenId || agent.error) continue;

    const newCid = cidMapV2[agent.file];
    if (!newCid) { console.warn(`No v2 CID for ${agent.file}`); continue; }

    const newURI = `https://gateway.lighthouse.storage/ipfs/${newCid}`;
    const tokenId = parseInt(agent.erc8004TokenId);

    console.log(`Updating #${tokenId} (${agent.handle}) → ${newURI}...`);

    try {
      const tx = await registry.setAgentURI(tokenId, newURI);
      await tx.wait();
      console.log(`  ✅ Updated! Tx: ${tx.hash}`);
      await new Promise(r => setTimeout(r, 3000)); // rate limit
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
    }
  }

  console.log("\n✅ All URIs updated! Check 8004scan.io for proper names.");
}

main().catch(console.error);
