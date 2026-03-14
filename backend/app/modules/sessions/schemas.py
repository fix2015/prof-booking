from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.modules.sessions.models import SessionStatus


class SessionCreate(BaseModel):
    salon_id: int
    master_id: Optional[int] = None
    service_id: Optional[int] = None
    client_name: str
    client_phone: str
    client_email: Optional[EmailStr] = None
    client_notes: Optional[str] = None
    starts_at: datetime
    duration_minutes: int = 60
    price: Optional[float] = None


class SessionUpdate(BaseModel):
    status: Optional[SessionStatus] = None
    master_id: Optional[int] = None
    starts_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    price: Optional[float] = None
    cancellation_reason: Optional[str] = None


class EarningsInput(BaseModel):
    earnings_amount: float


class SessionResponse(BaseModel):
    id: int
    salon_id: int
    master_id: Optional[int]
    service_id: Optional[int]
    client_name: str
    client_phone: str
    client_email: Optional[str]
    client_notes: Optional[str]
    starts_at: datetime
    ends_at: datetime
    duration_minutes: int
    status: SessionStatus
    price: Optional[float]
    deposit_paid: float
    total_paid: float
    earnings_amount: Optional[float]
    earnings_recorded_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionSummary(BaseModel):
    id: int
    client_name: str
    client_phone: str
    starts_at: datetime
    ends_at: datetime
    status: SessionStatus
    service_id: Optional[int]
    master_id: Optional[int]
    price: Optional[float]

    model_config = {"from_attributes": True}
