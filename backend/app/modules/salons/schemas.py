from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime


class ProviderCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    description: Optional[str] = None
    category: Optional[str] = None
    worker_payment_amount: float = 0.0
    deposit_percentage: float = 5.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    category: Optional[str] = None
    worker_payment_amount: Optional[float] = None
    deposit_percentage: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: Optional[bool] = None
    settings: Optional[dict] = None


class ProviderResponse(BaseModel):
    id: int
    name: str
    address: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    description: Optional[str]
    logo_url: Optional[str]
    category: Optional[str]
    worker_payment_amount: float
    deposit_percentage: float
    latitude: Optional[float]
    longitude: Optional[float]
    is_active: bool
    created_at: datetime
    settings: Optional[dict] = {}

    model_config = {"from_attributes": True}


class ProviderPublic(BaseModel):
    """Public-facing provider info for client discovery."""
    id: int
    name: str
    address: Optional[str]
    phone: Optional[str]
    description: Optional[str]
    logo_url: Optional[str]
    category: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]

    model_config = {"from_attributes": True}


# Backward-compat aliases
SalonCreate = ProviderCreate
SalonUpdate = ProviderUpdate
SalonResponse = ProviderResponse
SalonPublic = ProviderPublic
