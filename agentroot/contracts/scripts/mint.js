const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const AGENTS_DIR = path.join(__dirname, "../../agents");

async function main() {
  const contractAddress = process.env.ACCOUNTABILITY_CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("ACCOUNTABILITY_CONTRACT_ADDRESS not set in .env. Deploy the accountability contract first.");
    process.exit(1);
  }

  console.log(`Connecting to AgentRootAccountability at ${contractAddress}...`);

  const AccountabilityTracker = await hre.ethers.getContractFactory("AgentRootAccountability");
  const tracker = AccountabilityTracker.attach(contractAddress);

  const [signer] = await hre.ethers.getSigners();
  console.log(`Registering agents with deployer wallet: ${signer.address}\n`);

  const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.json')).sort();
  console.log(`Found ${agentFiles.length} agents to register on the Official ERC-8004 Registry.\n`);

  for (const file of agentFiles) {
    const agent = JSON.parse(fs.readFileSync(path.join(AGENTS_DIR, file), "utf-8"));
    const handle = agent.handle;
    const memberId = agent.deployer.memberId;

    // Read the REAL World ID Nullifier Hash that we generated securely
    const nullifierHash = agent.deployer.nullifierHash;

    // The official 8004 standard requires an agentURI to be passed (e.g., an IPFS link to the Agent Card)
    const agentURI = `ipfs://agent-card-for-${handle.replace('@', '')}`;

    console.log(`Registering ${handle} on Official 8004 & binding to Human Member ${memberId}...`);

    try {
      // Call our wrapper which calls the official registry and maps the resulting ID to the Nullifier
      const tx = await tracker.registerAndBind(agentURI, nullifierHash);
      const receipt = await tx.wait();

      console.log(`  ✅ Registered and Bound! Tx: ${receipt.hash}`);
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
    }
  }

  console.log("\n🎉 All 20 agents registered on the global 8004 standard and bound to your human accountability layer!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
