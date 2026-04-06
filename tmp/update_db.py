import sqlite3
import os

db_path = "c:/Users/xxx85/Downloads/polfact-lite/backend/polfact.db"

def run():
    print("Connecting to db:", db_path)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE media ADD COLUMN deepfake_status VARCHAR;")
        print("Column deepfake_status added.")
    except sqlite3.OperationalError as e:
        print("Error/Already exists:", e)

    try:
        cursor.execute("ALTER TABLE media ADD COLUMN deepfake_confidence FLOAT;")
        print("Column deepfake_confidence added.")
    except sqlite3.OperationalError as e:
        print("Error/Already exists:", e)
        
    conn.commit()
    conn.close()
    
if __name__ == "__main__":
    run()
