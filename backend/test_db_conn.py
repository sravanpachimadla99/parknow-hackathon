
from database import SessionLocal
import models

def test_db_connection():
    try:
        db = SessionLocal()
        user_count = db.query(models.User).count()
        print(f"✅ DB Connection Successful. User count: {user_count}")
        
        booking_count = db.query(models.Booking).count()
        print(f"✅ Booking count: {booking_count}")
        
        db.close()
    except Exception as e:
        print(f"❌ DB Connection Failed: {e}")

if __name__ == "__main__":
    test_db_connection()
