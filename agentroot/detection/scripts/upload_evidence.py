"""
AgentRoot v5 — IPFS Evidence Upload + Manifest Generator
Uploads all evidence files to Filecoin/IPFS via Lighthouse SDK
and generates an ipfs_manifest.json with all CIDs.

Requires: LIGHTHOUSE_API_KEY in .env
Requires: pip install lighthouseweb3
"""
import json
import os
import sys
import glob

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MINIAPP_DATA = os.path.join(
    BASE_DIR, "..", "world-agents", "packages", "world-mini-app", "public", "data"
)

# Load API key from root .env
ENV_PATH = os.path.join(BASE_DIR, "..", ".env")
LIGHTHOUSE_API_KEY = None
if os.path.exists(ENV_PATH):
    with open(ENV_PATH, "r") as f:
        for line in f:
            if line.strip().startswith("LIGHTHOUSE_API_KEY"):
                LIGHTHOUSE_API_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")


def upload_file(lh, filepath):
    """Upload a single file to Lighthouse and return the CID."""
    try:
        response = lh.upload(filepath)
        data = {}
        if isinstance(response, list) and len(response) > 0:
            data = response[0].get('data', {})
        elif isinstance(response, dict):
            data = response.get('data', {})
        cid = data.get("Hash", "")
        return cid
    except Exception as e:
        print(f"  ❌ Upload failed for {os.path.basename(filepath)}: {e}")
        return None


def upload_all_evidence():
    print("=" * 60)
    print("  Lighthouse IPFS Evidence Upload + Manifest")
    print("=" * 60)

    if not LIGHTHOUSE_API_KEY:
        print("❌ LIGHTHOUSE_API_KEY not found in .env")
        sys.exit(1)

    try:
        from lighthouseweb3 import Lighthouse
        lh = Lighthouse(token=LIGHTHOUSE_API_KEY)
    except ImportError:
        print("❌ 'lighthouseweb3' library not installed. Run: pip install lighthouseweb3")
        sys.exit(1)

    # Files to upload (whitepaper Table 5)
    files_to_upload = []

    # Detection report
    report_path = os.path.join(MINIAPP_DATA, "detection_report.json")
    if os.path.exists(report_path):
        files_to_upload.append(("detection_report.json", report_path))

    # Cycle files
    for cf in sorted(glob.glob(os.path.join(MINIAPP_DATA, "cycle_*.json"))):
        files_to_upload.append((os.path.basename(cf), cf))

    # Agents manifest
    agents_path = os.path.join(MINIAPP_DATA, "agents.json")
    if os.path.exists(agents_path):
        files_to_upload.append(("agents.json", agents_path))

    # Cleansed corpus
    cleansed_path = os.path.join(MINIAPP_DATA, "cleansed_corpus.json")
    if os.path.exists(cleansed_path):
        files_to_upload.append(("cleansed_corpus.json", cleansed_path))

    print(f"\nUploading {len(files_to_upload)} files to Filecoin/IPFS...")
    print(f"Using Lighthouse API Key: {LIGHTHOUSE_API_KEY[:8]}...{LIGHTHOUSE_API_KEY[-4:]}\n")

    manifest = {}
    for name, filepath in files_to_upload:
        print(f"  📤 Uploading {name}...", end=" ")
        cid = upload_file(lh, filepath)
        if cid:
            manifest[name] = {
                "cid": cid,
                "ipfs_url": f"ipfs://{cid}",
                "gateway": f"https://gateway.lighthouse.storage/ipfs/{cid}",
            }
            print(f"✅ {cid}")
        else:
            print("❌ Failed")

    # Save manifest
    manifest_path = os.path.join(MINIAPP_DATA, "ipfs_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\n📄 IPFS manifest saved to {manifest_path}")
    print(f"   Total files uploaded: {len(manifest)}/{len(files_to_upload)}")

    # Also update detection report with CID if it was uploaded
    if "detection_report.json" in manifest:
        cid = manifest["detection_report.json"]["cid"]
        with open(report_path, "r", encoding="utf-8") as rf:
            report = json.load(rf)
        report["ipfs_cid"] = f"ipfs://{cid}"
        report["lighthouse_gateway"] = f"https://gateway.lighthouse.storage/ipfs/{cid}"
        with open(report_path, "w", encoding="utf-8") as wf:
            json.dump(report, wf, indent=2)
        print(f"\n   Detection report CID appended: ipfs://{cid}")

    return manifest


if __name__ == "__main__":
    upload_all_evidence()
