import os
import json
import asyncio
import glob
from fastapi import FastAPI, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI

# Load root .env file for OPENAI_API_KEY
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
env_path = os.path.join(root_dir, ".env")
load_dotenv(env_path)

# Delay OASIS imports until needed since it requires Python 3.10+
import importlib

app = FastAPI(title="AgentRoot V5 Chatbot & Live Simulation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Serve React Frontend ---
DIST_DIR = os.path.join(root_dir, "world-agents", "packages", "world-mini-app", "dist")

# We mount StaticFiles later so API routes take precedence, 
# and we add a catch-all route at the bottom of the file to serve index.html for React Router.

class ChatRequest(BaseModel):
    question: str

class CycleRequest(BaseModel):
    cycle: int

# --- Cleansed corpus ---
MINI_APP_DATA = os.path.join(root_dir, "world-agents", "packages", "world-mini-app", "public", "data")
AGENTS_DIR = os.path.join(root_dir, "agentroot", "agents")
KNOWLEDGE_DIR = os.path.join(root_dir, "knowledgemd")

DB_PATH = os.path.join(root_dir, "agentroot", "live_simulation.db")
PROFILE_PATH = os.path.join(root_dir, "agentroot", "simulation", "live_oasis_profiles.json")

try:
    corpus_path = os.path.join(MINI_APP_DATA, "cleansed_corpus.json")
    with open(corpus_path, "r", encoding="utf-8") as f:
        corpus_data = json.load(f)
        CLEANSED_CONTEXT = corpus_data.get("context_string", "")
    print("[*] Cleansed Corpus Loaded successfully.")
except Exception as e:
    CLEANSED_CONTEXT = ""
    print(f"Error loading cleansed corpus: {e}")

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ── Global Live Simulation State ──────────────────────────────────────────────
live_oasis_env = None
live_current_cycle = 0

SEED_POST = (
    "BREAKING: Iran launches coordinated drone and missile strike targeting "
    "Israeli military installations in the Negev desert. US confirms deployment "
    "of additional carrier strike group to Eastern Mediterranean. Developing story."
)

CATEGORY_MBTI = {
    "journalist": "ISTJ", "defence": "INTJ", "diplomat": "ENFJ",
    "economist": "ENTJ", "humanitarian": "INFJ", "academic": "INTP",
    "civilian": "ISFP", "spy": "ENTP",
}
CATEGORY_DEMOGRAPHICS = {
    "journalist": {"gender": "Male", "age": "38", "country": "Iran"},
    "defence": {"gender": "Female", "age": "42", "country": "USA"},
    "diplomat": {"gender": "Female", "age": "45", "country": "Spain"},
    "economist": {"gender": "Male", "age": "35", "country": "India"},
    "humanitarian": {"gender": "Female", "age": "40", "country": "Ukraine"},
    "academic": {"gender": "Male", "age": "50", "country": "China"},
    "civilian": {"gender": "Female", "age": "28", "country": "India"},
    "spy": {"gender": "Male", "age": "33", "country": "Unknown"},
}

def build_oasis_profiles():
    agents = []
    agent_mapping = {} # To track agentId to handles for later post formatting
    for f in sorted(glob.glob(os.path.join(AGENTS_DIR, "*.json"))):
        with open(f, "r") as fh:
            data = json.load(fh)
        
        agent_id = data["agentId"]
        is_spy = data.get("isSpy", False)
        agent_mapping[agent_id] = {
            "handle": data["handle"],
            "is_spy": is_spy
        }

        knowledge_text = ""
        sb_path = os.path.join(KNOWLEDGE_DIR, "shared_base.md")
        if os.path.exists(sb_path):
            with open(sb_path, "r", encoding="utf-8") as kb:
                knowledge_text += "VERIFIED FACTS:\n" + kb.read() + "\n\n"

        tier_raw = data.get("simulation", {}).get("knowledgeTier", "shared_base")
        supplement_name = None
        if "+" in tier_raw:
            parts = [p.strip() for p in tier_raw.split("+")]
            for p in parts:
                if p != "shared_base":
                    supplement_name = p
        elif tier_raw != "shared_base" and tier_raw != "spy_fabricated":
            supplement_name = tier_raw

        if supplement_name:
            supplement_file = os.path.join(KNOWLEDGE_DIR, f"{supplement_name}.md")
            if os.path.exists(supplement_file):
                with open(supplement_file, "r", encoding="utf-8") as sf:
                    knowledge_text += "SPECIALIST CONTEXT:\n" + sf.read()

        if is_spy:
            sf_path = os.path.join(KNOWLEDGE_DIR, "spy_fabricated.md")
            if os.path.exists(sf_path):
                with open(sf_path, "r", encoding="utf-8") as sf:
                    knowledge_text = "YOUR VERIFIED INTELLIGENCE:\n" + sf.read()

        category = data.get("category", "civilian").lower()
        demographics = CATEGORY_DEMOGRAPHICS.get(category, {"gender": "Unknown", "age": "30", "country": "Unknown"})

        persona = (
            f"You are {data.get('displayName') or data['handle']}, a {category} "
            f"affiliated with {data.get('affiliation') or 'independent'}. "
            f"Your posting style: {data.get('postingStyle', 'analytical and factual')}. "
            f"You are discussing a breaking news event. "
            f"Base your posts ONLY on this knowledge:\n\n{knowledge_text}"
        )

        profile = {
            "username": data["handle"].replace("@", ""),
            "bio": data.get("bio", ""),
            "persona": persona,
            "mbti": CATEGORY_MBTI.get(category, "ISTJ"),
            "gender": demographics["gender"],
            "age": demographics["age"],
            "country": demographics["country"],
        }
        agents.append(profile)

    with open(PROFILE_PATH, "w") as out:
        json.dump(agents, out, indent=2)
    return PROFILE_PATH, agent_mapping


async def initialize_oasis():
    global live_oasis_env, live_current_cycle
    print("Initializing Live OASIS Engine...")
    profile_path, _ = build_oasis_profiles()
    
    # Import oasis dynamically here
    try:
        import oasis
        from camel.models import ModelFactory
        from camel.types import ModelPlatformType, ModelType
        from oasis import ActionType, ManualAction, generate_reddit_agent_graph
    except ImportError:
        print("[!] camel-oasis not found. Live simulation will be disabled. Use Python 3.10+.")
        return None, None

    openai_model = ModelFactory.create(
        model_platform=ModelPlatformType.OPENAI,
        model_type=ModelType.GPT_4O_MINI,
    )
    
    available_actions = [
        ActionType.LIKE_POST, ActionType.DISLIKE_POST,
        ActionType.CREATE_POST, ActionType.CREATE_COMMENT,
        ActionType.LIKE_COMMENT, ActionType.DISLIKE_COMMENT,
        ActionType.SEARCH_POSTS, ActionType.REFRESH, ActionType.DO_NOTHING,
    ]

    agent_graph = await generate_reddit_agent_graph(
        profile_path=profile_path,
        model=openai_model,
        available_actions=available_actions,
    )

    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    env = oasis.make(
        agent_graph=agent_graph,
        platform=oasis.DefaultPlatformType.REDDIT,
        database_path=DB_PATH,
    )
    await env.reset()

    # Seed cycle 1
    try:
        from oasis import ActionType, ManualAction
        seed_actions = {}
        seed_actions[env.agent_graph.get_agent(0)] = [
            ManualAction(
                action_type=ActionType.CREATE_POST,
                action_args={"content": SEED_POST},
            )
        ]
        await env.step(seed_actions)
        
        live_oasis_env = env
        live_current_cycle = 1
        print("Live OASIS Engine Ready (Cycle 1 Seeded).")
    except ImportError:
        return None, None


# ── Chat endpoint ──────────────────────────────────────────────────────────────

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    
    system_prompt = f"""You are the AgentRoot Phase 5 Verified Knowledge Chatbot.
Your task is to answer the user's question using ONLY the provided verified corpus.
This corpus is entirely fact-checked and cleansed of all misinformation or spy payloads. 
The surviving 19 agents and the supplemental documents are the ONLY ground truth you can use.

CRITICAL REQUIREMENT:
When you answer the question, you MUST cite which specific honest agents (e.g., @reuters_amir, @def_analyst_sarah) or which Source files contributed the relevant facts. Be extremely specific with your citations, as identifying the clean sources is the entire point of this chatbot.

--- CLEANSED CORPUS BEGIN ---
{CLEANSED_CONTEXT}
--- CLEANSED CORPUS END ---
"""

    if not CLEANSED_CONTEXT:
        return {"answer": "Error: Cleansed knowledge corpus not found. Please run the cleansing pipeline."}

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.question}
            ],
            temperature=0.3
        )
        answer = response.choices[0].message.content
        return {"answer": answer}
    except Exception as e:
        return {"answer": f"Error fulfilling request: {e}"}

