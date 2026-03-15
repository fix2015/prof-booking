import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey,
    Index, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from app.database import Base


class InviteStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    REVOKED = "revoked"


class Invite(Base):
    __tablename__ = "invites"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    invited_email = Column(String(255), nullable=False)
    token = Column(String(128), unique=True, nullable=False, index=True)
    status = Column(SAEnum(InviteStatus), default=InviteStatus.PENDING, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    accepted_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    accepted_at = Column(DateTime, nullable=True)

    provider = relationship("Provider", back_populates="invites")

    __table_args__ = (
        Index("ix_invites_provider", "provider_id"),
        Index("ix_invites_email", "invited_email"),
    )
