from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int = Field(default=60, gt=0)
    price: float = Field(ge=0)


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = Field(default=None, gt=0)
    price: Optional[float] = Field(default=None, ge=0)
    is_active: Optional[bool] = None


class ServiceResponse(BaseModel):
    id: int
    provider_id: int
    name: str
    description: Optional[str]
    duration_minutes: int
    price: float
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
