import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float,
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
    """Monthly invoice for a master in a salon."""
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    salon_id = Column(Integer, ForeignKey("salons.id", ondelete="CASCADE"), nullable=False)
    master_id = Column(Integer, ForeignKey("masters.id", ondelete="CASCADE"), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    total_sessions = Column(Integer, default=0, nullable=False)
    total_revenue = Column(Float, default=0.0, nullable=False)   # combined session prices
    master_earnings = Column(Float, default=0.0, nullable=False)
    salon_earnings = Column(Float, default=0.0, nullable=False)
    master_percentage = Column(Float, default=70.0, nullable=False)
    status = Column(SAEnum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    salon = relationship("Salon")
    master = relationship("Master")

    __table_args__ = (
        Index("ix_invoices_salon", "salon_id"),
        Index("ix_invoices_master", "master_id"),
        Index("ix_invoices_period", "period_start", "period_end"),
    )


class EarningsSplit(Base):
    """Configurable revenue split between master and salon."""
    __tablename__ = "earnings_splits"

    id = Column(Integer, primary_key=True, index=True)
    salon_id = Column(Integer, ForeignKey("salons.id", ondelete="CASCADE"), nullable=False)
    master_id = Column(Integer, ForeignKey("masters.id", ondelete="CASCADE"), nullable=False)
    master_percentage = Column(Float, default=70.0, nullable=False)   # e.g. 70 → master gets 70%
    effective_from = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    salon = relationship("Salon", back_populates="earnings_splits")
    master = relationship("Master")

    __table_args__ = (
        Index("ix_earnings_splits_salon_master", "salon_id", "master_id"),
    )
