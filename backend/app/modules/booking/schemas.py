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


class BookingLookupResponse(BaseModel):
    session_id: int
    client_name: str
    client_phone: str
    provider_id: int
    provider_name: str
    provider_address: Optional[str]
    provider_phone: Optional[str]
    service_name: Optional[str]
    professional_id: Optional[int]
    professional_name: Optional[str]
    professional_phone: Optional[str]
    starts_at: datetime
    ends_at: datetime
    price: Optional[float]
    status: str
    cancellation_reason: Optional[str]
    confirmation_code: str
    created_at: datetime


class BookingCancelRequest(BaseModel):
    confirmation_code: str
    phone: str
    reason: Optional[str] = None
