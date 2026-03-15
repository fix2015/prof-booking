from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    ForeignKey, Index, Text,
)
from sqlalchemy.orm import relationship
from app.database import Base


class Review(Base):
    """Client review after a completed session."""
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True, unique=True)
    professional_id = Column(Integer, ForeignKey("professionals.id", ondelete="CASCADE"), nullable=False)
    provider_id = Column(Integer, ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    client_name = Column(String(255), nullable=False)
    client_phone = Column(String(30), nullable=True)
    rating = Column(Integer, nullable=False)   # 1-5
    comment = Column(Text, nullable=True)
    is_published = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    professional = relationship("Professional", back_populates="reviews")
    provider = relationship("Provider", back_populates="reviews")

    __table_args__ = (
        Index("ix_reviews_professional", "professional_id"),
        Index("ix_reviews_provider", "provider_id"),
        Index("ix_reviews_session", "session_id"),
    )
