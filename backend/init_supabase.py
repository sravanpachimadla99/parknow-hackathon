import sys
import os

# Add the current directory to sys.path so we can import from backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import engine, Base
from backend.models import User, Slot, Booking

def init_db():
    print("Initializing Supabase database...")
    try:
        # Create all tables defined in models.py
        Base.metadata.create_all(bind=engine)
        print("Successfully created all tables in Supabase!")
    except Exception as e:
        print(f"Error initializing database: {e}")

if __name__ == "__main__":
    init_db()
