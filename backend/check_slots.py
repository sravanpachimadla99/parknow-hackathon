
from database import SessionLocal
import models

def check_slots():
    db = SessionLocal()
    slots = db.query(models.Slot).all()
    print(f"Total slots: {len(slots)}")
    for s in slots[:5]:
        print(f"ID: {s.id}, Zone: {s.zone}, Status: {s.status}")
    db.close()

if __name__ == "__main__":
    check_slots()
