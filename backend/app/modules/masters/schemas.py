from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from app.modules.masters.models import MasterStatus


class MasterCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    social_links: Optional[Dict] = {}


class MasterUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    social_links: Optional[Dict] = None


class MasterResponse(BaseModel):
    id: int
    user_id: int
    name: str
    phone: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    social_links: Optional[Dict] = {}
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


class MasterApprovalRequest(BaseModel):
    status: MasterStatus
    payment_amount: Optional[float] = None


class MasterPublic(BaseModel):
    id: int
    name: str
    bio: Optional[str]
    avatar_url: Optional[str]

    model_config = {"from_attributes": True}
