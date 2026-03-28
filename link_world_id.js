const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const WORLD_AUTH_DIR = path.join(__dirname, "world-agents", "packages", "world-auth");
const M1_FILE = path.join(WORLD_AUTH_DIR, "m1.json");
const M2_FILE = path.join(WORLD_AUTH_DIR, "m2.json");
const M3_FILE = path.join(WORLD_AUTH_DIR, "m3.json");
const M4_FILE = path.join(WORLD_AUTH_DIR, "m4.json");

const DEPLOYERS_FILE = path.join(__dirname, "agentroot", "deployers.json");

function linkWorldId() {
  console.log("🔗 AgentRoot: Linking 4 REAL Humans to Simulation Deployers...");

  const files = [M1_FILE, M2_FILE, M3_FILE, M4_FILE];
  const missing = files.filter(f => !fs.existsSync(f));
  if (missing.length > 0) {
    console.error("\n❌ ERROR: Missing human identity files.");
    console.error("   Required: m1.json, m2.json, m3.json, m4.json");
    console.error("   Run World Auth login 4 times (once per team member).");
    console.error("   After each scan, rename .worldauth.json → m1.json, m2.json, m3.json, m4.json");
    console.error(`   Look in: ${WORLD_AUTH_DIR}`);
    process.exit(1);
  }

  const m1Auth = JSON.parse(fs.readFileSync(M1_FILE, "utf-8"));
  const m2Auth = JSON.parse(fs.readFileSync(M2_FILE, "utf-8"));
  const m3Auth = JSON.parse(fs.readFileSync(M3_FILE, "utf-8"));
  const m4Auth = JSON.parse(fs.readFileSync(M4_FILE, "utf-8"));

  const auths = [m1Auth, m2Auth, m3Auth, m4Auth];
  for (const auth of auths) {
    if (!auth.nullifierHash || auth.nullifierHash === "agentbook_verified") {
      console.error("\n❌ ERROR: One of the human identity files contains an invalid placeholder nullifier.");
      process.exit(1);
    }
  }

  console.log("✅ All 4 Humans Verified via World ID.");
  console.log("   Generating real Ethereum wallets for the 4 deployers...\n");

  const deployers = {
    M1: generateMemberIdentity(1, "Member 1", m1Auth.nullifierHash, "Military & Journalism"),
    M2: generateMemberIdentity(2, "Member 2", m2Auth.nullifierHash, "Diplomacy & Humanitarian"),
    M3: generateMemberIdentity(3, "Member 3", m3Auth.nullifierHash, "Economics & Geopolitics"),
    M4: generateMemberIdentity(4, "Member 4 (Social Media Influencer)", m4Auth.nullifierHash, "Fabricated Intelligence")
  };

  fs.mkdirSync(path.dirname(DEPLOYERS_FILE), { recursive: true });
  fs.writeFileSync(DEPLOYERS_FILE, JSON.stringify(deployers, null, 2));

  console.log(`\n🎉 Success! Real identities generated and linked for all 4 Team Members.`);
  console.log(`   Saved to: ${DEPLOYERS_FILE}`);
  console.log("\nNext Steps:");
  console.log("1. Run `node generate_agents.js` to attach these identities to the 20 agents.");
  console.log("2. Use the Private Keys to deploy/mint on the ERC-8004 registry on Sepolia.");
}

function generateMemberIdentity(memberId, memberName, realNullifier, knowledgeDomain) {
  const wallet = ethers.Wallet.createRandom();

  console.log(`--- ${memberName} ---`);
  console.log(`Wallet Address: ${wallet.address}`);
  console.log(`Domain:         ${knowledgeDomain}`);
  console.log(`World ID Hash:  ${realNullifier.substring(0, 16)}...`);

  return {
    memberId,
    memberName,
    wallet: wallet.address,
    privateKey: wallet.privateKey,
    nullifierHash: realNullifier,
    knowledgeDomain
  };
}

linkWorldId();
