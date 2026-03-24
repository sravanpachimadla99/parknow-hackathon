
from database import engine
from sqlalchemy import text

def migrate():
    print("🚀 Starting migration for 'qr' payment method...")
    try:
        with engine.connect() as conn:
            print("Updating 'pay' column Enum to include 'qr'...")
            conn.execute(text("ALTER TABLE bookings MODIFY COLUMN pay ENUM('upi', 'card', 'wallet', 'netbanking', 'qr', 'cash') NOT NULL"))
            conn.commit()
            print("✅ Migration successful!")
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    migrate()
