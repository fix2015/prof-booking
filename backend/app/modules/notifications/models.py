import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey,
    Index, Text, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from app.database import Base


class NotificationType(str, enum.Enum):
    SMS_CONFIRMATION = "sms_confirmation"
    SMS_REMINDER = "sms_reminder"
    EMAIL_CONFIRMATION = "email_confirmation"
    EMAIL_REMINDER = "email_reminder"


class NotificationStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=True)
    notification_type = Column(SAEnum(NotificationType), nullable=False)
    recipient = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=True)
    body = Column(Text, nullable=False)
    status = Column(SAEnum(NotificationStatus), default=NotificationStatus.PENDING)
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("Session", back_populates="notifications")

    __table_args__ = (
        Index("ix_notifications_session", "session_id"),
        Index("ix_notifications_status", "status"),
    )
