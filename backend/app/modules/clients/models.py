from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Date, DateTime, Text, JSON, ForeignKey, Index,
)
from sqlalchemy.orm import relationship
from app.database import Base


class ClientProfile(Base):
    """Public client profile, keyed by phone number (global across providers)."""
    __tablename__ = "client_profiles"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(30), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    birth_date = Column(Date, nullable=True)
    avatar_url = Column(String(512), nullable=True)
    tags = Column(JSON, default=list)  # e.g. ["VIP", "regular"]
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    notes = relationship("ClientNote", back_populates="client", cascade="all, delete-orphan")
    photos = relationship("ClientPhoto", back_populates="client", cascade="all, delete-orphan")


class ClientNote(Base):
    """Private note added by a professional about a client.
    Visible only to: the creator professional, all professionals' notes are visible to their provider owner.
    """
    __tablename__ = "client_notes"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("client_profiles.id", ondelete="CASCADE"), nullable=False)
    professional_id = Column(Integer, ForeignKey("professionals.id", ondelete="CASCADE"), nullable=False)
    # provider_id stored for provider-level access (nullable for independent professionals)
    provider_id = Column(Integer, ForeignKey("providers.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("ClientProfile", back_populates="notes")

    __table_args__ = (
        Index("ix_client_notes_client", "client_id"),
        Index("ix_client_notes_professional", "professional_id"),
        Index("ix_client_notes_provider", "provider_id"),
    )


class ClientPhoto(Base):
    """Photo added by a professional for a client. Private — same visibility rules as ClientNote."""
    __tablename__ = "client_photos"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("client_profiles.id", ondelete="CASCADE"), nullable=False)
    professional_id = Column(Integer, ForeignKey("professionals.id", ondelete="CASCADE"), nullable=False)
    provider_id = Column(Integer, ForeignKey("providers.id", ondelete="SET NULL"), nullable=True)
    url = Column(String(512), nullable=False)
    caption = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    client = relationship("ClientProfile", back_populates="photos")

    __table_args__ = (
        Index("ix_client_photos_client", "client_id"),
        Index("ix_client_photos_professional", "professional_id"),
        Index("ix_client_photos_provider", "provider_id"),
    )
