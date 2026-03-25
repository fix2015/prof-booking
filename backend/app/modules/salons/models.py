from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float,
    ForeignKey, Index, Text, JSON,
)
from sqlalchemy.orm import relationship
from app.database import Base


class Provider(Base):
    """A business/service provider (e.g. nail salon, barbershop, car repair shop)."""
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(String(500), nullable=True)
    phone = Column(String(30), nullable=True)
    email = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    logo_url = Column(String(512), nullable=True)
    category = Column(String(100), nullable=True)  # e.g. "Beauty", "Hair", "Car Repair"
    worker_payment_amount = Column(Float, default=0.0)
    deposit_percentage = Column(Float, default=5.0, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    settings = Column(JSON, default=dict)

    # Relations
    owner = relationship("ProviderOwner", back_populates="provider", uselist=False)
    professional_providers = relationship("ProfessionalProvider", back_populates="provider")
    services = relationship("Service", secondary="service_providers")
    sessions = relationship("Session", back_populates="provider")
    invites = relationship("Invite", back_populates="provider")
    reviews = relationship("Review", back_populates="provider")
    earnings_splits = relationship("EarningsSplit", back_populates="provider")

    __table_args__ = (
        Index("ix_providers_name", "name"),
        Index("ix_providers_active", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<Provider id={self.id} name={self.name}>"


class ProviderOwner(Base):
    """Maps a user to the service provider they own."""
    __tablename__ = "provider_owners"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    provider_id = Column(Integer, ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    user = relationship("User", back_populates="provider_owner")
    provider = relationship("Provider", back_populates="owner")

    __table_args__ = (
        Index("ix_provider_owners_user_provider", "user_id", "provider_id"),
    )


# Aliases for backward compatibility with other modules that import "Salon"/"SalonOwner"
Salon = Provider
SalonOwner = ProviderOwner
