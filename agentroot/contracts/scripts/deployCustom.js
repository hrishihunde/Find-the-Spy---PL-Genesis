/**
 * Deploy AgentRootRegistry (custom contract) to Sepolia
 * Uses pure ethers.js — no Hardhat runtime dependency
 */
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const PRIVATE_KEY = "0x9b5f8005b6bf9248a7339f15b9a1d927cfce8a8011e5d0389e1ac72a7079667a";
const RPC_URL = "https://1rpc.io/sepolia";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`Deployer: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  // Read compiled artifact
  const artifactPath = path.join(__dirname, "../artifacts/src/AgentRootRegistry.sol/AgentRootRegistry.json");
  
  if (!fs.existsSync(artifactPath)) {
    console.error("❌ Artifact not found. Run: npx hardhat compile");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  const Factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  console.log("\n📜 Deploying AgentRootRegistry...");
  const contract = await Factory.deploy();
  
  console.log(`⏳ Tx: ${contract.deploymentTransaction().hash}`);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`\n✅ AgentRootRegistry deployed to: ${address}`);
  console.log(`\n👉 Now update CUSTOM_CONTRACT in registerAgents.js with: "${address}"`);
  console.log(`👉 Explorer: https://sepolia.etherscan.io/address/${address}`);
}

main().catch(console.error);
