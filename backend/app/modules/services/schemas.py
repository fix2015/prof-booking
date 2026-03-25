from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int = Field(default=60, gt=0)
    price: float = Field(ge=0)
    provider_ids: List[int] = []


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = Field(default=None, gt=0)
    price: Optional[float] = Field(default=None, ge=0)
    is_active: Optional[bool] = None
    provider_ids: Optional[List[int]] = None


class ServiceResponse(BaseModel):
    id: int
    provider_ids: List[int] = []
    professional_id: Optional[int]
    name: str
    description: Optional[str]
    duration_minutes: int
    price: float
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
