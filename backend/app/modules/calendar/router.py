from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta

from app.database import get_db
from app.dependencies import get_current_user, get_current_professional_or_owner
from app.modules.calendar.schemas import (
    WorkSlotCreate, WorkSlotResponse, WeeklyScheduleCopy, AvailableSlot, PeriodCopy,
)
from app.modules.calendar.services import (
    create_work_slot, delete_work_slot, get_professional_slots,
    copy_weekly_schedule, copy_period_schedule, get_available_slots,
)
from app.modules.masters.services import get_professional_by_user_id
from app.modules.users.models import User

router = APIRouter()


@router.get("/availability", response_model=List[AvailableSlot])
def get_availability(
    provider_id: int = Query(...),
    date: date = Query(...),
    duration_minutes: int = Query(60),
    professional_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Public endpoint for the booking page."""
    return get_available_slots(db, provider_id, date, duration_minutes, professional_id)


@router.get("/slots/my", response_model=List[WorkSlotResponse])
def get_my_slots(
    date_from: date = Query(default_factory=date.today),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    professional = get_professional_by_user_id(db, current_user.id)
    if not professional:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Professional profile not found")
    if not date_to:
        date_to = date_from + timedelta(days=7)
    return get_professional_slots(db, professional.id, date_from, date_to)


@router.post("/slots", response_model=WorkSlotResponse, status_code=201)
def add_work_slot(
    data: WorkSlotCreate,
    current_user: User = Depends(get_current_professional_or_owner),
    db: Session = Depends(get_db),
):
    professional = get_professional_by_user_id(db, current_user.id)
    if not professional:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Professional profile not found")
    return create_work_slot(db, professional.id, data)


@router.delete("/slots/{slot_id}", status_code=204)
def remove_work_slot(
    slot_id: int,
    current_user: User = Depends(get_current_professional_or_owner),
    db: Session = Depends(get_db),
):
    professional = get_professional_by_user_id(db, current_user.id)
    if not professional:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Professional profile not found")
    delete_work_slot(db, professional.id, slot_id)


@router.post("/slots/copy-week", status_code=200)
def copy_week(
    data: WeeklyScheduleCopy,
    current_user: User = Depends(get_current_professional_or_owner),
    db: Session = Depends(get_db),
):
    professional = get_professional_by_user_id(db, current_user.id)
    if not professional:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Professional profile not found")
    created = copy_weekly_schedule(db, professional.id, data)
    return {"created": created}


@router.post("/slots/copy-period", status_code=200)
def copy_period(
    data: PeriodCopy,
    current_user: User = Depends(get_current_professional_or_owner),
    db: Session = Depends(get_db),
):
    """Copy slots from any date range to the same relative range starting at target_start."""
    professional = get_professional_by_user_id(db, current_user.id)
    if not professional:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Professional profile not found")
    created = copy_period_schedule(db, professional.id, data)
    return {"created": created}
