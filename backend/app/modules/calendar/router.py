import logging

from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user, get_current_professional_or_owner
from app.modules.calendar.schemas import (
    WorkSlotCreate, WorkSlotResponse, WeeklyScheduleCopy, AvailableSlot, PeriodCopy,
)
from app.modules.calendar.services import (
    create_work_slot, delete_work_slot, get_professional_slots,
    copy_weekly_schedule, copy_period_schedule, get_available_slots, get_available_dates,
)
from app.modules.masters.services import get_professional_by_user_id
from app.modules.users.models import User

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/available-dates", response_model=List[str])
def get_available_dates_endpoint(
    provider_id: int = Query(...),
    date_from: date = Query(...),
    date_to: date = Query(...),
    duration_minutes: int = Query(60),
    professional_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Public: returns dates that have at least one bookable slot."""
    dates = get_available_dates(db, provider_id, date_from, date_to, duration_minutes, professional_id)
    return [str(d) for d in dates]


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


# ── Google Calendar Sync ────────────────────────────────────────────

@router.get("/google/auth-url")
def google_auth_url(current_user: User = Depends(get_current_user)):
    """Return the Google OAuth2 consent URL. Frontend redirects user there."""
    if not settings.GOOGLE_CLIENT_ID:
        from fastapi import HTTPException
        raise HTTPException(status_code=501, detail="Google Calendar integration not configured")
    from app.modules.calendar.google_sync import get_auth_url
    url = get_auth_url(state=str(current_user.id))
    return {"auth_url": url}


@router.get("/google/callback")
def google_callback(
    code: str = Query(...),
    state: str = Query(""),
    db: Session = Depends(get_db),
):
    """OAuth2 callback — Google redirects here after user consent."""
    from app.modules.calendar.google_sync import exchange_code, save_tokens

    # Derive frontend URL from redirect URI (same domain, no /api path)
    from urllib.parse import urlparse
    parsed = urlparse(settings.GOOGLE_REDIRECT_URI)
    base_url = f"{parsed.scheme}://{parsed.netloc}"

    try:
        token_data = exchange_code(code)
    except Exception as e:
        logger.error("Google OAuth code exchange failed: %s", e)
        return RedirectResponse(f"{base_url}/calendar?google=error")
    try:
        user_id = int(state)
    except ValueError:
        return RedirectResponse(f"{base_url}/calendar?google=error")
    save_tokens(db, user_id, token_data)
    return RedirectResponse(f"{base_url}/calendar?google=connected")


@router.post("/google/sync")
def google_sync(
    days_ahead: int = Query(30, ge=7, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch Google Calendar events and create blocked work slots."""
    from app.modules.calendar.google_sync import sync_google_calendar
    result = sync_google_calendar(db, current_user.id, days_ahead)
    if "error" in result:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/google/status")
def google_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check if Google Calendar is connected for the current user."""
    from app.modules.calendar.models import GoogleCalendarToken
    token = db.query(GoogleCalendarToken).filter(GoogleCalendarToken.user_id == current_user.id).first()
    if not token:
        return {"connected": False}
    return {
        "connected": True,
        "last_synced_at": token.last_synced_at.isoformat() if token.last_synced_at else None,
    }


@router.delete("/google/disconnect")
def google_disconnect(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove Google Calendar connection and synced blocked slots."""
    from app.modules.calendar.models import GoogleCalendarToken
    token = db.query(GoogleCalendarToken).filter(GoogleCalendarToken.user_id == current_user.id).first()
    if token:
        db.delete(token)
        db.commit()
    return {"ok": True}
