import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey,
    Index, Enum as SAEnum, Text,
)
from sqlalchemy.orm import relationship
from app.database import Base


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class PaymentType(str, enum.Enum):
    DEPOSIT = "deposit"
    FULL = "full"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, unique=True)
    stripe_payment_intent_id = Column(String(255), unique=True, nullable=True, index=True)
    stripe_checkout_session_id = Column(String(255), unique=True, nullable=True, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="usd", nullable=False)
    payment_type = Column(SAEnum(PaymentType), default=PaymentType.FULL, nullable=False)
    status = Column(SAEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    stripe_receipt_url = Column(String(512), nullable=True)
    failure_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    session = relationship("Session", back_populates="payment")

    __table_args__ = (
        Index("ix_payments_status", "status"),
    )
