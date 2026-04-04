"""
Scheduled alert logic for notification preferences.

Each function queries users who have the corresponding preference enabled,
then sends notifications via Telegram + Web Push.
"""
import logging
from datetime import date, datetime, timedelta, time
from sqlalchemy.orm import Session

from app.modules.notifications.models import NotificationPreference
from app.modules.sessions.models import Session as BookingSession, SessionStatus
from app.modules.masters.models import Professional

logger = logging.getLogger(__name__)

PREF_FIELDS = [
    "daily_morning", "weekly_schedule", "eod_recap",
    "cancellation", "new_review", "appointment_reminder",
]


def _get_users_with_pref(db: Session, pref_key: str) -> list[int]:
    """Return user_ids where the given preference is enabled."""
    rows = (
        db.query(NotificationPreference.user_id)
        .filter(getattr(NotificationPreference, pref_key) == 1)
        .all()
    )
    return [r[0] for r in rows]


def _get_professional_for_user(db: Session, user_id: int):
    return db.query(Professional).filter(Professional.user_id == user_id).first()


def _send_to_user(db: Session, user_id: int, title: str, body: str, url: str = "/sessions"):
    """Send notification via both Telegram and Web Push."""
    try:
        from app.modules.notifications.telegram import send_telegram
        tg_text = f"<b>{title}</b>\n\n{body}"
        send_telegram(db, user_id, tg_text)
    except Exception as e:
        logger.error("Telegram send failed for user %d: %s", user_id, e)

    try:
        from app.modules.notifications.webpush import send_web_push
        send_web_push(db, user_id, title, body, url=url)
    except Exception as e:
        logger.error("Web push failed for user %d: %s", user_id, e)


def run_daily_morning_brief(db: Session):
    """Send tomorrow's bookings summary to professionals who opted in. Runs at 8 AM."""
    user_ids = _get_users_with_pref(db, "daily_morning")
    tomorrow = date.today() + timedelta(days=1)
    dt_start = datetime.combine(tomorrow, time.min)
    dt_end = datetime.combine(tomorrow, time.max)

    for user_id in user_ids:
        prof = _get_professional_for_user(db, user_id)
        if not prof:
            continue

        sessions = (
            db.query(BookingSession)
            .filter(
                BookingSession.professional_id == prof.id,
                BookingSession.starts_at >= dt_start,
                BookingSession.starts_at <= dt_end,
                BookingSession.status.in_([SessionStatus.PENDING, SessionStatus.CONFIRMED]),
            )
            .order_by(BookingSession.starts_at)
            .all()
        )

        if not sessions:
            continue

        lines = [f"{s.starts_at.strftime('%I:%M %p')} — {s.client_name}" for s in sessions]
        body = f"You have {len(sessions)} booking{'s' if len(sessions) > 1 else ''} tomorrow ({tomorrow.strftime('%b %d')}):\n" + "\n".join(lines)
        _send_to_user(db, user_id, "Morning Brief", body, url="/calendar")


def run_weekly_schedule(db: Session):
    """Send next week's full agenda. Runs Sunday 7 PM."""
    user_ids = _get_users_with_pref(db, "weekly_schedule")
    today = date.today()
    # Next Monday
    next_monday = today + timedelta(days=(7 - today.weekday()))
    next_sunday = next_monday + timedelta(days=6)
    dt_start = datetime.combine(next_monday, time.min)
    dt_end = datetime.combine(next_sunday, time.max)

    for user_id in user_ids:
        prof = _get_professional_for_user(db, user_id)
        if not prof:
            continue

        sessions = (
            db.query(BookingSession)
            .filter(
                BookingSession.professional_id == prof.id,
                BookingSession.starts_at >= dt_start,
                BookingSession.starts_at <= dt_end,
                BookingSession.status.in_([SessionStatus.PENDING, SessionStatus.CONFIRMED]),
            )
            .order_by(BookingSession.starts_at)
            .all()
        )

        if not sessions:
            _send_to_user(db, user_id, "Weekly Schedule", "No bookings next week — enjoy your time off!", url="/calendar")
            continue

        # Group by day
        by_day: dict[str, list[str]] = {}
        for s in sessions:
            day_key = s.starts_at.strftime("%a %b %d")
            by_day.setdefault(day_key, []).append(f"  {s.starts_at.strftime('%I:%M %p')} — {s.client_name}")

        lines = []
        for day, entries in by_day.items():
            lines.append(f"\n{day}:")
            lines.extend(entries)

        body = f"{len(sessions)} booking{'s' if len(sessions) > 1 else ''} next week:" + "\n".join(lines)
        _send_to_user(db, user_id, "Weekly Schedule", body, url="/calendar")


