---
description: how to run AgentRoot detection through the OpenClaw CLI
---

# Running AgentRoot Detection via OpenClaw

Follow these steps to integrate the AgentRoot detection logic as a native Skill in your OpenClaw environment.

## 1. Onboard the Skill
OpenClaw needs to recognize the `agentroot/detection` folder as a functional workspace.

```bash
# Navigate to your project root
cd /path/to/world-agents

# Onboard the detection folder as an OpenClaw skill
openclaw skills onboard ./agentroot/detection
```

## 2. Initialize the Gateway
The OpenClaw Gateway must be running to handle the LLM routing and agent orchestration.

```bash
# Start the OpenClaw Gateway in the background or a new terminal
openclaw gateway --force
```

## 3. Run the Detection Agent
Now you can trigger the "Find the Spy" forensic analysis directly via the CLI.

```bash
# Trigger the detection agent turn
openclaw agent --message "Run AgentRoot detection" --deliver
```

## 4. Verify Results
OpenClaw will execute the Python logic, generate the `detection_report.json`, and perform the on-chain trace. You can verify the output in the MiniApp Dashboard or by checking the IPFS CID directly.

```bash
# View the local report
cat ./world-agents/packages/world-mini-app/public/data/detection_report.json
```
