---
name: agentroot-detection
description: Detect misinformation agents in multi-agent simulations, trace them through ERC-8004 on-chain registry, cleanse corrupted knowledge corpuses, and upload evidence to IPFS. Use when: (1) Analyzing simulation posts for misinformation, (2) Fact-checking agent content against ground truth, (3) Tracing flagged agents to their human deployers via blockchain, (4) Cleansing knowledge bases of spy/fabricated content, (5) Uploading detection reports to decentralized storage.
---

# AgentRoot Detection Skill

This skill provides tools for detecting, tracing, and cleansing misinformation in multi-agent simulations with on-chain accountability.

## Overview

The detection system operates on AgentRoot v4 architecture:
- **Detection**: Fact-checks agent posts against ground truth (Tier 1 shared base)
- **Tracing**: Resolves flagged agents through ERC-8004 registry to human deployers
- **Cleansing**: Removes spy-contaminated content from knowledge corpus
- **Evidence**: Uploads reports to Filecoin/IPFS via Lighthouse

## Scripts

### `scripts/openclaw_detect.py`
Main detection orchestrator. Reads from SQLite simulation DB, flags agents with 2+ false posts, traces them to deployers.

**Usage:**
```bash
python scripts/openclaw_detect.py
```

**Prerequisites:**
- `simulation.db` must exist (run simulation first)
- `knowledge/shared_base.json` for ground truth
- `agents/*.json` for agent metadata

**Output:** `detection_report.json` with flagged agents and trace chains.

### `scripts/openclaw_trace.py`
Standalone trace execution for already-flagged agents. Appends accountability chain to existing report.

**Usage:**
```bash
python scripts/openclaw_trace.py
```

### `scripts/cleanse_corpus.py`
Removes all posts from flagged spy agents across cycle JSONs. Rebuilds verified knowledge corpus.

**Usage:**
```bash
python scripts/cleanse_corpus.py
```

**Output:** `cleansed_corpus.json` with spy content removed.

### `scripts/upload_evidence.py`
Uploads detection report to Filecoin/IPFS via Lighthouse SDK.

**Usage:**
```bash
python scripts/upload_evidence.py
```

**Prerequisites:**
- `LIGHTHOUSE_API_KEY` in `.env` file
- `lighthouseweb3` Python package installed

## Workflow

1. **Run Detection**
   ```bash
   python scripts/openclaw_detect.py
   ```
   This checks all posts, flags agents with ≥2 false posts, generates report.

2. **Review Report**
   Check `detection_report.json` for flagged agents and trace results.

3. **Cleansing (Optional)**
   If spy contamination confirmed:
   ```bash
   python scripts/cleanse_corpus.py
   ```

4. **Upload Evidence (Optional)**
   For permanent decentralized record:
   ```bash
   python scripts/upload_evidence.py
   ```

## Key Files

| Path | Purpose |
|------|---------|
| `simulation.db` | SQLite DB with all agent posts |
| `knowledge/shared_base.json` | Ground truth facts (Tier 1) |
| `agents/*.json` | Agent metadata with deployer info |
| `detection_report.json` | Output: flagged agents + traces |
| `cleansed_corpus.json` | Output: cleaned knowledge base |

## Detection Logic

Posts are flagged when they contain known fabrications:
- "300 drones" → contradicts IDF report of 32 drones
- "carrier withdrawn" → contradicts USS Eisenhower on station
- "2,400 casualties" → contradicts official 3 killed, 47 injured
- "ceasefire signed" → contradicts ongoing UN session

Threshold: 2+ false posts flags an agent for tracing.

## Trace Chain

For flagged agents, the trace resolves:
1. Agent handle and ID
2. ERC-8004 Token ID on Sepolia
3. Minting wallet address
4. World ID Nullifier (via delegation)
5. Verified human deployer identity
