"""
BetterAuth JWT Authentication Skill
Implements reusable authentication functionality with JWT tokens
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from pydantic import BaseModel, field_validator
import bcrypt
import jwt
import os
from datetime import datetime, timedelta
from typing import Optional
from db import get_session  # Assuming you have a db module with get_session


class BetterAuthJWT:
    """
    Reusable BetterAuth JWT Authentication Skill
    Provides standardized authentication functionality with JWT tokens
    """

    def __init__(self, secret_key: Optional[str] = None):
        """
        Initialize BetterAuth JWT with secret key
        :param secret_key: Secret key for JWT signing, defaults to BETTER_AUTH_SECRET env var
        """
        self.secret = secret_key or os.getenv("BETTER_AUTH_SECRET")
        if not self.secret:
            raise ValueError("BETTER_AUTH_SECRET environment variable is not set")

        self.security = HTTPBearer()
        self.router = APIRouter(prefix="/auth", tags=["auth"])
        self._setup_routes()

    def _setup_routes(self):
        """Setup authentication routes"""
        self.router.add_api_route("/signup", self.signup, methods=["POST"], response_model=AuthResponse)
        self.router.add_api_route("/login", self.login, methods=["POST"], response_model=AuthResponse)
        self.router.add_api_route("/me", self.get_current_user_info, methods=["GET"], response_model=UserResponse)

    def decode_token(self, token: str) -> dict:
        """Decode and verify JWT token"""
        try:
            payload = jwt.decode(token, self.secret, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")

    def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(self.security)) -> str:
        """Extract user_id from JWT token"""
        token = credentials.credentials
        payload = self.decode_token(token)
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        return user_id

    def create_token(self, user_id: str) -> str:
        """Create JWT token for user"""
        payload = {
            "sub": user_id,
            "exp": datetime.utcnow() + timedelta(days=7)
        }
        return jwt.encode(payload, self.secret, algorithm="HS256")


class SignupRequest(BaseModel):
    email: str
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


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


def create_betterauth_router(secret_key: Optional[str] = None) -> APIRouter:
    """
    Create a reusable BetterAuth JWT router
    :param secret_key: Optional secret key, will use BETTER_AUTH_SECRET env var if not provided
    :return: FastAPI APIRouter with authentication endpoints
    """
    auth_service = BetterAuthJWT(secret_key)
    return auth_service.router


# Example usage functions that can be plugged into your existing User model
def signup_handler(data: SignupRequest, session: Session, user_model):
    """
    Generic signup handler that works with your User model
    :param data: Signup request data
    :param session: Database session
    :param user_model: Your User model class
    """
    # Check if email exists
    statement = select(user_model).where(user_model.email == data.email)
    existing = session.exec(statement).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    # Create user
    user_id = f"user_{data.email.split('@')[0]}_{int(datetime.utcnow().timestamp())}"
    password_hash = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    user = user_model(
        id=user_id,
        email=data.email,
        name=data.name,
        password_hash=password_hash
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    return user


def login_handler(data: LoginRequest, session: Session, user_model, auth_service: BetterAuthJWT):
    """
    Generic login handler that works with your User model
    :param data: Login request data
    :param session: Database session
    :param user_model: Your User model class
    :param auth_service: BetterAuthJWT instance
    """
    # Find user
    statement = select(user_model).where(user_model.email == data.email)
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Verify password
    if not bcrypt.checkpw(data.password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Generate token
    token = auth_service.create_token(user.id)
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    }


# If you want to use this as a standalone router with your existing User model
def get_auth_router(user_model):
    """
    Get a complete auth router configured for your User model
    :param user_model: Your User model class (must have id, email, name, password_hash attributes)
    """
    auth_service = BetterAuthJWT()

    @auth_service.router.post("/signup", response_model=AuthResponse)
    def signup(data: SignupRequest, session: Session = Depends(get_session)):
        user = signup_handler(data, session, user_model)
        token = auth_service.create_token(user.id)
        return {
            "token": token,
            "user": UserResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                created_at=user.created_at
            )
        }

    @auth_service.router.post("/login", response_model=AuthResponse)
    def login(data: LoginRequest, session: Session = Depends(get_session)):
        return login_handler(data, session, user_model, auth_service)

    @auth_service.router.get("/me", response_model=UserResponse)
    def get_current_user_info(current_user_id: str = Depends(auth_service.get_current_user),
                             session: Session = Depends(get_session)):
        user = session.exec(select(user_model).where(user_model.id == current_user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            created_at=user.created_at
        )

    return auth_service.router