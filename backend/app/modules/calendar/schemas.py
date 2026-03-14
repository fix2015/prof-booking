from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, time, datetime


class WorkSlotCreate(BaseModel):
    salon_id: int
    slot_date: date
    start_time: time
    end_time: time

    @field_validator("end_time")
    @classmethod
    def end_after_start(cls, v, info):
        if "start_time" in info.data and v <= info.data["start_time"]:
            raise ValueError("end_time must be after start_time")
        return v


class WorkSlotResponse(BaseModel):
    id: int
    master_id: int
    salon_id: int
    slot_date: date
    start_time: time
    end_time: time
    is_available: bool

    model_config = {"from_attributes": True}


class WeeklyScheduleCopy(BaseModel):
    source_week_start: date
    target_week_start: date
    salon_id: int


class AvailableSlot(BaseModel):
    master_id: int
    master_name: str
    slot_date: date
    start_time: time
    end_time: time
    work_slot_id: int


class AvailabilityQuery(BaseModel):
    salon_id: int
    date: date
    service_id: Optional[int] = None
    master_id: Optional[int] = None
    duration_minutes: int = 60


class PeriodCopy(BaseModel):
    """Copy all work slots from [source_start, source_end] to the same relative dates starting at target_start."""
    source_start: date
    source_end: date
    target_start: date
    salon_id: int
