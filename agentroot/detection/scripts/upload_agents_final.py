import os
import json
import sys
from lighthouseweb3 import Lighthouse

# SETTINGS
AGENTS_DIR = r"d:\download\world-agents\agentroot\agents"
ENV_PATH = r"d:\download\world-agents\.env"
MAP_PATH = r"d:\download\world-agents\agentroot\contracts\scripts\agent_cids.json"

# Load API key
LIGHTHOUSE_API_KEY = None
if os.path.exists(ENV_PATH):
    with open(ENV_PATH, "r") as f:
        for line in f:
            if "LIGHTHOUSE_API_KEY" in line:
                LIGHTHOUSE_API_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")

def upload_agents():
    if not LIGHTHOUSE_API_KEY:
        print("❌ LIGHTHOUSE_API_KEY not found in .env")
        sys.exit(1)

    lh = Lighthouse(token=LIGHTHOUSE_API_KEY)
    
    agent_files = [f for f in os.listdir(AGENTS_DIR) if f.startswith("agent_") and f.endswith(".json")]
    agent_files.sort()

    print(f"Found {len(agent_files)} agents in {AGENTS_DIR}")
    
    cid_map = {}

    for file in agent_files:
        path = os.path.join(AGENTS_DIR, file)
        print(f"Uploading {file}...")
        try:
            response = lh.upload(path)
            # Handle response (list or dict)
            data = {}
            if isinstance(response, list) and len(response) > 0:
                data = response[0].get('data', {})
            elif isinstance(response, dict):
                data = response.get('data', {})
            
            cid = data.get("Hash")
            if cid:
                print(f"  ✅ {file} -> {cid}")
                cid_map[file] = cid
            else:
                print(f"  ⚠️  No CID in response for {file}: {response}")
        except Exception as e:
            print(f"  ❌ Error uploading {file}: {e}")

    # Save the map
    with open(MAP_PATH, "w") as f:
        json.dump(cid_map, f, indent=2)
    
    print(f"\n✅ Created CID map at {MAP_PATH}")

if __name__ == "__main__":
    upload_agents()
