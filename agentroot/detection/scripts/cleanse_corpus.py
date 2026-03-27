import json
import os
import glob

def main():
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    public_data_dir = os.path.join(BASE_DIR, "..", "world-agents", "packages", "world-mini-app", "public", "data")
    knowledge_dir = os.path.join(BASE_DIR, "knowledge")
    
    # 1. Read Detection Report to find the Spy
    report_path = os.path.join(public_data_dir, "detection_report.json")
    if not os.path.exists(report_path):
        print(f"Error: Detection report not found at {report_path}")
        return

    with open(report_path, "r", encoding="utf-8") as f:
        report = json.load(f)
    
    spy_id = report.get("flagged_agent", {}).get("agent_id")
    spy_handle = report.get("flagged_agent", {}).get("handle")
    print(f"[*] Cleansing protocols engaged. Flagged Spy: {spy_handle} (ID: {spy_id}).")

    cleansed_context = "=== VERIFIED AGENTROOT KNOWLEDGE CORPUS ===\n\n"
    
    # 2. Load and append all knowledge supplements EXCEPT spy_fabricated.json
    cleansed_context += "--- GROUND TRUTH EXPERT KNOWLEDGE ---\n"
    knowledge_files = [
        "shared_base.json",
        "journalist_supplement.json",
        "military_supplement.json",
        "diplomat_supplement.json",
        "economist_supplement.json",
        "humanitarian_supplement.json",
        "academic_supplement.json"
    ]
    
    for k_file in knowledge_files:
        k_path = os.path.join(knowledge_dir, k_file)
        if os.path.exists(k_path):
            with open(k_path, "r", encoding="utf-8") as f:
                data = f.read()
                cleansed_context += f"================\nSource ({k_file}):\n{data}\n\n================\n"
        else:
            print(f"Warning: {k_path} not found.")

    # 3. Process Cycle JSONs and filter out Spy
    cleansed_context += "--- VERIFIED MULTI-AGENT SIMULATION DEBATE ---\n"
    
    cycle_files = sorted(glob.glob(os.path.join(public_data_dir, "cycle_*.json")))
    total_posts = 0
    removed_posts = 0

    for c_file in cycle_files:
        cycle_name = os.path.basename(c_file).split('.')[0]
        with open(c_file, "r", encoding="utf-8") as f:
            posts = json.load(f)
        
        cycle_has_posts = False
        cycle_text = ""
        for p in posts:
            total_posts += 1
            if p.get("agent_id") == spy_id:
                removed_posts += 1
                continue
            
            cycle_has_posts = True
            cycle_text += f"{p.get('handle')}: {p.get('content')}\n"
            
        if cycle_has_posts:
            cleansed_context += f"--- {cycle_name.upper()} ---\n"
            cleansed_context += cycle_text + "\n"

    print(f"[*] Cleansing complete. Total posts parsed: {total_posts}. Spy posts eradicated: {removed_posts}.")
    
    # 4. Save Cleansed Corpus
    output_path = os.path.join(public_data_dir, "cleansed_corpus.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({"context_string": cleansed_context}, f, indent=2)
        
    print(f"[*] Cleansed corpus saved to: {output_path}")

if __name__ == "__main__":
    main()
