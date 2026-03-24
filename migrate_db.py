from sqlalchemy import text
from backend.database import engine

def migrate():
    print("Running migration: Adding reminder_sent to bookings table...")
    with engine.connect() as con:
        try:
            con.execute(text("ALTER TABLE bookings ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;"))
            con.commit()
            print("Successfully added reminder_sent column.")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("Column reminder_sent already exists.")
            else:
                print(f"Migration error (bookings): {e}")
        
        try:
            con.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(15);"))
            con.commit()
            print("Successfully added phone column to users.")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("Column phone already exists.")
            else:
                print(f"Migration error (users): {e}")

if __name__ == "__main__":
    migrate()
