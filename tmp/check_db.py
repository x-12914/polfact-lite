import sqlite3
import os

db_path = r'backend/polfact.db'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- MEDIA RECORDS ---")
try:
    cursor.execute("SELECT id, type, file_url FROM media LIMIT 10;")
    rows = cursor.fetchall()
    for row in rows:
        print(row)
except Exception as e:
    print(f"Media table error: {e}")

print("\n--- SOURCE RECORDS ---")
try:
    cursor.execute("SELECT id, title, link FROM source LIMIT 10;")
    rows = cursor.fetchall()
    for row in rows:
        print(row)
except Exception as e:
    print(f"Source table error: {e}")

conn.close()
