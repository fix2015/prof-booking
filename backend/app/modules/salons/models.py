from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float,
    ForeignKey, Index, Text, JSON,
)
from sqlalchemy.orm import relationship
from app.database import Base


class Salon(Base):
    __tablename__ = "salons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(String(500), nullable=True)
    phone = Column(String(30), nullable=True)
    email = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    logo_url = Column(String(512), nullable=True)
    worker_payment_amount = Column(Float, default=0.0)
    deposit_percentage = Column(Float, default=5.0, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    settings = Column(JSON, default=dict)

    # Relations
    owner = relationship("SalonOwner", back_populates="salon", uselist=False)
    master_salons = relationship("MasterSalon", back_populates="salon")
    services = relationship("Service", back_populates="salon")
    sessions = relationship("Session", back_populates="salon")
    invites = relationship("Invite", back_populates="salon")
    reviews = relationship("Review", back_populates="salon")
    earnings_splits = relationship("EarningsSplit", back_populates="salon")

    __table_args__ = (
        Index("ix_salons_name", "name"),
        Index("ix_salons_active", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<Salon id={self.id} name={self.name}>"


class SalonOwner(Base):
    __tablename__ = "salon_owners"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    salon_id = Column(Integer, ForeignKey("salons.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    user = relationship("User", back_populates="salon_owner")
    salon = relationship("Salon", back_populates="owner")

    __table_args__ = (
        Index("ix_salon_owners_user_salon", "user_id", "salon_id"),
    )
