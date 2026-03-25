"""
AgentRoot v5 — Export OASIS simulation data to JSON for MiniApp.
Reads from the real OASIS SQLite database (user + post tables)
and exports per-cycle JSON files + agents.json.

The OASIS DB schema:
  - user: user_id, agent_id, user_name, name, bio, created_at, num_followings, num_followers
  - post: post_id, user_id, content, created_at, num_likes, num_dislikes, num_shares, num_reports
"""
import sqlite3
import json
import os
import glob
import math

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# The DB is saved to agentroot/simulation.db
DB_PATH = os.path.join(BASE_DIR, 'simulation.db')
OUTPUT_DIR = os.path.join(BASE_DIR, '..', 'world-agents', 'packages', 'world-mini-app', 'public', 'data')
NUM_CYCLES = 10
NUM_AGENTS = 20


def export_data():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR, exist_ok=True)

    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Load user mapping (agent_id -> user_name)
        cur.execute("SELECT user_id, agent_id, user_name, name FROM user ORDER BY user_id")
        users = {row['user_id']: dict(row) for row in cur.fetchall()}

        # Load all posts
        cur.execute("SELECT post_id as id, user_id, content, created_at, num_likes, num_dislikes FROM post")
        all_content = [dict(r) for r in cur.fetchall()]
        
        # Load all comments
        cur.execute("SELECT comment_id as id, user_id, content, created_at, num_likes, num_dislikes FROM comment")
        all_content.extend([dict(r) for r in cur.fetchall()])
        conn.close()
    except sqlite3.OperationalError as e:
        print(f"Database error: {e}. Skipping export.")
        return

    if not all_content:
        print("No posts or comments found in database.")
        return

    # Sort all content by created_at time to simulate a unified timeline
    all_content.sort(key=lambda x: x['created_at'])

    # Load agent data for spy flagging
    agents_dir = os.path.join(BASE_DIR, 'agents')
    spy_agent_ids = set()
    agent_handles = {}
    if os.path.exists(agents_dir):
        for file in sorted(glob.glob(os.path.join(agents_dir, '*.json'))):
            with open(file, 'r') as f:
                agent_data = json.load(f)
                agent_id = agent_data['agentId']
                agent_handles[agent_id] = agent_data['handle']
                if agent_data.get('isSpy'):
                    spy_agent_ids.add(agent_id)

    # Distribute posts into cycles.
    posts_per_cycle = max(1, math.ceil((len(all_content) - 1) / (NUM_CYCLES - 1))) if len(all_content) > 1 else 1

    cycles = {}
    for idx, item in enumerate(all_content):
        if idx == 0:
            cycle_num = 1
        else:
            cycle_num = min(2 + (idx - 1) // posts_per_cycle, NUM_CYCLES)

        user = users.get(item['user_id'], {})
        agent_id = user.get('agent_id', item['user_id'])
        handle = agent_handles.get(agent_id + 1, f"@agent_{agent_id}")  

        formatted_post = {
            "id": f"{item['id']}_{item['created_at']}", # Ensure unique ID
            "cycle": cycle_num,
            "agent_id": agent_id + 1,  
            "handle": handle,
            "content": item['content'],
            "likes": item['num_likes'],
            "dislikes": item.get('num_dislikes', 0),
            "reports": 0,
            "is_spy": (agent_id + 1) in spy_agent_ids,
        }

        if cycle_num not in cycles:
            cycles[cycle_num] = []
        cycles[cycle_num].append(formatted_post)

    # Write cycle JSONs
    for cycle_num, posts in cycles.items():
        out_file = os.path.join(OUTPUT_DIR, f'cycle_{cycle_num:02d}.json')
        with open(out_file, 'w') as f:
            json.dump(posts, f, indent=2)

    # Clean up any old cycle files that no longer exist
    for i in range(1, 11):
        old_file = os.path.join(OUTPUT_DIR, f'cycle_{i:02d}.json')
        if i not in cycles and os.path.exists(old_file):
            os.remove(old_file)

    # Export agents.json for frontend
    if os.path.exists(agents_dir):
        all_agents = []
        for file in sorted(glob.glob(os.path.join(agents_dir, '*.json'))):
            with open(file, 'r') as f:
                agent_data = json.load(f)
                # Filter out sensitive spy info for public frontend
                frontend_agent = {k: v for k, v in agent_data.items()
                                  if k not in ['bio_internal', 'fabrications', 'deployer']}
                all_agents.append(frontend_agent)
        with open(os.path.join(OUTPUT_DIR, 'agents.json'), 'w') as f:
            json.dump(all_agents, f, indent=2)

    print(f"Exported {len(cycles)} cycles ({len(all_content)} total posts/comments) and agents to {OUTPUT_DIR}")


if __name__ == '__main__':
    export_data()
