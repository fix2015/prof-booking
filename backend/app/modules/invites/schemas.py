from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.modules.invites.models import InviteStatus


class InviteCreate(BaseModel):
    invited_email: EmailStr


class InviteResponse(BaseModel):
    id: int
    salon_id: int
    invited_email: str
    token: str
    status: InviteStatus
    expires_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class InviteValidation(BaseModel):
    token: str
    is_valid: bool
    salon_id: Optional[int]
    invited_email: Optional[str]
