from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.modules.notifications.models import NotificationType, NotificationStatus


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
