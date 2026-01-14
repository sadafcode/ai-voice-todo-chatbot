from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr, field_validator
import bcrypt
import jwt
import os
from datetime import datetime, timedelta
from db import get_session
from models import User
from auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
SECRET = os.getenv("BETTER_AUTH_SECRET")

if not SECRET:
    raise ValueError("BETTER_AUTH_SECRET environment variable is not set")

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")

@router.post("/signup")
def signup(data: SignupRequest, session: Session = Depends(get_session)):
    # Check if email exists
    statement = select(User).where(User.email == data.email)
    existing = session.exec(statement).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Create user
    user_id = f"user_{data.email.split('@')[0]}_{int(datetime.utcnow().timestamp())}"
    password_hash = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user = User(
        id=user_id,
        email=data.email,
        name=data.name,
        password_hash=password_hash
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Generate token
    token = create_token(user_id)
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    }

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/login")
def login(data: LoginRequest, session: Session = Depends(get_session)):
    # Find user
    statement = select(User).where(User.email == data.email)
    user = session.exec(statement).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not bcrypt.checkpw(data.password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate token
    token = create_token(user.id)
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    }

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user_id: str = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.id == current_user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        created_at=user.created_at
    )

