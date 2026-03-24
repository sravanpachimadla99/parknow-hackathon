from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import get_db
from routers.deps import get_current_admin
from typing import Optional

router = APIRouter(prefix="/api/slots", tags=["slots"])

@router.get("")
def get_slots(zone: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Slot)
    if zone:
        query = query.filter(models.Slot.zone == zone)
    if status:
        query = query.filter(models.Slot.status == status)
    slots = query.all()
    # The frontend expects { "slots": [...] }
    return {"slots": slots}

@router.get("/stats/summary")
def get_slots_summary(db: Session = Depends(get_db)):
    total = db.query(models.Slot).count()
    free = db.query(models.Slot).filter(models.Slot.status == "free").count()
    occupied = db.query(models.Slot).filter(models.Slot.status == "occupied").count()
    reserved = db.query(models.Slot).filter(models.Slot.status == "reserved").count()
    return {
        "free": free,
        "occupied": occupied,
        "reserved": reserved,
        "total": total
    }

@router.get("/{slot_id}")
def get_slot(slot_id: str, db: Session = Depends(get_db)):
    slot = db.query(models.Slot).filter(models.Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    return slot

@router.patch("/{slot_id}")
def update_slot(slot_id: str, slot_update: schemas.SlotUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin)):
    slot = db.query(models.Slot).filter(models.Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    slot.status = slot_update.status
    db.commit()
    db.refresh(slot)
    return slot
