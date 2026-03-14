import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float,
    ForeignKey, Index, Text, JSON, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from app.database import Base


class DiscountType(str, enum.Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class LoyaltyProgram(Base):
    """Loyalty/promotion program for a salon."""
    __tablename__ = "loyalty_programs"

    id = Column(Integer, primary_key=True, index=True)
    salon_id = Column(Integer, ForeignKey("salons.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    discount_rules = relationship("DiscountRule", back_populates="program", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_loyalty_programs_salon", "salon_id"),
    )


class DiscountRule(Base):
    """Individual discount rule within a loyalty program."""
    __tablename__ = "discount_rules"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("loyalty_programs.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    discount_type = Column(SAEnum(DiscountType), nullable=False, default=DiscountType.PERCENTAGE)
    discount_value = Column(Float, nullable=False)   # percent or fixed amount
    # Conditions stored as JSON: {"min_visits": 3, "occasion": "birthday", "month": 12}
    conditions = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    program = relationship("LoyaltyProgram", back_populates="discount_rules")

    __table_args__ = (
        Index("ix_discount_rules_program", "program_id"),
    )
