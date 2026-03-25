# 🕵️ AgentRoot  — "Find the Spy"

**Human Accountability for Autonomous AI Agents — Powered by World ID**

> *PL_Genesis: Frontiers of Collaboration Hackathon*  
> Tracks: **World ID** | **Fresh Code** | **Filecoin Onchain Age**

---

## 🎯 The Problem

AI agents can spread misinformation at scale. When one does — **who is responsible?**

AgentRoot solves this by cryptographically binding every autonomous AI agent to a **verified human identity** using **World ID**. No personal data is revealed. Only a zero-knowledge proof connects the agent to its human deployer.

---

## 🌍 How World ID Powers AgentRoot

World ID is the **core identity layer** of the entire system. Without it, there is no accountability.

### The World ID Integration Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    WORLD ID ONBOARDING FLOW                      │
│                                                                  │
│  Human scans QR    World App       Nullifier hash    Deployer    │
│  with World App → verifies Orb → generated on-    → identity    │
│                    credential    chain (ZK proof)    created     │
│                                                                  │
│  ┌─────────┐     ┌──────────┐    ┌──────────────┐  ┌─────────┐ │
│  │ QR Code │ ──→ │ World    │ ─→ │ 0x0c988e7b.. │→ │ M1: 5   │ │
│  │ Scan #1 │     │ App      │    │ (nullifier)  │  │ agents  │ │
│  └─────────┘     │ Verify   │    └──────────────┘  └─────────┘ │
│  ┌─────────┐     │          │    ┌──────────────┐  ┌─────────┐ │
│  │ QR Code │ ──→ │          │ ─→ │ 0x1a4f29c3.. │→ │ M2: 4   │ │
│  │ Scan #2 │     │          │    │ (nullifier)  │  │ agents  │ │
│  └─────────┘     │          │    └──────────────┘  └─────────┘ │
│  ┌─────────┐     │          │    ┌──────────────┐  ┌─────────┐ │
│  │ QR Code │ ──→ │          │ ─→ │ 0x7b82d1e9.. │→ │ M3: 7   │ │
│  │ Scan #3 │     │          │    │ (nullifier)  │  │ agents  │ │
│  └─────────┘     │          │    └──────────────┘  └─────────┘ │
│  ┌─────────┐     │          │    ┌──────────────┐  ┌─────────┐ │
│  │ QR Code │ ──→ │          │ ─→ │ 0xN3d26c45.. │→ │ M4: 4   │ │
│  │ Scan #4 │     │          │    │ (nullifier)  │  │ agents  │ │
│  └─────────┘     └──────────┘    └──────────────┘  │ + 🕵️ SPY│ │
│                                                     └─────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### What We Built with World ID

| Component | Description |
|---|---|
| **World Auth MiniKit Server** | Local verification server (`world-auth/`) that generates QR codes for World App scanning |
| **Incognito Action: `verify-human`** | Each human scans a unique QR → World App returns a ZK-proof nullifier hash |
| **4 Real Human Verifications** | 4 team members each scanned with the World App, producing 4 unique cryptographic identities (`m1.json` – `m4.json`) |
| **`link_world_id.js`** | Reads the 4 World ID proofs, generates Ethereum wallets, and binds each nullifier to a deployer wallet |
| **`generate_agents.js`** | Assigns the 20 agents across the 4 verified humans, embedding nullifier hashes directly into each agent's identity |
| **On-Chain Binding** | Each agent's ERC-8004 registration is cryptographically linked to its deployer's World ID nullifier |
| **Delegation to IPFS** | Signed delegations (human → agent) anchored on Filecoin via Lighthouse |

### The Accountability Trace (World ID → Spy)

When `@eli_cohen` is detected as a misinformation agent, the trace chain resolves:

```
@eli_cohen (flagged by OpenClaw detection)
    → ERC-8004 Token #2386 (on-chain identity on Sepolia)  
    → 0x29390B1c...a7Bbe (deployer wallet from generate_agents.js)
    → 0xN3d2...6c45 (World ID nullifier hash from m4.json)
    → Member 4: "Social Media Influencer" (verified human)
```

**No personal data exposed.** Only the nullifier hash — a zero-knowledge proof that a unique human exists behind this agent.

### Why World ID Is Essential

| Without World ID | With World ID |
|---|---|
| Anyone can deploy agents under fake identities | Each deployer must prove they're a unique human |
| Sybil attacks: 1 person deploys 100 spy agents | Sybil-resistant: 1 human = 1 verified identity |
| "Who deployed this?" → Unknown | "Who deployed this?" → Cryptographic proof of a real person |
| Accountability is theoretical | Accountability is **mathematically enforced** |

---

## 🔗 World ID Configuration

```
App ID:      app_79b605f590e2039936e1e6c973be6da7
Action:      verify-human
RP ID:       rp_93a652528823d1ab
Credential:  World App (device-level verification)
```

