import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models, schemas, security
from database import get_db
from routers.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginData(BaseModel):
    email: str
    password: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        # Frontend expects { error: "message" } mostly
        raise HTTPException(status_code=400, detail="Email already used")
    
    hashed_password = security.get_password_hash(user_in.password)
    new_user = models.User(
        first=user_in.first,
        last=user_in.last,
        email=user_in.email,
        phone=user_in.phone,
        password=hashed_password,
        vehicle=user_in.vehicle,
        vtype=user_in.vtype,
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = security.create_access_token(
        data={"id": new_user.id, "email": new_user.email, "role": new_user.role}
    )
    
    user_out = schemas.UserOut.model_validate(new_user).model_dump()
    user_out['created_at'] = user_out['created_at'].isoformat()
    return {"token": access_token, "user": user_out}

@router.post("/login")
def login(login_data: LoginData, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not db_user or not security.verify_password(login_data.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    access_token = security.create_access_token(
        data={"id": db_user.id, "email": db_user.email, "role": db_user.role}
    )
    
    user_out = schemas.UserOut.model_validate(db_user).model_dump()
    user_out['created_at'] = user_out['created_at'].isoformat()
    return {"token": access_token, "user": user_out}

@router.get("/me", response_model=schemas.UserOut)
def auth_me(current_user: models.User = Depends(get_current_user)):
    return current_user

class ForgotPassData(BaseModel):
    email: str

@router.post("/forgot-password")
def forgot_password(data: ForgotPassData, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Simulate sending a reset link
    reset_token = "SECURE_MOCK_TOKEN_123"
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:8000")
    reset_link = f"{frontend_url}/auth/reset?email={user.email}&token={reset_token}"
    
    from notifications import send_email
    send_email(
        user.email, 
        "Reset Your ParkNow Password", 
        f"Hi {user.first}, follow this link to reset your password: {reset_link}"
    )
    
    return {"message": "Reset link sent successfully"}
