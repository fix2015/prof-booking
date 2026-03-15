from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime
from app.modules.masters.models import ProfessionalStatus


class ProfessionalPhotoResponse(BaseModel):
    id: int
    professional_id: int
    image_url: str
    caption: Optional[str]
    order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfessionalProviderResponse(BaseModel):
    id: int
    professional_id: int
    provider_id: int
    status: ProfessionalStatus
    payment_amount: Optional[float]
    joined_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ProfessionalCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    social_links: Optional[Dict] = {}
    nationality: Optional[str] = None
    experience_years: Optional[int] = None
    description: Optional[str] = None


class ProfessionalUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    social_links: Optional[Dict] = None
    nationality: Optional[str] = None
    experience_years: Optional[int] = None
    description: Optional[str] = None


class ProfessionalResponse(BaseModel):
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
    professional_providers: List[ProfessionalProviderResponse] = []
    photos: List[ProfessionalPhotoResponse] = []

    model_config = {"from_attributes": True}


class ProfessionalApprovalRequest(BaseModel):
    status: ProfessionalStatus
    payment_amount: Optional[float] = None


class ProfessionalDirectCreate(BaseModel):
    """Owner creates a brand-new professional account directly (no invite needed)."""
    email: EmailStr
    name: str
    phone: str
    password: str
    bio: Optional[str] = None
    nationality: Optional[str] = None
    experience_years: Optional[int] = None
    payment_amount: Optional[float] = None


class ProfessionalPublic(BaseModel):
    """Full public profile for discovery and profile pages."""
    id: int
    name: str
    bio: Optional[str]
    avatar_url: Optional[str]
    nationality: Optional[str]
    experience_years: Optional[int]
    description: Optional[str]
    photos: List[ProfessionalPhotoResponse] = []

    model_config = {"from_attributes": True}


# Backward-compat aliases
MasterPhotoResponse = ProfessionalPhotoResponse
MasterSalonResponse = ProfessionalProviderResponse
MasterCreate = ProfessionalCreate
MasterUpdate = ProfessionalUpdate
MasterResponse = ProfessionalResponse
MasterApprovalRequest = ProfessionalApprovalRequest
MasterDirectCreate = ProfessionalDirectCreate
MasterPublic = ProfessionalPublic
