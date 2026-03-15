from datetime import datetime
from sqlalchemy import (
    Column, Integer, Boolean, DateTime, Date, Time, ForeignKey, Index,
)
from sqlalchemy.orm import relationship
from app.database import Base


class WorkSlot(Base):
    """Defines when a professional is available to take bookings."""
    __tablename__ = "work_slots"

    id = Column(Integer, primary_key=True, index=True)
    professional_id = Column(Integer, ForeignKey("professionals.id", ondelete="CASCADE"), nullable=False)
    provider_id = Column(Integer, ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    slot_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    professional = relationship("Professional", back_populates="work_slots")

    __table_args__ = (
        Index("ix_work_slots_professional_date", "professional_id", "slot_date"),
        Index("ix_work_slots_provider_date", "provider_id", "slot_date"),
    )

    def __repr__(self) -> str:
        return f"<WorkSlot professional={self.professional_id} date={self.slot_date} {self.start_time}-{self.end_time}>"
