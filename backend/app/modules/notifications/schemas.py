from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.modules.notifications.models import NotificationType, NotificationStatus


class NotificationPreferenceResponse(BaseModel):
    daily_morning: bool = True
    weekly_schedule: bool = False
    eod_recap: bool = True
    cancellation: bool = True
    new_review: bool = False
    appointment_reminder: bool = True

    model_config = {"from_attributes": True}


class NotificationPreferenceUpdate(BaseModel):
    daily_morning: Optional[bool] = None
    weekly_schedule: Optional[bool] = None
    eod_recap: Optional[bool] = None
    cancellation: Optional[bool] = None
    new_review: Optional[bool] = None
    appointment_reminder: Optional[bool] = None


class PushSubscriptionRequest(BaseModel):
    endpoint: str
    keys: dict  # {"p256dh": "...", "auth": "..."}


class PushUnsubscribeRequest(BaseModel):
    endpoint: str


class NotificationResponse(BaseModel):
    id: int
    session_id: Optional[int]
    notification_type: NotificationType
    recipient: str
    subject: Optional[str]
    body: Optional[str] = None
    status: NotificationStatus
    sent_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}
