from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class ClientProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    birth_date: Optional[date] = None
    avatar_url: Optional[str] = None
    tags: Optional[List[str]] = None


class ClientNoteCreate(BaseModel):
    title: str
    content: str


class ClientNoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class ClientNoteResponse(BaseModel):
    id: int
    client_id: int
    professional_id: int
    title: str
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ClientPhotoCreate(BaseModel):
    url: str
    caption: Optional[str] = None


class ClientPhotoResponse(BaseModel):
    id: int
    client_id: int
    professional_id: int
    url: str
    caption: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionSummary(BaseModel):
    id: int
    starts_at: datetime
    service_name: Optional[str] = None
    professional_name: Optional[str] = None
    status: str
    price: Optional[float] = None

    model_config = {"from_attributes": True}


class ClientListItem(BaseModel):
    id: int
    phone: str
    name: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    tags: Optional[List[str]] = None
    total_visits: int = 0
    last_visit_at: Optional[datetime] = None
    total_spent: float = 0.0

    model_config = {"from_attributes": True}


class ClientDetailResponse(BaseModel):
    id: int
    phone: str
    name: str
    email: Optional[str] = None
    birth_date: Optional[date] = None
    avatar_url: Optional[str] = None
    tags: Optional[List[str]] = None
    created_at: datetime
    my_notes: List[ClientNoteResponse] = []
    my_photos: List[ClientPhotoResponse] = []
    total_visits: int = 0
    last_visit_at: Optional[datetime] = None
    total_spent: float = 0.0
    recent_sessions: List[SessionSummary] = []

    model_config = {"from_attributes": True}
