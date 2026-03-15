import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, DateTime, Float,
    ForeignKey, Index, Text, Date, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from app.database import Base


class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"


class Invoice(Base):
    """Monthly invoice for a professional at a service provider."""
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    professional_id = Column(Integer, ForeignKey("professionals.id", ondelete="CASCADE"), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    total_sessions = Column(Integer, default=0, nullable=False)
    total_revenue = Column(Float, default=0.0, nullable=False)
    professional_earnings = Column(Float, default=0.0, nullable=False)
    provider_earnings = Column(Float, default=0.0, nullable=False)
    professional_percentage = Column(Float, default=70.0, nullable=False)
    status = Column(SAEnum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    provider = relationship("Provider")
    professional = relationship("Professional")

    __table_args__ = (
        Index("ix_invoices_provider", "provider_id"),
        Index("ix_invoices_professional", "professional_id"),
        Index("ix_invoices_period", "period_start", "period_end"),
    )


class EarningsSplit(Base):
    """Configurable revenue split between professional and provider."""
    __tablename__ = "earnings_splits"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    professional_id = Column(Integer, ForeignKey("professionals.id", ondelete="CASCADE"), nullable=False)
    professional_percentage = Column(Float, default=70.0, nullable=False)
    effective_from = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    provider = relationship("Provider", back_populates="earnings_splits")
    professional = relationship("Professional")

    __table_args__ = (
        Index("ix_earnings_splits_provider_professional", "provider_id", "professional_id"),
    )