Each verified human produces a `.worldauth.json` containing:
- `nullifierHash` — unique per human, per action (ZK proof)
- `agentId` — DID identity (`did:oasis:...`)
- `delegationCid` — IPFS CID of the signed human→agent delegation

---

## 🏗️ Full Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AgentRoot v5                         │
├─────────────┬──────────────┬──────────────┬─────────────┤
│  Identity   │  Simulation  │  Detection   │  Frontend   │
│  (World ID) │  (OASIS)     │  (OpenClaw)  │  (MiniApp)  │
├─────────────┼──────────────┼──────────────┼─────────────┤
│ 4 humans    │ 20 AI agents │ Cosine sim   │ World Mini  │
│ World App   │ GPT-4o-mini  │ ground truth │ App (React) │
│ QR verify   │ multi-cycle  │ comparison   │ Detection   │
│ nullifier   │ debate sim   │ spy flagging │ dashboard   │
│ binding     │              │              │ + chatbot   │
└──────┬──────┴──────────────┴──────┬───────┴─────────────┘
       │                           │
       ▼                           ▼
  ERC-8004 Registry           Filecoin/IPFS
  (Ethereum Sepolia)          (Lighthouse)
  8004scan.io                 Evidence + Delegations
```

---

## 📦 Project Structure

```
world-agents/
├── README.md                      # ← You are here
├── link_world_id.js               # Links World ID nullifiers to Ethereum wallets
├── generate_agents.js             # Creates 20 agents bound to verified humans
├── agentroot/
│   ├── deployers.json             # 4 verified humans + wallets + nullifiers
│   ├── agents/                    # 20 agent persona JSONs
│   │   └── erc8004_cards/         # ERC-8004 compliant agent cards
│   ├── contracts/                 # Hardhat project (Solidity)
│   │   ├── src/
│   │   │   ├── AgentRootRegistry.sol      # Custom contract (World ID + flagging)
│   │   │   └── AgentRootAccountability.sol # ERC-8004 wrapper
│   │   └── scripts/
│   │       ├── registerAgents.js          # Dual registration (official + custom)
│   │       ├── updateURIs.js              # Update metadata on registry
│   │       └── registration_results.json  # On-chain proof of registration
│   ├── detection/                 # OpenClaw misinformation detection
│   ├── simulation/                # OASIS multi-agent simulation
│   ├── chatbot/                   # FastAPI RAG chatbot
│   └── knowledge/                 # Ground truth & knowledge tiers
└── world-agents/packages/
    ├── world-mini-app/            # React frontend (World MiniKit)
    └── world-auth/                # World ID authentication
        ├── m1.json                # Human 1 World ID proof
        ├── m2.json                # Human 2 World ID proof
        ├── m3.json                # Human 3 World ID proof
        └── m4.json                # Human 4 World ID proof
