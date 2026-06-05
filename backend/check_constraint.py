import os
import psycopg2
from dotenv import load_dotenv
load_dotenv()

conn = psycopg2.connect(os.environ['DATABASE_URL'])
cur = conn.cursor()
cur.execute("""
    SELECT conname, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conname = 'clips_status_check'
""")
rows = cur.fetchall()
for row in rows:
    print(f"Constraint: {row[0]}")
    print(f"Definition: {row[1]}")
conn.close()
