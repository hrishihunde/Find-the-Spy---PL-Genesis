import os
import json
import sys
from lighthouseweb3 import Lighthouse

CARDS_DIR = r"d:\download\world-agents\agentroot\agents\erc8004_cards"
ENV_PATH = r"d:\download\world-agents\.env"
MAP_PATH = r"d:\download\world-agents\agentroot\contracts\scripts\agent_cids_v2.json"

# Load API key
LIGHTHOUSE_API_KEY = None
with open(ENV_PATH, "r") as f:
    for line in f:
        if "LIGHTHOUSE_API_KEY" in line:
            LIGHTHOUSE_API_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")

def upload():
    if not LIGHTHOUSE_API_KEY:
        print("No LIGHTHOUSE_API_KEY"); sys.exit(1)
    lh = Lighthouse(token=LIGHTHOUSE_API_KEY)
    files = sorted([f for f in os.listdir(CARDS_DIR) if f.endswith(".json")])
    print(f"Uploading {len(files)} ERC-8004 cards...\n")
    cid_map = {}
    for file in files:
        path = os.path.join(CARDS_DIR, file)
        try:
            response = lh.upload(path)
            data = response[0].get('data', {}) if isinstance(response, list) else response.get('data', {})
            cid = data.get("Hash")
            if cid:
                print(f"  ✅ {file} -> {cid}")
                cid_map[file] = cid
        except Exception as e:
            print(f"  ❌ {file}: {e}")
    with open(MAP_PATH, "w") as f:
        json.dump(cid_map, f, indent=2)
    print(f"\n✅ Saved CID map to {MAP_PATH}")

if __name__ == "__main__":
    upload()
