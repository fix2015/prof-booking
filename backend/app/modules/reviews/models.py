import enum
import hashlib
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    ForeignKey, Index, Text, JSON, UniqueConstraint, Enum as SAEnum,
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


class ReviewReportReason(str, enum.Enum):
    SPAM = "spam"
    INAPPROPRIATE = "inappropriate"
    HARASSMENT = "harassment"
    OTHER = "other"


class ReviewReportStatus(str, enum.Enum):
    OPEN = "open"
    RESOLVED = "resolved"


def _values(e):
    return [m.value for m in e]


class ReviewReport(Base):
    """A signed-in user's report of an objectionable review (App Store guideline 1.2), handled by platform admins.
    A review with HIDE_THRESHOLD or more open reports is hidden from public endpoints until the reports are resolved."""
    __tablename__ = "review_reports"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    # Nullable only for anonymous reports filed before reporting required sign-in (migration 0020).
    reporter_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    reason = Column(
        SAEnum(ReviewReportReason, name="review_report_reason", values_callable=_values), nullable=False,
    )
    note = Column(Text, nullable=True)
    status = Column(
        SAEnum(ReviewReportStatus, name="review_report_status", values_callable=_values),
        nullable=False, default=ReviewReportStatus.OPEN, server_default=ReviewReportStatus.OPEN.value,
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("review_id", "reporter_user_id", name="uq_review_reports_review_reporter"),
    )
