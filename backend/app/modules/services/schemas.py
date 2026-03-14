from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int = 60
    price: float


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[float] = None
    is_active: Optional[bool] = None


class ServiceResponse(BaseModel):
    id: int
    salon_id: int
    name: str
    description: Optional[str]
    duration_minutes: int
    price: float
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
