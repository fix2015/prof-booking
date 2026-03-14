from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import date, timedelta, datetime, time
from typing import List, Optional

from app.modules.calendar.models import WorkSlot
from app.modules.calendar.schemas import WorkSlotCreate, WeeklyScheduleCopy, AvailableSlot
from app.modules.sessions.models import Session as BookingSession, SessionStatus
from app.modules.masters.models import Master


def create_work_slot(db: Session, master_id: int, data: WorkSlotCreate) -> WorkSlot:
    # Check overlap
    overlap = (
        db.query(WorkSlot)
        .filter(
            WorkSlot.master_id == master_id,
            WorkSlot.salon_id == data.salon_id,
            WorkSlot.slot_date == data.slot_date,
            WorkSlot.start_time < data.end_time,
            WorkSlot.end_time > data.start_time,
        )
        .first()
    )
    if overlap:
        raise HTTPException(status_code=409, detail="Overlapping work slot exists")

    slot = WorkSlot(
        master_id=master_id,
        salon_id=data.salon_id,
        slot_date=data.slot_date,
        start_time=data.start_time,
        end_time=data.end_time,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


def delete_work_slot(db: Session, master_id: int, slot_id: int) -> None:
    slot = db.query(WorkSlot).filter(WorkSlot.id == slot_id, WorkSlot.master_id == master_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Work slot not found")
    db.delete(slot)
    db.commit()


def get_master_slots(
    db: Session, master_id: int, date_from: date, date_to: date
) -> List[WorkSlot]:
    return (
        db.query(WorkSlot)
        .filter(
            WorkSlot.master_id == master_id,
            WorkSlot.slot_date >= date_from,
            WorkSlot.slot_date <= date_to,
        )
        .order_by(WorkSlot.slot_date, WorkSlot.start_time)
        .all()
    )


def copy_weekly_schedule(db: Session, master_id: int, data: WeeklyScheduleCopy) -> int:
    """Copy all work slots from source week to target week."""
    source_end = data.source_week_start + timedelta(days=6)
    source_slots = get_master_slots(db, master_id, data.source_week_start, source_end)
    if not source_slots:
        raise HTTPException(status_code=404, detail="No slots found in source week")

    delta = data.target_week_start - data.source_week_start
    created = 0
    for slot in source_slots:
        new_date = slot.slot_date + delta
        try:
            create_work_slot(
                db,
                master_id,
                WorkSlotCreate(
                    salon_id=data.salon_id,
                    slot_date=new_date,
                    start_time=slot.start_time,
                    end_time=slot.end_time,
                ),
            )
            created += 1
        except HTTPException:
            pass  # Skip overlaps
    return created


def get_available_slots(
    db: Session,
    salon_id: int,
    query_date: date,
    duration_minutes: int = 60,
    master_id: Optional[int] = None,
) -> List[AvailableSlot]:
    """Compute available time slots for booking."""
    slot_query = (
        db.query(WorkSlot, Master)
        .join(Master, WorkSlot.master_id == Master.id)
        .filter(
            WorkSlot.salon_id == salon_id,
            WorkSlot.slot_date == query_date,
            WorkSlot.is_available == True,
        )
    )
    if master_id:
        slot_query = slot_query.filter(WorkSlot.master_id == master_id)

    work_slots = slot_query.all()

    # Get existing bookings for the date
    day_start = datetime.combine(query_date, time.min)
    day_end = datetime.combine(query_date, time.max)
    bookings = (
        db.query(BookingSession)
        .filter(
            BookingSession.salon_id == salon_id,
            BookingSession.starts_at >= day_start,
            BookingSession.ends_at <= day_end,
            BookingSession.status.notin_([SessionStatus.CANCELLED, SessionStatus.NO_SHOW]),
        )
        .all()
    )
    booked_slots = {(b.master_id, b.starts_at.time(), b.ends_at.time()) for b in bookings}

    available = []
    duration = timedelta(minutes=duration_minutes)

    for work_slot, master in work_slots:
        # Walk the work slot in duration-sized chunks
        slot_start = datetime.combine(query_date, work_slot.start_time)
        slot_end = datetime.combine(query_date, work_slot.end_time)

        current = slot_start
        while current + duration <= slot_end:
            candidate_start = current.time()
            candidate_end = (current + duration).time()

            # Check if any booking conflicts
            is_free = not any(
                mid == work_slot.master_id and s < candidate_end and e > candidate_start
                for (mid, s, e) in booked_slots
            )
            if is_free:
                available.append(
                    AvailableSlot(
                        master_id=master.id,
                        master_name=master.name,
                        slot_date=query_date,
                        start_time=candidate_start,
                        end_time=candidate_end,
                        work_slot_id=work_slot.id,
                    )
                )
            current += timedelta(minutes=30)  # 30-min step

    return available
