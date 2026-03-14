import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float,
    ForeignKey, Index, JSON, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from app.database import Base


class MasterStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"
    REJECTED = "rejected"


class Master(Base):
    __tablename__ = "masters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(30), nullable=True)
    bio = Column(String(1000), nullable=True)
    avatar_url = Column(String(512), nullable=True)
    social_links = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    user = relationship("User", back_populates="master_profile")
    master_salons = relationship("MasterSalon", back_populates="master")
    sessions = relationship("Session", back_populates="master")
    work_slots = relationship("WorkSlot", back_populates="master")

    __table_args__ = (
        Index("ix_masters_user", "user_id"),
    )

    def __repr__(self) -> str:
        return f"<Master id={self.id} name={self.name}>"


class MasterSalon(Base):
    """Many-to-many between masters and salons with approval status."""
    __tablename__ = "master_salons"

    id = Column(Integer, primary_key=True, index=True)
    master_id = Column(Integer, ForeignKey("masters.id", ondelete="CASCADE"), nullable=False)
    salon_id = Column(Integer, ForeignKey("salons.id", ondelete="CASCADE"), nullable=False)
    status = Column(SAEnum(MasterStatus), default=MasterStatus.PENDING, nullable=False)
    payment_amount = Column(Float, nullable=True)
    joined_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    master = relationship("Master", back_populates="master_salons")
    salon = relationship("Salon", back_populates="master_salons")

    __table_args__ = (
        Index("ix_master_salons_master_salon", "master_id", "salon_id", unique=True),
        Index("ix_master_salons_status", "status"),
    )
