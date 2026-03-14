import enum
from datetime import datetime, date, time
from sqlalchemy import (
    Column, Integer, Boolean, DateTime, Date, Time, ForeignKey, Index,
    Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from app.database import Base


class WorkSlot(Base):
    """Defines when a master is available to take bookings."""
    __tablename__ = "work_slots"

    id = Column(Integer, primary_key=True, index=True)
    master_id = Column(Integer, ForeignKey("masters.id", ondelete="CASCADE"), nullable=False)
    salon_id = Column(Integer, ForeignKey("salons.id", ondelete="CASCADE"), nullable=False)
    slot_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    master = relationship("Master", back_populates="work_slots")

    __table_args__ = (
        Index("ix_work_slots_master_date", "master_id", "slot_date"),
        Index("ix_work_slots_salon_date", "salon_id", "slot_date"),
    )

    def __repr__(self) -> str:
        return f"<WorkSlot master={self.master_id} date={self.slot_date} {self.start_time}-{self.end_time}>"