def run_eod_recap(db: Session):
    """Send end-of-day recap: completed sessions + revenue. Runs at 9 PM."""
    user_ids = _get_users_with_pref(db, "eod_recap")
    today = date.today()
    dt_start = datetime.combine(today, time.min)
    dt_end = datetime.combine(today, time.max)

    for user_id in user_ids:
        prof = _get_professional_for_user(db, user_id)
        if not prof:
            continue

        sessions = (
            db.query(BookingSession)
            .filter(
                BookingSession.professional_id == prof.id,
                BookingSession.starts_at >= dt_start,
                BookingSession.starts_at <= dt_end,
                BookingSession.status == SessionStatus.COMPLETED,
            )
            .all()
        )

        total_revenue = sum(s.price or 0 for s in sessions)
        completed = len(sessions)

        if completed == 0:
            body = "No completed sessions today."
        else:
            body = (
                f"Completed: {completed} session{'s' if completed > 1 else ''}\n"
                f"Revenue: ${total_revenue:.2f}"
            )

        _send_to_user(db, user_id, "End-of-Day Recap", body, url="/sessions")


def run_appointment_reminders(db: Session):
    """Send reminder 1 hour before each session. Runs every 15 minutes."""
    user_ids = _get_users_with_pref(db, "appointment_reminder")
    if not user_ids:
        return

    now = datetime.utcnow()
    window_start = now + timedelta(minutes=45)
    window_end = now + timedelta(minutes=75)

    # Find sessions starting in ~1 hour for opted-in professionals
    profs = db.query(Professional).filter(Professional.user_id.in_(user_ids)).all()
    prof_map = {p.id: p.user_id for p in profs}
    if not prof_map:
        return

    sessions = (
        db.query(BookingSession)
        .filter(
            BookingSession.professional_id.in_(prof_map.keys()),
            BookingSession.starts_at >= window_start,
            BookingSession.starts_at <= window_end,
            BookingSession.status.in_([SessionStatus.PENDING, SessionStatus.CONFIRMED]),
        )
        .all()
    )

    for s in sessions:
        user_id = prof_map.get(s.professional_id)
        if not user_id:
            continue
        body = (
            f"{s.client_name} at {s.starts_at.strftime('%I:%M %p')}\n"
            f"Service: {s.service.name if s.service else 'N/A'}"
        )
        _send_to_user(db, user_id, "Upcoming Appointment", body, url="/calendar")


def send_cancellation_alert(db: Session, session: BookingSession):
    """Instant alert when a booking is cancelled. Called from booking cancellation flow."""
    if not session.professional_id:
        return
    prof = db.query(Professional).filter(Professional.id == session.professional_id).first()
    if not prof or not prof.user_id:
        return

    # Check if user has cancellation alerts enabled
    pref = db.query(NotificationPreference).filter(NotificationPreference.user_id == prof.user_id).first()
    if not pref or not pref.cancellation:
        return

    body = (
        f"Client: {session.client_name}\n"
        f"Date: {session.starts_at.strftime('%b %d, %Y at %I:%M %p')}\n"
        f"Reason: {session.cancellation_reason or 'Not specified'}"
    )
    _send_to_user(db, prof.user_id, "Booking Cancelled", body, url="/sessions")


def send_new_review_alert(db: Session, professional_id: int, reviewer_name: str, rating: int, comment: str | None):
    """Instant alert when a client leaves a review. Called from review creation flow."""
    prof = db.query(Professional).filter(Professional.id == professional_id).first()
    if not prof or not prof.user_id:
        return

    pref = db.query(NotificationPreference).filter(NotificationPreference.user_id == prof.user_id).first()
    if not pref or not pref.new_review:
        return

    stars = "★" * rating + "☆" * (5 - rating)
    body = f"{stars}\nFrom: {reviewer_name}"
    if comment:
        body += f'\n"{comment}"'
    _send_to_user(db, prof.user_id, "New Review", body, url="/reviews")
