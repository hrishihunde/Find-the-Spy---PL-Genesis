const fs = require('fs');
const path = require('path');

const agentsDir = path.join(__dirname, 'agentroot', 'agents');
const targetFile = path.join(__dirname, 'world-agents', 'packages', 'world-mini-app', 'public', 'data', 'agents.json');

const files = fs.readdirSync(agentsDir).filter(f => f.startsWith('agent_') && f.endsWith('.json'));
const agents = [];

files.sort().forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(agentsDir, file), 'utf8'));
    agents.push(data);
});

fs.writeFileSync(targetFile, JSON.stringify(agents, null, 2));
console.log(`Updated ${targetFile} with ${agents.length} agents.`);
