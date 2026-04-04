import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey,
    Index, Text, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from app.database import Base


class NotificationType(str, enum.Enum):
    SMS_CONFIRMATION = "sms_confirmation"
    SMS_REMINDER = "sms_reminder"
    EMAIL_CONFIRMATION = "email_confirmation"
    EMAIL_REMINDER = "email_reminder"
    TELEGRAM = "telegram"
    WEB_PUSH = "web_push"


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


class NotificationPreference(Base):
    """Per-user notification alert preferences (toggles)."""
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    daily_morning = Column(Integer, default=1, nullable=False)       # Tomorrow's bookings at 8 AM
    weekly_schedule = Column(Integer, default=0, nullable=False)     # Next week agenda Sunday 7 PM
    eod_recap = Column(Integer, default=1, nullable=False)           # End-of-day recap at 9 PM
    cancellation = Column(Integer, default=1, nullable=False)        # Instant cancellation alerts
    new_review = Column(Integer, default=0, nullable=False)          # Instant new review alerts
    appointment_reminder = Column(Integer, default=1, nullable=False)  # 1 hour before session

    user = relationship("User")


class PushSubscription(Base):
    """Stores browser push subscription info for Web Push notifications."""
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    endpoint = Column(Text, nullable=False)
    p256dh = Column(String(255), nullable=False)
    auth = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")

    __table_args__ = (
        Index("ix_push_sub_user", "user_id"),
        Index("ix_push_sub_endpoint", "endpoint", unique=True),
    )


class TelegramLink(Base):
    """Maps an app user to their Telegram chat ID for bot notifications."""
    __tablename__ = "telegram_links"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    chat_id = Column(String(64), nullable=False, index=True)
    username = Column(String(255), nullable=True)
    linked_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")
