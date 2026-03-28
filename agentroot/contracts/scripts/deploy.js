const hre = require("hardhat");

async function main() {
  const network = hre.network.name;
  let registryAddress;

  if (network === "hardhat" || network === "localhost") {
    // LOCAL: Deploy a mock ERC-8004 registry for testing
    console.log("🧪 Local network detected. Deploying MockIdentityRegistry...");
    const MockRegistry = await hre.ethers.getContractFactory("MockIdentityRegistry");
    const mock = await MockRegistry.deploy();
    await mock.waitForDeployment();
    registryAddress = await mock.getAddress();
    console.log(`✅ MockIdentityRegistry deployed to: ${registryAddress}`);
  } else {
    // SEPOLIA: Use the official canonical ERC-8004 registry
    registryAddress = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
    console.log(`🌐 Using official ERC-8004 registry at: ${registryAddress}`);
  }

  console.log("Deploying AgentRootAccountability Layer...");
  const AccountabilityTracker = await hre.ethers.getContractFactory("AgentRootAccountability");
  const tracker = await AccountabilityTracker.deploy(registryAddress);
  
  if (tracker.waitForDeployment) {
    await tracker.waitForDeployment();
  } else if (tracker.deployed) {
    await tracker.deployed();
  }

  const address = await tracker.getAddress();
  console.log(`✅ AgentRootAccountability deployed to: ${address}`);
  console.log(`Save this address in your .env as ACCOUNTABILITY_CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