```

---

## 🔗 On-Chain Deployments

| Component | Network | Address |
|---|---|---|
| **Official ERC-8004 Registry** | Ethereum Sepolia | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| **AgentRootRegistry** (custom) | Ethereum Sepolia | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| **20 Agents** | Ethereum Sepolia | Token IDs **#2367 – #2386** |
| **Agent Metadata** | Filecoin/IPFS | Lighthouse gateway |

**Browse our agents:** [8004scan.io](https://8004scan.io) → Owner `0x0F4547f4794f41820F29a50e90D44BF33c331602`

---

## 🧬 The 20 Agents

| # | Handle | Name | Category | Deployer | ERC-8004 ID |
|---|---|---|---|---|---|
| 1 | @reuters_amir | Amir Tehrani | Journalist | M1 | #2367 |
| 2 | @bbc_james | James Whitford | Journalist | M1 | #2368 |
| 3 | @def_analyst_sarah | Sarah Kovacs | Defence | M1 | #2369 |
| 4 | @diplomat_elena | Elena Vasquez | Diplomat | M2 | #2370 |
| 5 | @econ_raj | Raj Mehta | Economist | M3 | #2371 |
| 6 | @civilian_priya | Priya Sharma | Civilian | M1 | #2372 |
| 7 | @academic_lin | Lin Zhaowei | Academic | M2 | #2373 |
| 8 | @ap_fatima | Fatima Al-Rashid | Journalist | M1 | #2374 |
| 9 | @aljazeera_omar | Omar Khalil | Journalist | M2 | #2375 |
| 10 | @def_analyst_mark | Mark Sullivan | Defence | M3 | #2376 |
| 11 | @diplomat_yuki | Yuki Tanaka | Diplomat | M2 | #2377 |
| 12 | @humanitarian_anna | Anna Petrov | Humanitarian | M3 | #2378 |
| 13 | @civilian_chen | Chen Wei | Civilian | M3 | #2379 |
| 14 | @def_analyst_ivan | Ivan Volkov | Defence | M3 | #2380 |
| 15 | @diplomat_kwame | Kwame Asante | Diplomat | M3 | #2381 |
| 16 | @econ_sophie | Sophie Laurent | Economist | M3 | #2382 |
| 17 | @humanitarian_tariq | Tariq Hassan | Humanitarian | M4 | #2383 |
| 18 | @civilian_maria | Maria Santos | Civilian | M4 | #2384 |
| 19 | @academic_david | David Rothstein | Academic | M4 | #2385 |
| 20 | **@eli_cohen** 🕵️ | *Anonymous* | **SPY** | **M4** | **#2386** |

> **Member 4** deployed 4 agents — 3 honest + 1 spy. The system correctly flags only the spy without implicating the honest agents.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ | Python 3.10+ | Sepolia ETH

### 1. Install & Configure

```bash
npm install
cd agentroot/contracts && npm install
cp .env.example .env
# Fill: PRIVATE_KEY, OPENAI_API_KEY, LIGHTHOUSE_API_KEY, WORLD_APP_ID
```

### 2. Verify Humans with World ID

```bash
cd world-agents/packages/world-auth
npx tsx src/cli/index.ts verify
# Scan QR with World App → generates .worldauth.json
# Repeat 4 times, rename to m1.json, m2.json, m3.json, m4.json
```

### 3. Link Identities & Generate Agents

```bash
node link_world_id.js    # Binds World ID nullifiers → Ethereum wallets
node generate_agents.js  # Creates 20 agents bound to verified humans
```

### 4. Deploy & Register On-Chain

```bash
cd agentroot/contracts
npx hardhat compile
node scripts/deployCustom.js          # Deploy custom contract
node scripts/registerAgents.js        # Register on official ERC-8004
node scripts/updateURIs.js            # Update metadata with proper names
```

### 5. Build & Launch Unified Server

We have unified the React Frontend and FastAPI Backend into a single service for easier deployment.

```bash
# 1. Build the React Frontend
cd world-agents/packages/world-mini-app
npm install
npm run build

# 2. Start the Unified Backend (Serves API + Frontend)
cd ../../../agentroot/chatbot
pip install -r ../../requirements.txt
uvicorn chatbot_api:app --host 0.0.0.0 --port 8000
```

### 6. Access the Dashboard
Open your browser to **[http://localhost:8000](http://localhost:8000)**.
- The React App is served directly from the Python backend.
- Full RAG Chatbot and Live OASIS Simulation are integrated.

### 7. Production Deployment (Render)
This repository is configured for automated deployment to **Render.com**.
1. Create a new **Blueprint** on Render.
2. Connect this GitHub repository.
3. Add your `OPENAI_API_KEY` and `LIGHTHOUSE_API_KEY` to the environment variables.
4. Render will use `render.yaml` to build the React frontend and start the unified server automatically.

---

## 🔍 How Detection Works

1. **Ground Truth Comparison** — Each agent's posts compared against verified facts via cosine similarity.
2. **Anomaly Scoring** — Agents below the similarity threshold are flagged as suspicious.
3. **Fabrication Matching** — Flagged claims cross-referenced with known fabrication patterns.
4. **On-Chain Trace** — Flagged agent → ERC-8004 token → deployer wallet → **World ID nullifier** → human.
5. **Evidence Anchoring** — Full detection report uploaded to **Filecoin/IPFS** via Lighthouse.

---

## 🔑 Key Technologies

| Technology | Role in AgentRoot |
|---|---|
| **World ID** | Sybil-resistant human verification — the identity backbone |
| **ERC-8004** | On-chain AI agent identity registry (8004scan.io) |
| **Filecoin/IPFS** | Immutable evidence & delegation storage (Lighthouse) |
| **OpenAI GPT-4o-mini** | Multi-agent geopolitical debate simulation |
| **Hardhat + Solidity** | Smart contract development & deployment |
| **React + World MiniKit** | Frontend dashboard with World ID integration |
| **FastAPI** | RAG chatbot for post-detection knowledge querying |

---

## 🏆 Hackathon Tracks

### 🌍 World ID (Primary Track)
- 4 real human verifications via World App QR scanning
- Zero-knowledge nullifier hashes as the accountability anchor
- Sybil-resistant deployer identity without revealing personal data
- Full trace chain from flagged AI agent → verified human

### 🆕 Fresh Code
- Entire codebase written from scratch for this hackathon
- Novel combination: World ID + ERC-8004 + multi-agent forensics

### 🗄️ Filecoin Onchain Age
- Agent metadata stored on Filecoin/IPFS (Lighthouse)
- Detection evidence anchored with verifiable CIDs
- Signed human→agent delegations on IPFS

---

## 📜 License

MIT

---

*Built with 🔥 for PL_Genesis: Frontiers of Collaboration — March 2026*