# ── Simulation endpoints ───────────────────────────────────────────────────────

@app.post("/simulation/init")
async def simulation_init():
    """Initializes the live OASIS environment and seeds Cycle 1."""
    if live_oasis_env is not None:
        return {"status": "already initialized", "current_cycle": live_current_cycle}
    
    try:
        res = await initialize_oasis()
        if res is None:
             return {"error": "camel-oasis not installed. Running in fallback mode (loading JSONs)."}
        return {"status": "initialized", "current_cycle": live_current_cycle}
    except Exception as e:
        return {"error": str(e)}

@app.post("/simulation/run-cycle")
async def run_cycle(req: CycleRequest):
    """
    Runs ONE LIVE cycle of the OASIS simulation.
    Warning: Uses real LLM calls (takes 30-60s).
    """
    global live_oasis_env, live_current_cycle

    target_cycle = req.cycle

    # Fallback to init if missing state
    if live_oasis_env is None:
        try:
            res = await initialize_oasis()
            if res is None:
                # FALLBACK: Serve pre-computed JSON if oasis is missing
                print("[*] Falling back to pre-computed JSON for Cycle", target_cycle)
                cycle_file = os.path.join(MINI_APP_DATA, f"cycle_{str(target_cycle).zfill(2)}.json")
                if os.path.exists(cycle_file):
                    with open(cycle_file, "r", encoding="utf-8") as f:
                        return {"cycle": target_cycle, "posts": json.load(f), "fallback": True}
                return {"error": "Simulation engine (oasis) missing and no fallback JSON found."}
        except:
             pass
    if target_cycle <= live_current_cycle:
        return {"error": f"Cycle {target_cycle} already completed.", "posts": []}

    try:
        print(f"Running Live Cycle {target_cycle}...")
        from oasis import LLMAction  # import here
        llm_actions = {
            agent: LLMAction()
            for _, agent in live_oasis_env.agent_graph.get_agents()
        }
        
        # This is where the 30-60s wait happens as 20 agents generate actions
        await live_oasis_env.step(llm_actions)
        live_current_cycle = target_cycle
        print(f"Live Cycle {target_cycle} complete.")

        # Read the SQLite DB to fetch the newly generated posts
        import sqlite3
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        
        cur.execute("SELECT post_id as id, user_id, content, created_at, num_likes FROM post ORDER BY created_at DESC LIMIT 20")
        raw_posts = [dict(r) for r in cur.fetchall()]
        
        # Load mapping to inject Handles and Spy status
        _, agent_mapping = build_oasis_profiles()
        
        formatted_posts = []
        for p in reversed(raw_posts): # Put in chronological order
            a_idx = p['user_id'] + 1 # SQLite user_id starts at 0, our agentId starts at 1
            mapping = agent_mapping.get(a_idx, {"handle": f"@agent_{a_idx}", "is_spy": False})
            
            formatted_posts.append({
                "id": str(p['id']),
                "cycle": target_cycle,
                "agent_id": a_idx,
                "handle": mapping["handle"],
                "content": p['content'],
                "likes": p['num_likes'],
                "dislikes": 0,
                "reports": 0,
                "is_spy": mapping["is_spy"]
            })
            
        conn.close()

        return {"cycle": target_cycle, "posts": formatted_posts, "count": len(formatted_posts)}

    except Exception as e:
        print(f"Error in Live Cycle: {e}")
        return {"error": str(e), "posts": []}


# --- Serve React SPA Catch-all ---
# Must be at the very bottom so it doesn't override API routes
app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets"), html=True), name="assets")
app.mount("/data", StaticFiles(directory=os.path.join(DIST_DIR, "data"), html=True), name="data")

@app.get("/{full_path:path}")
async def serve_react_app(request: Request, full_path: str):
    # Try to serve a specific file if it exists in dist
    file_path = os.path.join(DIST_DIR, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Otherwise fallback to index.html for React Router
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
        
    return {"error": "Frontend build not found. Please run npm run build in world-mini-app."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

