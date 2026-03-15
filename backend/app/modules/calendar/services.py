from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import date, timedelta, datetime, time
from typing import List, Optional

from app.modules.calendar.models import WorkSlot
from app.modules.calendar.schemas import WorkSlotCreate, WeeklyScheduleCopy, AvailableSlot, PeriodCopy
from app.modules.sessions.models import Session as BookingSession, SessionStatus
from app.modules.masters.models import Professional


def create_work_slot(db: Session, professional_id: int, data: WorkSlotCreate) -> WorkSlot:
    # Check overlap
    overlap = (
        db.query(WorkSlot)
        .filter(
            WorkSlot.professional_id == professional_id,
            WorkSlot.provider_id == data.provider_id,
            WorkSlot.slot_date == data.slot_date,
            WorkSlot.start_time < data.end_time,
            WorkSlot.end_time > data.start_time,
        )
        .first()
    )
    if overlap:
        raise HTTPException(status_code=409, detail="Overlapping work slot exists")

    slot = WorkSlot(
        professional_id=professional_id,
        provider_id=data.provider_id,
        slot_date=data.slot_date,
        start_time=data.start_time,
        end_time=data.end_time,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


def delete_work_slot(db: Session, professional_id: int, slot_id: int) -> None:
    slot = db.query(WorkSlot).filter(WorkSlot.id == slot_id, WorkSlot.professional_id == professional_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Work slot not found")
    db.delete(slot)
    db.commit()


def get_professional_slots(
    db: Session, professional_id: int, date_from: date, date_to: date
) -> List[WorkSlot]:
    return (
        db.query(WorkSlot)
        .filter(
            WorkSlot.professional_id == professional_id,
            WorkSlot.slot_date >= date_from,
            WorkSlot.slot_date <= date_to,
        )
        .order_by(WorkSlot.slot_date, WorkSlot.start_time)
        .all()
    )


# Backward-compat alias
get_master_slots = get_professional_slots


def copy_weekly_schedule(db: Session, professional_id: int, data: WeeklyScheduleCopy) -> int:
    """Copy all work slots from source week to target week."""
    source_end = data.source_week_start + timedelta(days=6)
    source_slots = get_professional_slots(db, professional_id, data.source_week_start, source_end)
    if not source_slots:
        raise HTTPException(status_code=404, detail="No slots found in source week")

    delta = data.target_week_start - data.source_week_start
    created = 0
    for slot in source_slots:
        new_date = slot.slot_date + delta
        try:
            create_work_slot(
                db,
                professional_id,
                WorkSlotCreate(
                    provider_id=data.provider_id,
                    slot_date=new_date,
                    start_time=slot.start_time,
                    end_time=slot.end_time,
                ),
            )
            created += 1
        except HTTPException:
            pass  # Skip overlaps
    return created


def copy_period_schedule(db: Session, professional_id: int, data: PeriodCopy) -> int:
    """Copy all work slots from [source_start, source_end] to the same relative dates starting at target_start."""
    source_slots = get_professional_slots(db, professional_id, data.source_start, data.source_end)
    if not source_slots:
        raise HTTPException(status_code=404, detail="No slots found in the source period")

    delta = data.target_start - data.source_start
    created = 0
    for slot in source_slots:
        new_date = slot.slot_date + delta
        try:
            create_work_slot(
                db,
                professional_id,
                WorkSlotCreate(
                    provider_id=data.provider_id,
                    slot_date=new_date,
                    start_time=slot.start_time,
                    end_time=slot.end_time,
                ),
            )
            created += 1
        except HTTPException:
            pass  # Skip overlaps silently
    return created


def get_available_slots(
    db: Session,
    provider_id: int,
    query_date: date,
    duration_minutes: int = 60,
    professional_id: Optional[int] = None,
) -> List[AvailableSlot]:
    """Compute available time slots for booking."""
    slot_query = (
        db.query(WorkSlot, Professional)
        .join(Professional, WorkSlot.professional_id == Professional.id)
        .filter(
            WorkSlot.provider_id == provider_id,
            WorkSlot.slot_date == query_date,
            WorkSlot.is_available == True,  # noqa: E712
        )
    )
    if professional_id:
        slot_query = slot_query.filter(WorkSlot.professional_id == professional_id)

    work_slots = slot_query.all()

    # Get existing bookings for the date
    day_start = datetime.combine(query_date, time.min)
    day_end = datetime.combine(query_date, time.max)
    bookings = (
        db.query(BookingSession)
        .filter(
            BookingSession.provider_id == provider_id,
            BookingSession.starts_at >= day_start,
            BookingSession.ends_at <= day_end,
            BookingSession.status.notin_([SessionStatus.CANCELLED, SessionStatus.NO_SHOW]),
        )
        .all()
    )
    booked_slots = {(b.professional_id, b.starts_at.time(), b.ends_at.time()) for b in bookings}

    available = []
    duration = timedelta(minutes=duration_minutes)

    for work_slot, professional in work_slots:
        # Walk the work slot in duration-sized chunks
        slot_start = datetime.combine(query_date, work_slot.start_time)
        slot_end = datetime.combine(query_date, work_slot.end_time)

        current = slot_start
        while current + duration <= slot_end:
            candidate_start = current.time()
            candidate_end = (current + duration).time()

            # Check if any booking conflicts
            is_free = not any(
                mid == work_slot.professional_id and s < candidate_end and e > candidate_start
                for (mid, s, e) in booked_slots
            )
            if is_free:
                available.append(
                    AvailableSlot(
                        professional_id=professional.id,
                        professional_name=professional.name,
                        slot_date=query_date,
                        start_time=candidate_start,
                        end_time=candidate_end,
                        work_slot_id=work_slot.id,
                    )
                )
            current += timedelta(minutes=30)  # 30-min step

    return available
