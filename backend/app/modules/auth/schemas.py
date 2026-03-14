from pydantic import BaseModel, EmailStr
from typing import Optional, List
from app.modules.users.models import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: int
    role: UserRole


class RefreshRequest(BaseModel):
    refresh_token: str


class OwnerRegisterRequest(BaseModel):
    email: EmailStr
    phone: str
    password: str
    salon_name: str
    salon_address: str
    worker_payment_amount: float = 0.0


class MasterRegisterRequest(BaseModel):
    email: EmailStr
    name: str
    phone: str
    password: str
    social_links: Optional[dict] = {}
    invite_token: Optional[str] = None
    salon_ids: Optional[List[int]] = []
