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


def get_available_dates(
    db: Session,
    provider_id: int,
    date_from: date,
    date_to: date,
    duration_minutes: int = 60,
    professional_id: Optional[int] = None,
) -> List[date]:
    """Return dates in [date_from, date_to] that have at least one bookable slot."""
    slot_query = db.query(WorkSlot).filter(
        WorkSlot.provider_id == provider_id,
        WorkSlot.slot_date >= date_from,
        WorkSlot.slot_date <= date_to,
        WorkSlot.is_available == True,  # noqa: E712
    )
    if professional_id:
        slot_query = slot_query.filter(WorkSlot.professional_id == professional_id)

    work_slots = slot_query.all()
    if not work_slots:
        return []

    prof_ids = list({ws.professional_id for ws in work_slots})
    period_start = datetime.combine(date_from, time.min)
    period_end = datetime.combine(date_to, time(23, 59, 59))

    bookings = (
        db.query(BookingSession)
        .filter(
            BookingSession.professional_id.in_(prof_ids),
            BookingSession.starts_at >= period_start,
            BookingSession.starts_at <= period_end,
            BookingSession.status.notin_([SessionStatus.CANCELLED, SessionStatus.NO_SHOW]),
        )
        .all()
    )

    booked_by_prof_date: dict = {}
    for b in bookings:
        key = (b.professional_id, b.starts_at.date())
        booked_by_prof_date.setdefault(key, []).append((b.starts_at.time(), b.ends_at.time()))

    available_dates: set = set()
    duration = timedelta(minutes=duration_minutes)

    for ws in work_slots:
        if ws.slot_date in available_dates:
            continue
        booked = booked_by_prof_date.get((ws.professional_id, ws.slot_date), [])
        slot_start = datetime.combine(ws.slot_date, ws.start_time)
        slot_end = datetime.combine(ws.slot_date, ws.end_time)
        current = slot_start
        while current + duration <= slot_end:
            cs = current.time()
            ce = (current + duration).time()
            if not any(bs < ce and be > cs for (bs, be) in booked):
                available_dates.add(ws.slot_date)
                break
            current += timedelta(minutes=30)

    return sorted(available_dates)


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

    # Fetch ALL bookings for the professionals in these slots, across all providers.
    # This matches create_session's conflict check which is not provider-scoped.
    day_start = datetime.combine(query_date, time.min)
    next_day_start = day_start + timedelta(days=1)
    prof_ids = list({ws.professional_id for ws, _ in work_slots})
    bookings = (
        db.query(BookingSession)
        .filter(
            BookingSession.professional_id.in_(prof_ids),
            BookingSession.starts_at >= day_start,
            BookingSession.starts_at < next_day_start,
            BookingSession.status.notin_([SessionStatus.CANCELLED, SessionStatus.NO_SHOW]),
        )
        .all()
    ) if prof_ids else []
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
