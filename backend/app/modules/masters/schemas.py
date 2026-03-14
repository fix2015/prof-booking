from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime
from app.modules.masters.models import MasterStatus


class MasterPhotoResponse(BaseModel):
    id: int
    master_id: int
    image_url: str
    caption: Optional[str]
    order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class MasterSalonResponse(BaseModel):
    id: int
    master_id: int
    salon_id: int
    status: MasterStatus
    payment_amount: Optional[float]
    joined_at: Optional[datetime]

    model_config = {"from_attributes": True}


class MasterCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    social_links: Optional[Dict] = {}
    nationality: Optional[str] = None
    experience_years: Optional[int] = None
    description: Optional[str] = None


class MasterUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    social_links: Optional[Dict] = None
    nationality: Optional[str] = None
    experience_years: Optional[int] = None
    description: Optional[str] = None


class MasterResponse(BaseModel):
    id: int
    user_id: int
    name: str
    phone: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    social_links: Optional[Dict] = {}
    nationality: Optional[str]
    experience_years: Optional[int]
    description: Optional[str]
    created_at: datetime
    master_salons: List[MasterSalonResponse] = []
    photos: List[MasterPhotoResponse] = []

    model_config = {"from_attributes": True}


class MasterApprovalRequest(BaseModel):
    status: MasterStatus
    payment_amount: Optional[float] = None


class MasterDirectCreate(BaseModel):
    """Owner creates a brand-new master account directly (no invite needed)."""
    email: EmailStr
    name: str
    phone: str
    password: str
    bio: Optional[str] = None
    nationality: Optional[str] = None
    experience_years: Optional[int] = None
    payment_amount: Optional[float] = None


class MasterPublic(BaseModel):
    """Full public profile for discovery and profile pages."""
    id: int
    name: str
    bio: Optional[str]
    avatar_url: Optional[str]
    nationality: Optional[str]
    experience_years: Optional[int]
    description: Optional[str]
    photos: List[MasterPhotoResponse] = []

    model_config = {"from_attributes": True}
