"""
AgentRoot v5 — Real OASIS Simulation Runner
Uses the camel-oasis library to run 20 agents on a Reddit-like platform.
Requires: pip install camel-oasis (Python 3.10+)
Requires: OPENAI_API_KEY environment variable
"""
import asyncio
import json
import os
import glob
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(os.path.dirname(BASE_DIR), ".env"))

from camel.models import ModelFactory
from camel.types import ModelPlatformType, ModelType

import oasis
from oasis import (
    ActionType,
    LLMAction,
    ManualAction,
    generate_reddit_agent_graph,
)

AGENTS_DIR = os.path.join(BASE_DIR, "agents")
KNOWLEDGE_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "knowledgemd"))
DB_PATH = os.path.join(BASE_DIR, "simulation.db")
PROFILE_PATH = os.path.join(BASE_DIR, "simulation", "oasis_profiles.json")

# Seed post from the whitepaper
SEED_POST = (
    "BREAKING: Iran launches coordinated drone and missile strike targeting "
    "Israeli military installations in the Negev desert. US confirms deployment "
    "of additional carrier strike group to Eastern Mediterranean. Developing story."
)

# Map agent categories to MBTI types for OASIS profile requirement
CATEGORY_MBTI = {
    "journalist": "ISTJ",
    "defence": "INTJ",
    "diplomat": "ENFJ",
    "economist": "ENTJ",
    "humanitarian": "INFJ",
    "academic": "INTP",
    "civilian": "ISFP",
    "spy": "ENTP",
}

# Map agent categories to plausible demographics
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
    """Convert our 20 agent JSONs into the OASIS generate_reddit_agent_graph format.
    
    OASIS expects a JSON array where each element has:
      - username, bio, persona, mbti, gender, age, country
    """
    agents = []
    for f in sorted(glob.glob(os.path.join(AGENTS_DIR, "*.json"))):
        with open(f, "r") as fh:
            data = json.load(fh)

        # Load knowledge tier artifacts (MARKDOWN FILES)
        knowledge_text = ""
        with open(os.path.join(KNOWLEDGE_DIR, "shared_base.md"), "r", encoding="utf-8") as kb:
            knowledge_text += "VERIFIED FACTS:\n" + kb.read() + "\n\n"

        # Determine the knowledge tier from the agent's knowledgeTier field
        tier_raw = data.get("simulation", {}).get("knowledgeTier", "shared_base")
        # Parse tier: could be "shared_base + journalist_supplement" or just "journalist_supplement"
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

        # For the spy, replace with fabricated knowledge
        if data.get("isSpy"):
            with open(os.path.join(KNOWLEDGE_DIR, "spy_fabricated.md"), "r", encoding="utf-8") as sf:
                knowledge_text = "YOUR VERIFIED INTELLIGENCE:\n" + sf.read()

        category = data.get("category", "civilian").lower()
        demographics = CATEGORY_DEMOGRAPHICS.get(category, {"gender": "Unknown", "age": "30", "country": "Unknown"})

        # Build persona string with knowledge injection
        persona = (
            f"You are {data.get('displayName') or data['handle']}, "
            f"a {category} "
            f"affiliated with {data.get('affiliation') or 'independent'}. "
            f"Your posting style: {data.get('postingStyle', 'analytical and factual')}. "
            f"You are discussing a breaking news event about the Iran-Israel-USA conflict. "
            f"Base your posts ONLY on the following knowledge:\n\n{knowledge_text}"
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
    print(f"Generated {len(agents)} OASIS profiles at {PROFILE_PATH}")
    return PROFILE_PATH


async def run_simulation():
    print("=" * 60)
    print("  AgentRoot v5 — OASIS Simulation (REAL)")
    print("=" * 60)

    # 1. Build profiles
    profile_path = build_oasis_profiles()

    # 2. Create model
    openai_model = ModelFactory.create(
        model_platform=ModelPlatformType.OPENAI,
        model_type=ModelType.GPT_4O_MINI,
    )

    # 3. Define available actions
    available_actions = [
        ActionType.LIKE_POST,
        ActionType.DISLIKE_POST,
        ActionType.CREATE_POST,
        ActionType.CREATE_COMMENT,
        ActionType.LIKE_COMMENT,
        ActionType.DISLIKE_COMMENT,
        ActionType.SEARCH_POSTS,
        ActionType.REFRESH,
        ActionType.DO_NOTHING,
    ]

    # 4. Generate agent graph
    print("\nLoading agent graph from profiles...")
    agent_graph = await generate_reddit_agent_graph(
        profile_path=profile_path,
        model=openai_model,
        available_actions=available_actions,
    )

    # 5. Remove old DB
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    # 6. Create environment
    env = oasis.make(
        agent_graph=agent_graph,
        platform=oasis.DefaultPlatformType.REDDIT,
        database_path=DB_PATH,
    )

    await env.reset()
    print("Environment ready.\n")

    # 7. Cycle 1 — Seed post (manual injection)
    print("Cycle 1: Seeding topic...")
    seed_actions = {}
    seed_actions[env.agent_graph.get_agent(0)] = [
        ManualAction(
            action_type=ActionType.CREATE_POST,
            action_args={"content": SEED_POST},
        )
    ]
    await env.step(seed_actions)

    # 8. Cycles 2–10 — Autonomous LLM actions
    for cycle in range(2, 11):
        print(f"Cycle {cycle}: Running autonomous agent actions...")
        llm_actions = {
            agent: LLMAction()
            for _, agent in env.agent_graph.get_agents()
        }
        await env.step(llm_actions)
        print(f"  Cycle {cycle} complete.")

    await env.close()
    print(f"\n✅ Simulation complete. Database saved to {DB_PATH}")
    print("Run export_to_json.py to export cycle data for the MiniApp.")


if __name__ == "__main__":
    asyncio.run(run_simulation())
