from pydantic import BaseModel, EmailStr
from datetime import datetime, date, time
from typing import Optional, List
from enum import Enum

class VTypeEnum(str, Enum):
    car = 'car'
    bike = 'bike'
    suv = 'suv'

class RoleEnum(str, Enum):
    user = 'user'
    admin = 'admin'

class StatusEnum(str, Enum):
    free = 'free'
    occupied = 'occupied'
    reserved = 'reserved'

class PayEnum(str, Enum):
    upi = 'upi'
    card = 'card'
    wallet = 'wallet'
    netbanking = 'netbanking'
    qr = 'qr'

class BookingStatusEnum(str, Enum):
    active = 'active'
    cancelled = 'cancelled'
    completed = 'completed'

class PaymentStatusEnum(str, Enum):
    pending = 'pending'
    paid = 'paid'
    failed = 'failed'

# Token
class Token(BaseModel):
    token: str
    user: dict

class TokenData(BaseModel):
    email: Optional[str] = None
    id: Optional[str] = None
    role: Optional[str] = None

# User
class UserBase(BaseModel):
    first: str
    last: str
    email: EmailStr
    phone: Optional[str] = None
    vehicle: str
    vtype: VTypeEnum

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    first: Optional[str] = None
    last: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    vehicle: Optional[str] = None
    vtype: Optional[VTypeEnum] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id: str
    role: RoleEnum
    created_at: datetime
    
    class Config:
        from_attributes = True

# Slot
class SlotBase(BaseModel):
    id: str
    zone: str
    zone_name: str
    type: VTypeEnum
    status: StatusEnum

class SlotOut(SlotBase):
    class Config:
        from_attributes = True

class SlotUpdate(BaseModel):
    status: StatusEnum

# Booking
class BookingCreate(BaseModel):
    slot_id: str
    vehicle: str
    vtype: VTypeEnum
    date: date
    time: time
    dur: int
    pay: PayEnum

class BookingOut(BaseModel):
    id: str
    user_id: str
    slot_id: str
    zone_name: str
    vehicle: str
    vtype: VTypeEnum
    date: date
    time: time
    end_time: time
    dur: int
    cost: int
    pay: PayEnum
    status: BookingStatusEnum
    payment_status: PaymentStatusEnum = PaymentStatusEnum.pending
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    reminder_sent: bool = False
    created_at: datetime
    
    user: Optional[UserOut] = None
    slot: Optional[SlotOut] = None

    class Config:
        from_attributes = True
