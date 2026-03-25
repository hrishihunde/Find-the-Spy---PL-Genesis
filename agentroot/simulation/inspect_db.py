import sqlite3

conn = sqlite3.connect('simulation.db')
cur = conn.cursor()

# Get all table names
cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [r[0] for r in cur.fetchall()]

print(f"Found {len(tables)} tables: {tables}")

# Print row counts and schema for each
for t in tables:
    count = cur.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    print(f"\nTable '{t}' has {count} rows. Columns:")
    
    cur.execute(f"PRAGMA table_info({t});")
    cols = cur.fetchall()
    for c in cols:
        print(f"  - {c[1]} ({c[2]})")

conn.close()
