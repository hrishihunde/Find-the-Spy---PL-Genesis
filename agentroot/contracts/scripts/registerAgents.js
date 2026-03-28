/**
 * Combined Registration Script for AgentRoot v5
 * Step 1: register() on official ERC-8004 Identity Registry → visible on 8004scan
 * Step 2: registerAgent() on custom AgentRootRegistry → stores World ID + flag data
 * Step 3: linkERC8004() + bindWorldId() → links both together
 */
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// ─── CONFIG ────────────────────────────────────────────────────
const PRIVATE_KEY = "0x9b5f8005b6bf9248a7339f15b9a1d927cfce8a8011e5d0389e1ac72a7079667a";
const RPC_URL = "https://1rpc.io/sepolia";

// Official ERC-8004 Identity Registry on Sepolia
const ERC8004_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";

// Will be filled after deploying AgentRootRegistry
let CUSTOM_CONTRACT = ""; // Set after deploy

// ─── ABIs ──────────────────────────────────────────────────────
const ERC8004_ABI = [
  "function register(string agentURI) returns (uint256 agentId)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// ─── AGENT DATA WITH REAL IPFS CIDs ───────────────────────────
const cidMap = JSON.parse(fs.readFileSync(path.join(__dirname, "agent_cids.json"), "utf-8"));
const AGENTS_DIR = path.resolve(__dirname, "../../agents");

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`\n🔑 Wallet: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  // ─── STEP 1: Connect to official ERC-8004 registry ──────────
  const registry = new ethers.Contract(ERC8004_REGISTRY, ERC8004_ABI, wallet);
  console.log(`📋 Official ERC-8004 Registry: ${ERC8004_REGISTRY}`);

  // ─── STEP 2: Connect to custom contract (if deployed) ───────
  let custom = null;
  if (CUSTOM_CONTRACT) {
    const customArtifact = JSON.parse(fs.readFileSync(
      path.join(__dirname, "../artifacts/src/AgentRootRegistry.sol/AgentRootRegistry.json"), "utf-8"
    ));
    custom = new ethers.Contract(CUSTOM_CONTRACT, customArtifact.abi, wallet);
    console.log(`🔧 Custom AgentRootRegistry: ${CUSTOM_CONTRACT}`);
  }

  // ─── STEP 3: Read agent files ───────────────────────────────
  const agentFiles = fs.readdirSync(AGENTS_DIR)
    .filter(f => f.startsWith("agent_") && f.endsWith(".json"))
    .sort();

  console.log(`\n🤖 Found ${agentFiles.length} agents to register\n`);
  console.log("=".repeat(60));

  const results = [];

  for (const file of agentFiles) {
    const agent = JSON.parse(fs.readFileSync(path.join(AGENTS_DIR, file), "utf-8"));
    const cid = cidMap[file];
    if (!cid) { console.warn(`⚠️  No CID for ${file}, skipping`); continue; }

    const agentURI = `ipfs://${cid}`;
    const handle = agent.handle;
    const nullifierHash = agent.deployer?.nullifierHash || "0x0000000000000000000000000000000000000000000000000000000000000000";

    console.log(`\n📝 Registering ${handle}...`);
    console.log(`   URI: ${agentURI}`);

    try {
      // ── Official ERC-8004 Registration ──
      console.log(`   [1/3] Calling official register()...`);
      const tx1 = await registry.register(agentURI);
      const receipt1 = await tx1.wait();

      // Extract the token ID from the Transfer event
      const transferEvent = receipt1.logs.find(log => {
        try { return registry.interface.parseLog(log)?.name === "Transfer"; }
        catch { return false; }
      });
      const erc8004TokenId = transferEvent
        ? registry.interface.parseLog(transferEvent).args.tokenId
        : null;

      console.log(`   ✅ Official ERC-8004 Token ID: #${erc8004TokenId} | Tx: ${receipt1.hash}`);

      // ── Custom Contract Registration ──
      let customAgentId = null;
      if (custom) {
        console.log(`   [2/3] Registering on custom contract...`);
        const tx2 = await custom.registerAgent(agentURI);
        const receipt2 = await tx2.wait();
        // Parse AgentRegistered event for the custom agent ID
        const regEvent = receipt2.logs.find(log => {
          try { return custom.interface.parseLog(log)?.name === "AgentRegistered"; }
          catch { return false; }
        });
        customAgentId = regEvent ? custom.interface.parseLog(regEvent).args.agentId : null;

        // Link and bind
        if (customAgentId && erc8004TokenId) {
          console.log(`   [3/3] Linking ERC-8004 #${erc8004TokenId} + binding World ID...`);
          await (await custom.linkERC8004(customAgentId, erc8004TokenId)).wait();
          if (nullifierHash !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
            await (await custom.bindWorldId(customAgentId, nullifierHash)).wait();
          }
        }
        console.log(`   ✅ Custom Agent ID: #${customAgentId}`);
      }

      results.push({
        handle,
        file,
        ipfsCID: cid,
        erc8004TokenId: erc8004TokenId?.toString(),
        customAgentId: customAgentId?.toString(),
        txHash: receipt1.hash
      });

      // Rate limit - 3 second delay between agents
      await new Promise(r => setTimeout(r, 3000));

    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`);
      results.push({ handle, file, error: err.message });
    }
  }

  // ─── Save results ───────────────────────────────────────────
  const resultsPath = path.join(__dirname, "registration_results.json");
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Done! ${results.filter(r => r.txHash).length}/${agentFiles.length} agents registered.`);
  console.log(`📄 Results saved to: ${resultsPath}`);
  console.log(`\n👉 Check 8004scan: https://8004scan.io/?network=sepolia`);
}

main().catch(console.error);
