import os
import razorpay
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from routers.deps import get_current_user

# Razorpay client initialization
razorpay_key_id = os.getenv("RAZORPAY_KEY_ID")
razorpay_key_secret = os.getenv("RAZORPAY_KEY_SECRET")

client = None
if razorpay_key_id and razorpay_key_secret:
    client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))

router = APIRouter(prefix="/api/payments", tags=["payments"])

@router.post("/create-order")
async def create_order(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not client:
        print("❌ Razorpay Client Error: Credentials not configured")
        raise HTTPException(status_code=500, detail="Razorpay credentials not configured")

    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        print(f"❌ Booking Error: Booking {booking_id} not found")
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.user_id != current_user.id:
        print(f"❌ Auth Error: User {current_user.id} not authorized for booking {booking_id}")
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        data = {
            "amount": booking.cost * 100,  # Amount in paisa
            "currency": "INR",
            "receipt": booking.id,
            "notes": {
                "booking_id": booking.id,
                "user_email": current_user.email
            }
        }
        order = client.order.create(data=data)
        
        booking.razorpay_order_id = order['id']
        db.commit()
        
        print(f"✅ Razorpay Order Created: {order['id']} for Booking: {booking.id}")
        return {
            "order_id": order['id'],
            "amount": order['amount'],
            "currency": order['currency'],
            "key_id": razorpay_key_id,
            "user_details": {
                "name": f"{current_user.first} {current_user.last}",
                "email": current_user.email,
                "phone": current_user.phone
            }
        }
    except Exception as e:
        print(f"❌ Razorpay order.create Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Razorpay error: {str(e)}")

@router.post("/verify")
async def verify_payment(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not client:
        raise HTTPException(status_code=500, detail="Razorpay credentials not configured")
        
    try:
        # Signature verification
        print(f"🔍 Verifying Payment Signature: {data.get('razorpay_order_id')}")
        client.utility.verify_payment_signature({
            'razorpay_order_id': data.get('razorpay_order_id'),
            'razorpay_payment_id': data.get('razorpay_payment_id'),
            'razorpay_signature': data.get('razorpay_signature')
        })
        
        booking = db.query(models.Booking).filter(
            models.Booking.razorpay_order_id == data.get('razorpay_order_id')
        ).first()
        
        if booking:
            booking.payment_status = "paid"
            booking.razorpay_payment_id = data.get('razorpay_payment_id')
            booking.razorpay_signature = data.get('razorpay_signature')
            db.commit()
            print(f"✅ Payment Verified & Saved: {booking.id}")
            return {"status": "success", "message": "Payment verified successfully"}
        else:
            print(f"❌ Verification Error: Booking not found for Order ID {data.get('razorpay_order_id')}")
            raise HTTPException(status_code=404, detail="Booking not found for this order")
            
    except Exception as e:
        print(f"❌ Razorpay Verification Error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")
