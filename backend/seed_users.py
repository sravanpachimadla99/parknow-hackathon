import os
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User, Base
from security import get_password_hash

# Ensure tables are created
Base.metadata.create_all(bind=engine)

def seed_users():
    db = SessionLocal()
    try:
        # Check Admin
        admin = db.query(User).filter(User.email == "admin@park.com").first()
        if not admin:
            admin = User(
                first="System",
                last="Admin",
                email="admin@park.com",
                password=get_password_hash("admin123"),
                vehicle="KA 01 ADMIN",
                vtype="car",
                role="admin"
            )
            db.add(admin)

        # Check User
        user = db.query(User).filter(User.email == "user@park.com").first()
        if not user:
            user = User(
                first="Demo",
                last="User",
                email="user@park.com",
                password=get_password_hash("password"),
                vehicle="KA 01 AB 1234",
                vtype="car",
                role="user"
            )
            db.add(user)

        db.commit()
        print("Users seeded successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))
    seed_users()
