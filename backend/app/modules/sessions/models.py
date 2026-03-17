import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Float, ForeignKey,
    Index, Text, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from app.database import Base


class SessionStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    professional_id = Column(Integer, ForeignKey("professionals.id", ondelete="SET NULL"), nullable=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="SET NULL"), nullable=True)

    # Client info (no account required)
    client_name = Column(String(255), nullable=False)
    client_phone = Column(String(30), nullable=False)
    client_email = Column(String(255), nullable=True)
    client_notes = Column(Text, nullable=True)

    # Scheduling
    starts_at = Column(DateTime, nullable=False)
    ends_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=60)

    # Status & payment
    status = Column(SAEnum(SessionStatus), default=SessionStatus.PENDING, nullable=False)
    price = Column(Float, nullable=True)
    deposit_paid = Column(Float, default=0.0)
    total_paid = Column(Float, default=0.0)

    # Professional earnings tracking
    earnings_amount = Column(Float, nullable=True)
    earnings_recorded_at = Column(DateTime, nullable=True)

    # Metadata
    cancellation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    provider = relationship("Provider", back_populates="sessions")
    professional = relationship("Professional", back_populates="sessions")
    service = relationship("Service", back_populates="sessions")
    payment = relationship("Payment", back_populates="session", uselist=False)
    notifications = relationship("Notification", back_populates="session")

    __table_args__ = (
        Index("ix_sessions_provider", "provider_id"),
        Index("ix_sessions_professional", "professional_id"),
        Index("ix_sessions_starts_at", "starts_at"),
        Index("ix_sessions_status", "status"),
        Index("ix_sessions_provider_date", "provider_id", "starts_at"),
        Index("ix_sessions_client_phone", "client_phone"),
    )

    def __repr__(self) -> str:
        return f"<Session id={self.id} client={self.client_name} at={self.starts_at}>"
