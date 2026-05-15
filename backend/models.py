from sqlalchemy import Column, String, Enum, DateTime, Date, Time, SmallInteger, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    first = Column(String(80), nullable=False)
    last = Column(String(80), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(15), nullable=True)
    password = Column(String(255), nullable=False)
    vehicle = Column(String(20), nullable=False)
    vtype = Column(Enum('car', 'bike', 'suv', name='user_vtype'), default='car', nullable=False)
    role = Column(Enum('user', 'admin', name='user_role'), default='user', nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")

class Slot(Base):
    __tablename__ = "slots"
    
    id = Column(String(4), primary_key=True)
    zone = Column(String(1), nullable=False, index=True)
    zone_name = Column(String(60), nullable=False)
    type = Column(Enum('car', 'bike', 'suv', name='slot_type'), nullable=False)
    status = Column(Enum('free', 'occupied', 'reserved', name='slot_status'), default='free', nullable=False, index=True)
    
    bookings = relationship("Booking", back_populates="slot")

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(String(10), primary_key=True)
    user_id = Column(String(36), ForeignKey('users.id', ondelete="CASCADE"), nullable=False, index=True)
    slot_id = Column(String(4), ForeignKey('slots.id'), nullable=False, index=True)
    zone_name = Column(String(60), nullable=False)
    vehicle = Column(String(20), nullable=False)
    vtype = Column(Enum('car', 'bike', 'suv', name='booking_vtype'), nullable=False)
    date = Column(Date, nullable=False, index=True)
    time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    dur = Column(SmallInteger, nullable=False)
    cost = Column(SmallInteger, nullable=False)
    pay = Column(Enum('upi', 'card', 'wallet', 'netbanking', 'qr', name='booking_pay'), nullable=False)
    status = Column(Enum('active', 'cancelled', 'completed', name='booking_status'), default='active', nullable=False)
    payment_status = Column(Enum('pending', 'paid', 'failed', name='booking_payment_status'), default='pending', nullable=False)
    razorpay_order_id = Column(String(255), nullable=True)
    razorpay_payment_id = Column(String(255), nullable=True)
    razorpay_signature = Column(String(255), nullable=True)
    reminder_sent = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="bookings")
    slot = relationship("Slot", back_populates="bookings")
