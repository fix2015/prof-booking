from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class SalonCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    description: Optional[str] = None
    worker_payment_amount: float = 0.0
    deposit_percentage: float = 5.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class SalonUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    worker_payment_amount: Optional[float] = None
    deposit_percentage: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: Optional[bool] = None
    settings: Optional[dict] = None


class SalonResponse(BaseModel):
    id: int
    name: str
    address: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    description: Optional[str]
    logo_url: Optional[str]
    worker_payment_amount: float
    deposit_percentage: float
    latitude: Optional[float]
    longitude: Optional[float]
    is_active: bool
    created_at: datetime
    settings: Optional[dict] = {}

    model_config = {"from_attributes": True}


class SalonPublic(BaseModel):
    id: int
    name: str
    address: Optional[str]
    phone: Optional[str]
    description: Optional[str]
    logo_url: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]

    model_config = {"from_attributes": True}
