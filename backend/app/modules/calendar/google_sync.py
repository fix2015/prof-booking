"""
Google Calendar sync: fetch events and create blocked (is_available=False) work slots.

Flow:
1. User clicks "Sync Google Calendar" → redirected to Google OAuth consent
2. Google redirects back with auth code → we exchange for tokens
3. User triggers sync → we fetch events from Google Calendar → create blocked slots
"""

import logging
from datetime import date, datetime, timedelta, time as dt_time
from typing import Optional
from urllib.parse import urlencode

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.modules.calendar.models import GoogleCalendarToken, WorkSlot
from app.modules.masters.models import Professional

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"
SCOPES = "https://www.googleapis.com/auth/calendar.readonly"


def get_auth_url(state: str) -> str:
    """Generate the Google OAuth2 consent URL."""
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPES,
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def exchange_code(code: str) -> dict:
    """Exchange authorization code for access + refresh tokens."""
    resp = httpx.post(GOOGLE_TOKEN_URL, data={
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }, timeout=15)
    resp.raise_for_status()
    return resp.json()


def refresh_access_token(refresh_token: str) -> dict:
    """Refresh an expired access token."""
    resp = httpx.post(GOOGLE_TOKEN_URL, data={
        "refresh_token": refresh_token,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "grant_type": "refresh_token",
    }, timeout=15)
    resp.raise_for_status()
    return resp.json()


def save_tokens(db: Session, user_id: int, token_data: dict) -> GoogleCalendarToken:
    """Save or update Google tokens for a user."""
    token = db.query(GoogleCalendarToken).filter(GoogleCalendarToken.user_id == user_id).first()
    expires_in = token_data.get("expires_in", 3600)
    if token:
        token.access_token = token_data["access_token"]
        if token_data.get("refresh_token"):
            token.refresh_token = token_data["refresh_token"]
        token.token_expiry = datetime.utcnow() + timedelta(seconds=expires_in)
    else:
        token = GoogleCalendarToken(
            user_id=user_id,
            access_token=token_data["access_token"],
            refresh_token=token_data.get("refresh_token"),
            token_expiry=datetime.utcnow() + timedelta(seconds=expires_in),
        )
        db.add(token)
    db.commit()
    db.refresh(token)
    return token


def _get_valid_token(db: Session, user_id: int) -> Optional[str]:
    """Get a valid access token, refreshing if expired."""
    token = db.query(GoogleCalendarToken).filter(GoogleCalendarToken.user_id == user_id).first()
    if not token:
        return None

    if token.token_expiry and token.token_expiry < datetime.utcnow():
        if not token.refresh_token:
            return None
        try:
            new_data = refresh_access_token(token.refresh_token)
            token.access_token = new_data["access_token"]
            token.token_expiry = datetime.utcnow() + timedelta(seconds=new_data.get("expires_in", 3600))
            db.commit()
        except Exception as e:
            logger.error("Failed to refresh Google token for user %d: %s", user_id, e)
            return None

    return token.access_token


def fetch_google_events(access_token: str, time_min: datetime, time_max: datetime, calendar_id: str = "primary") -> list[dict]:
    """Fetch events from Google Calendar API."""
    events = []
    page_token = None

    while True:
        params = {
            "timeMin": time_min.isoformat() + "Z",
            "timeMax": time_max.isoformat() + "Z",
            "singleEvents": "true",
            "orderBy": "startTime",
            "maxResults": 250,
        }
        if page_token:
            params["pageToken"] = page_token

        resp = httpx.get(
            f"{GOOGLE_CALENDAR_API}/calendars/{calendar_id}/events",
            headers={"Authorization": f"Bearer {access_token}"},
            params=params,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        events.extend(data.get("items", []))

        page_token = data.get("nextPageToken")
        if not page_token:
            break

    return events


def sync_google_calendar(db: Session, user_id: int, days_ahead: int = 30) -> dict:
    """
    Sync Google Calendar events as blocked work slots.
    Returns: {"synced": N, "skipped": N}
    """
    access_token = _get_valid_token(db, user_id)
    if not access_token:
        return {"error": "No valid Google token. Please re-authorize."}

    prof = db.query(Professional).filter(Professional.user_id == user_id).first()
    if not prof:
        return {"error": "Professional profile not found"}

    # Get provider_id from professional's active provider
    from app.modules.masters.models import ProfessionalProvider, ProfessionalStatus
    pp = db.query(ProfessionalProvider).filter(
        ProfessionalProvider.professional_id == prof.id,
        ProfessionalProvider.status == ProfessionalStatus.ACTIVE,
    ).first()
    provider_id = pp.provider_id if pp else None
    if not provider_id:
        return {"error": "Not linked to any active provider"}

    token_record = db.query(GoogleCalendarToken).filter(GoogleCalendarToken.user_id == user_id).first()
    calendar_id = token_record.calendar_id if token_record else "primary"

    # Fetch events for the next N days
    now = datetime.utcnow()
    time_max = now + timedelta(days=days_ahead)

    try:
        events = fetch_google_events(access_token, now, time_max, calendar_id)
    except Exception as e:
        logger.error("Failed to fetch Google Calendar events: %s", e)
        return {"error": "Failed to fetch events from Google Calendar"}

    # Remove old google-synced blocked slots (is_available=False) for this period
    today = date.today()
    end_date = today + timedelta(days=days_ahead)
    db.query(WorkSlot).filter(
        WorkSlot.professional_id == prof.id,
        WorkSlot.is_available == False,  # noqa: E712
        WorkSlot.slot_date >= today,
        WorkSlot.slot_date <= end_date,
    ).delete(synchronize_session="fetch")

    synced = 0
    skipped = 0

    for event in events:
        start = event.get("start", {})
        end = event.get("end", {})

        # Skip all-day events with no specific time
        if "dateTime" not in start:
            # All-day event: block full day (8AM-10PM)
            event_date_str = start.get("date")
            if not event_date_str:
                skipped += 1
                continue
            event_date = date.fromisoformat(event_date_str)
            if event_date < today:
                skipped += 1
                continue
            slot = WorkSlot(
                professional_id=prof.id,
                provider_id=provider_id,
                slot_date=event_date,
                start_time=dt_time(8, 0),
                end_time=dt_time(22, 0),
                is_available=False,
            )
            db.add(slot)
            synced += 1
            continue

        # Timed event
        try:
            start_dt = datetime.fromisoformat(start["dateTime"].replace("Z", "+00:00"))
            end_dt = datetime.fromisoformat(end["dateTime"].replace("Z", "+00:00"))
        except (ValueError, KeyError):
            skipped += 1
            continue

        event_date = start_dt.date()
        if event_date < today:
            skipped += 1
            continue

        slot = WorkSlot(
            professional_id=prof.id,
            provider_id=provider_id,
            slot_date=event_date,
            start_time=start_dt.time().replace(second=0, microsecond=0),
            end_time=end_dt.time().replace(second=0, microsecond=0),
            is_available=False,
        )
        db.add(slot)
        synced += 1

    # Update last synced timestamp
    if token_record:
        token_record.last_synced_at = datetime.utcnow()

    db.commit()
    return {"synced": synced, "skipped": skipped}
