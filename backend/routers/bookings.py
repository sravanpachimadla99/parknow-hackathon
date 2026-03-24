from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import datetime
import models, schemas, notifications
from database import get_db
from routers.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/api/bookings", tags=["bookings"])

@router.get("", response_model=dict)
def get_bookings(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "admin":
        bookings = db.query(models.Booking).order_by(models.Booking.created_at.desc()).all()
    else:
        bookings = db.query(models.Booking).filter(models.Booking.user_id == current_user.id).order_by(models.Booking.created_at.desc()).all()
    
    booking_list = []
    for b in bookings:
        b_dict = schemas.BookingOut.model_validate(b).model_dump()
        b_dict['date'] = b_dict['date'].isoformat()
        b_dict['time'] = b_dict['time'].isoformat(timespec='minutes')
        b_dict['end_time'] = b_dict['end_time'].isoformat(timespec='minutes')
        b_dict['created_at'] = b_dict['created_at'].isoformat()
        if b.user:
            u_dict = schemas.UserOut.model_validate(b.user).model_dump()
            u_dict['created_at'] = u_dict['created_at'].isoformat()
            b_dict['user'] = u_dict
        if b.slot:
            b_dict['slot'] = schemas.SlotOut.model_validate(b.slot).model_dump()
        booking_list.append(b_dict)
    
    return {"bookings": booking_list}

@router.post("", status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: schemas.BookingCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    start_dt = datetime.datetime.combine(booking_in.date, booking_in.time)
    end_dt = start_dt + datetime.timedelta(hours=booking_in.dur)
    
    rate = 50 if booking_in.vtype == 'car' else 20 if booking_in.vtype == 'bike' else 80
    cost = booking_in.dur * rate
    
    # Needs to match frontend `{ booking: {...} }`
    # Lock slot and check availability
    slot = db.query(models.Slot).filter(models.Slot.id == booking_in.slot_id).with_for_update().first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
        
    if slot.status != "free":
        raise HTTPException(status_code=409, detail="Slot is no longer available")
        
    count = db.query(models.Booking).count()
    new_id = f"BK{(count + 1):04d}"
    
    new_booking = models.Booking(
        id=new_id,
        user_id=current_user.id,
        slot_id=slot.id,
        zone_name=slot.zone_name,
        vehicle=booking_in.vehicle,
        vtype=booking_in.vtype,
        date=booking_in.date,
        time=booking_in.time,
        end_time=end_dt.time(),
        dur=booking_in.dur,
        cost=cost,
        pay=booking_in.pay,
        status="active"
    )
    
    slot.status = "reserved"
    
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    # Send confirmation notification in background
    background_tasks.add_task(
        notifications.notify_booking_confirmation,
        user_email=current_user.email,
        user_phone=current_user.phone or "N/A",
        booking_details={
            "id": new_booking.id,
            "slotId": new_booking.slot_id,
            "date": new_booking.date.isoformat(),
            "time": new_booking.time.isoformat(timespec='minutes'),
            "endTime": new_booking.end_time.isoformat(timespec='minutes'),
            "cost": new_booking.cost
        }
    )
    
    b_dict = schemas.BookingOut.model_validate(new_booking).model_dump()
    b_dict['date'] = b_dict['date'].isoformat()
    b_dict['time'] = b_dict['time'].isoformat(timespec='minutes')
    b_dict['end_time'] = b_dict['end_time'].isoformat(timespec='minutes')
    b_dict['created_at'] = b_dict['created_at'].isoformat()
    
    return {"booking": b_dict}

@router.patch("/{booking_id}/cancel")
def cancel_booking(booking_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if current_user.role != "admin" and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Already cancelled")
        
    booking.status = "cancelled"
    
    slot = db.query(models.Slot).filter(models.Slot.id == booking.slot_id).first()
    if slot:
        slot.status = "free"
        
    db.commit()
    return {"message": "Booking cancelled successfully"}

@router.post("/{booking_id}/extend")
def extend_booking(
    booking_id: str, 
    hours: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if booking.status != "active":
        raise HTTPException(status_code=400, detail="Only active bookings can be extended")
        
    # Calculate new end time
    current_end = datetime.datetime.combine(booking.date, booking.end_time)
    new_end = current_end + datetime.timedelta(hours=hours)
    
    # Calculate additional cost
    rate = 50 if booking.vtype == 'car' else 20 if booking.vtype == 'bike' else 80
    add_cost = hours * rate
    
    booking.end_time = new_end.time()
    booking.dur += hours
    booking.cost += add_cost
    
    db.commit()
    db.refresh(booking)
    
    return {"message": "Booking extended successfully", "booking": booking}

@router.get("/stats/revenue")
def get_revenue_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin)):
    bookings = db.query(models.Booking).filter(models.Booking.status == 'active').all()
    total_rev = sum(b.cost for b in bookings)
    total_bookings = len(bookings)
    
    by_pay = {"upi": 0, "card": 0, "wallet": 0, "cash": 0}
    for b in bookings:
        if b.pay in by_pay:
            by_pay[b.pay] += b.cost
            
    return {
        "totalRevenue": total_rev,
        "totalBookings": total_bookings,
        "byPayMethod": by_pay
    }

@router.get("/{booking_id}", response_model=schemas.BookingOut)
def get_booking(booking_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if current_user.role != "admin" and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return booking
