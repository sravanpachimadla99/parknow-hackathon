
from database import engine
from sqlalchemy import text
import models

def migrate():
    print("🚀 Starting migration...")
    try:
        with engine.connect() as conn:
            # 1. Alter Enum for pay column
            print("Updating 'pay' column Enum...")
            conn.execute(text("ALTER TABLE bookings MODIFY COLUMN pay ENUM('upi', 'card', 'wallet', 'netbanking', 'cash') NOT NULL"))
            
            # 2. Reset some reserved slots to free (to help the user who says slots are not taking)
            print("Resetting reserved slots...")
            conn.execute(text("UPDATE slots SET status = 'free' WHERE status = 'reserved'"))
            
            conn.commit()
            print("✅ Migration and slot reset successful!")
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    migrate()
