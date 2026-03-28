/**
 * Generate ERC-8004 compliant agent cards from our custom agent JSONs
 * Then upload to IPFS and update URIs on the official registry
 */
const fs = require("fs");
const path = require("path");

const AGENTS_DIR = path.resolve(__dirname, "../../agents");
const CARDS_DIR = path.resolve(__dirname, "../../agents/erc8004_cards");

// Create output dir
if (!fs.existsSync(CARDS_DIR)) fs.mkdirSync(CARDS_DIR, { recursive: true });

const agentFiles = fs.readdirSync(AGENTS_DIR)
  .filter(f => f.startsWith("agent_") && f.endsWith(".json"))
  .sort();

console.log(`Converting ${agentFiles.length} agents to ERC-8004 format...\n`);

for (const file of agentFiles) {
  const agent = JSON.parse(fs.readFileSync(path.join(AGENTS_DIR, file), "utf-8"));

  // Build ERC-8004 compliant agent card
  const card = {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: agent.displayName || agent.handle.replace("@", ""),
    description: [
      agent.bio,
      agent.affiliation ? `Affiliation: ${agent.affiliation}` : null,
      `Category: ${agent.category}`,
      `Knowledge Focus: ${agent.knowledgeFocus}`
    ].filter(Boolean).join(" | "),
    services: [
      { name: "CUSTOM", endpoint: `https://agentroot.xyz/agent/${agent.handle.replace("@", "")}` }
    ],
    // Extra metadata for AgentRoot
    agentroot: {
      handle: agent.handle,
      category: agent.category,
      affiliation: agent.affiliation,
      isSpy: agent.isSpy || false,
      deployer: {
        memberId: agent.deployer?.memberId,
        nullifierHash: agent.deployer?.nullifierHash
      }
    }
  };

  const outPath = path.join(CARDS_DIR, file);
  fs.writeFileSync(outPath, JSON.stringify(card, null, 2));
  console.log(`✅ ${file} → name: "${card.name}"`);
}

console.log(`\n📁 Cards saved to: ${CARDS_DIR}`);
console.log(`\nNext: Upload these to IPFS, then call setAgentURI() on the official registry.`);
