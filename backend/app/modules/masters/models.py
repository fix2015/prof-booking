import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Float,
    ForeignKey, Index, JSON, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from app.database import Base


class ProfessionalStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"
    REJECTED = "rejected"


class Professional(Base):
    """A service professional (worker/specialist) working at one or more providers."""
    __tablename__ = "professionals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(30), nullable=True)
    bio = Column(String(1000), nullable=True)
    avatar_url = Column(String(512), nullable=True)
    social_links = Column(JSON, default=dict)
    # Extended profile fields
    nationality = Column(String(100), nullable=True)
    experience_years = Column(Integer, nullable=True)
    description = Column(String(2000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    user = relationship("User", back_populates="professional_profile")
    professional_providers = relationship("ProfessionalProvider", back_populates="professional")
    sessions = relationship("Session", back_populates="professional")
    work_slots = relationship("WorkSlot", back_populates="professional")
    photos = relationship("ProfessionalPhoto", back_populates="professional", order_by="ProfessionalPhoto.order")
    reviews = relationship("Review", back_populates="professional")

    __table_args__ = (
        Index("ix_professionals_user", "user_id"),
    )

    def __repr__(self) -> str:
        return f"<Professional id={self.id} name={self.name}>"


class ProfessionalProvider(Base):
    """Many-to-many between professionals and providers with approval status."""
    __tablename__ = "professional_providers"

    id = Column(Integer, primary_key=True, index=True)
    professional_id = Column(Integer, ForeignKey("professionals.id", ondelete="CASCADE"), nullable=False)
    provider_id = Column(Integer, ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    status = Column(SAEnum(ProfessionalStatus), default=ProfessionalStatus.PENDING, nullable=False)
    payment_amount = Column(Float, nullable=True)
    joined_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    professional = relationship("Professional", back_populates="professional_providers")
    provider = relationship("Provider", back_populates="professional_providers")

    __table_args__ = (
        Index("ix_professional_providers_prof_prov", "professional_id", "provider_id", unique=True),
        Index("ix_professional_providers_status", "status"),
    )


class ProfessionalPhoto(Base):
    """Gallery photos for a professional's public profile."""
    __tablename__ = "professional_photos"

    id = Column(Integer, primary_key=True, index=True)
    professional_id = Column(Integer, ForeignKey("professionals.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(512), nullable=False)
    caption = Column(String(255), nullable=True)
    order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    professional = relationship("Professional", back_populates="photos")

    __table_args__ = (
        Index("ix_professional_photos_professional", "professional_id"),
    )


# Backward-compat aliases
MasterStatus = ProfessionalStatus
Master = Professional
MasterSalon = ProfessionalProvider
MasterPhoto = ProfessionalPhoto
