import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from database import engine, Base, SessionLocal
from routers import auth, slots, bookings, users, chat, payments
import models, notifications
from apscheduler.schedulers.background import BackgroundScheduler
import datetime

Base.metadata.create_all(bind=engine)

def check_reminders():
    db = SessionLocal()
    try:
        now = datetime.datetime.now()
        # Target bookings starting in ~30 minutes
        window_start = (now + datetime.timedelta(minutes=25)).time()
        window_end = (now + datetime.timedelta(minutes=35)).time()
        
        upcoming = db.query(models.Booking).filter(
            models.Booking.status == 'active',
            models.Booking.reminder_sent == False,
            models.Booking.date == now.date(),
            models.Booking.time >= window_start,
            models.Booking.time <= window_end
        ).all()
        
        for b in upcoming:
            user = db.query(models.User).filter(models.User.id == b.user_id).first()
            if user:
                notifications.notify_booking_reminder(
                    user_email=user.email,
                    user_phone=getattr(user, 'phone', 'N/A') or 'N/A',
                    booking_details={
                        "id": b.id,
                        "slotId": b.slot_id,
                        "time": b.time.isoformat(timespec='minutes')
                    }
                )
                b.reminder_sent = True
        db.commit()
    except Exception as e:
        print(f"Error in reminder job: {e}")
    finally:
        db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(check_reminders, 'interval', minutes=1)
scheduler.start()

app = FastAPI(title="ParkNow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler to mimic express err: { error: "msg" }
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={"error": str(exc)},
    )

app.include_router(auth.router)
app.include_router(slots.router)
app.include_router(bookings.router)
app.include_router(users.router)
app.include_router(chat.router)
app.include_router(payments.router)

@app.get("/api/health")
def health_check():
    import datetime
    return {
        "status": "ok",
        "app": "ParkNow API",
        "version": "1.0.0",
        "time": datetime.datetime.utcnow().isoformat()
    }

frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
else:
    print(f"Warning: Frontend directory not found at {frontend_dir}")
