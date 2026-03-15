from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime


class PublicBookingRequest(BaseModel):
    provider_id: int
    service_id: int
    professional_id: Optional[int] = None
    client_name: str
    client_phone: str
    client_email: Optional[EmailStr] = None
    client_notes: Optional[str] = None
    starts_at: datetime

    @field_validator("client_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Client name is required")
        return v.strip()

    @field_validator("client_phone")
    @classmethod
    def phone_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Client phone is required")
        return v.strip()


class BookingConfirmation(BaseModel):
    session_id: int
    client_name: str
    client_phone: str
    provider_name: str
    service_name: Optional[str]
    professional_name: Optional[str]
    starts_at: datetime
    ends_at: datetime
    price: Optional[float]
    confirmation_code: str
