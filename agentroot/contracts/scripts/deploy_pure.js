const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const envPath = path.resolve(__dirname, "../../../.env");
console.log(`Loading .env from: ${envPath}`);
require("dotenv").config({ path: envPath });

async function main() {
  let privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("PRIVATE_KEY not set in .env");
    process.exit(1);
  }
  // Remove quotes and whitespace
  privateKey = privateKey.replace(/["']/g, "").trim();
  // Ensure 0x prefix
  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`Deploying with wallet: ${wallet.address}`);
  
  // Read artifacts
  const artifactPath = path.join(__dirname, "../artifacts/src/AgentRootAccountability.sol/AgentRootAccountability.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  const Factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  console.log("Sending deployment transaction...");
  const contract = await Factory.deploy(registryAddress);
  
  console.log(`Transaction hash: ${contract.deploymentTransaction().hash}`);
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log(`✅ AgentRootAccountability deployed to: ${address}`);
}

main().catch(console.error);
