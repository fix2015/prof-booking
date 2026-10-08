import hashlib
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    ForeignKey, Index, Text, JSON,
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
    images = Column(JSON, default=list, nullable=True)  # up to 3 image URLs
    is_published = Column(Boolean, default=True, nullable=False)
    is_demo = Column(Boolean, default=False, nullable=False, server_default="false")  # sample review
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    professional = relationship("Professional", back_populates="reviews")
    provider = relationship("Provider", back_populates="reviews")

    @property
    def author_key(self) -> str:
        """Stable, non-reversible id of the review's author — lets clients block a reviewer without exposing
        their phone number."""
        ident = (self.client_phone or "").strip() or (self.client_name or "").strip().lower()
        return hashlib.sha256(ident.encode()).hexdigest()[:16]

    __table_args__ = (
        Index("ix_reviews_professional", "professional_id"),
        Index("ix_reviews_provider", "provider_id"),
        Index("ix_reviews_session", "session_id"),
    )


class ReviewReport(Base):
    """A user's report of an objectionable review (App Store guideline 1.2), handled by platform admins."""
    __tablename__ = "review_reports"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    reason = Column(String(30), nullable=False)
    details = Column(Text, nullable=True)
    reporter_key = Column(String(64), nullable=True)  # hashed IP / user id — one report per reporter counts
    is_resolved = Column(Boolean, default=False, nullable=False, server_default="false")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
