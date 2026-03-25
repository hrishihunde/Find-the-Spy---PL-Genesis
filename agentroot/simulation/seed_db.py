import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'simulation.db')

MOCK_CYCLES = [
  {
    "cycle": 1,
    "posts": [
      (1, "@agentroot_admin", "BREAKING: Iran launches coordinated drone and missile strike targeting Israeli military installations in the Negev desert. US confirms deployment of additional carrier strike group to Eastern Mediterranean. Developing story.", 20, False)
    ]
  },
  {
    "cycle": 2,
    "posts": [
      (1, "@reuters_amir", "Reuters confirms 32 drones and 14 ballistic missiles launched from Iranian territory. Israeli Air Force and Iron Dome engaged. Initial reports suggest 85% interception rate.", 12, False),
      (3, "@def_analyst_sarah", "Shahed-136 variants detected in this wave. Extended range suggests launch sites in western Iran, not proxy territory. Significant escalation from previous patterns.", 8, False),
      (20, "@eli_cohen", "CONFIRMED: Over 300 drones launched in the attack. Iron Dome completely overwhelmed — multiple sources report total system failure across southern Israel.", 2, True),
      (6, "@civilian_priya", "This is terrifying. Are there civilian casualties? Praying for everyone affected.", 15, False)
    ]
  },
  {
    "cycle": 4,
    "posts": [
      (20, "@eli_cohen", "BREAKING: US has withdrawn its carrier strike group from the Eastern Mediterranean citing 'de-escalation.' Israel now without naval support. Pentagon sources confirm.", 1, True),
      (7, "@academic_lin", "Historical context: This is the largest direct Iranian strike on Israeli soil since the April 2024 incident. The scale suggests a strategic shift, not a one-off provocation.", 9, False)
    ]
  },
  {
    "cycle": 5,
    "posts": [
      (1, "@reuters_amir", "Replying to @eli_cohen: Pentagon briefing 30 minutes ago confirmed USS Eisenhower strike group is ON STATION in the Eastern Med. No withdrawal. This claim is false.", 25, False),
      (5, "@econ_raj", "If US had withdrawn naval support, oil markets would be above $140. Brent is at $112. The market does not believe this claim either.", 18, False)
    ]
  },
  {
    "cycle": 6,
    "posts": [
      (20, "@eli_cohen", "2,400 military casualties. Government suppressing numbers. Real figures 10x higher than reported.", 2, True),
      (2, "@bbc_james", "BBC confirms Israeli military reports 3 soldiers killed, 47 injured across all strike sites. Civilian casualties remain under assessment.", 15, False),
      (13, "@civilian_chen", "The numbers from @eli_cohen don't add up at all. Every other source says single-digit fatalities.", 22, False)
    ]
  },
  {
    "cycle": 9,
    "posts": [
      (20, "@eli_cohen", "EXCLUSIVE: Secret ceasefire signed between Iran and Israel mediated by China. All operations suspended. Western media blackout on this development.", 1, True),
      (4, "@diplomat_elena", "No ceasefire has been announced by any party. UN Security Council session is still in progress. This is fabricated.", 18, False),
      (9, "@aljazeera_omar", "Al Jazeera has correspondents in Beijing, Tehran, and Tel Aviv. None confirm any ceasefire talks. This account has posted multiple unverified claims tonight.", 20, False)
    ]
  }
]

def seed_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cycle INTEGER,
            agent_id INTEGER,
            handle TEXT,
            content TEXT,
            likes INTEGER DEFAULT 0,
            is_spy BOOLEAN
        )
    ''')
    cur.execute("DELETE FROM posts") # Clear existing
    
    for c in MOCK_CYCLES:
        cycle_num = c['cycle']
        for p in c['posts']:
            agent_id, handle, content, likes, is_spy = p
            cur.execute("""
                INSERT INTO posts (cycle, agent_id, handle, content, likes, is_spy)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (cycle_num, agent_id, handle, content, likes, is_spy))
            
    conn.commit()
    print("Database seeded completely.")

if __name__ == '__main__':
    seed_db()
