import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float, ForeignKey,
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
    salon_id = Column(Integer, ForeignKey("salons.id", ondelete="CASCADE"), nullable=False)
    master_id = Column(Integer, ForeignKey("masters.id", ondelete="SET NULL"), nullable=True)
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

    # Master earnings tracking
    earnings_amount = Column(Float, nullable=True)
    earnings_recorded_at = Column(DateTime, nullable=True)

    # Metadata
    cancellation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    salon = relationship("Salon", back_populates="sessions")
    master = relationship("Master", back_populates="sessions")
    service = relationship("Service", back_populates="sessions")
    payment = relationship("Payment", back_populates="session", uselist=False)
    notifications = relationship("Notification", back_populates="session")

    __table_args__ = (
        Index("ix_sessions_salon", "salon_id"),
        Index("ix_sessions_master", "master_id"),
        Index("ix_sessions_starts_at", "starts_at"),
        Index("ix_sessions_status", "status"),
        Index("ix_sessions_salon_date", "salon_id", "starts_at"),
    )

    def __repr__(self) -> str:
        return f"<Session id={self.id} client={self.client_name} at={self.starts_at}>"
