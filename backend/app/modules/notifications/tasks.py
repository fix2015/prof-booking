"""
Background task queue using Redis + Celery.
These tasks handle async notifications and reminders.
"""
from celery import Celery
from celery.schedules import crontab
from app.config import settings

celery_app = Celery(
    "nail_salon_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_expires=3600,
    timezone="UTC",
    enable_utc=True,
)


# ── Scheduled alert tasks ───────────────────────────────────────────

@celery_app.task(name="notifications.daily_morning_brief")
def task_daily_morning_brief():
    """8 AM: send tomorrow's bookings summary."""
    from app.database import SessionLocal
    from app.modules.notifications.scheduled_alerts import run_daily_morning_brief
    db = SessionLocal()
    try:
        run_daily_morning_brief(db)
    finally:
        db.close()


@celery_app.task(name="notifications.weekly_schedule")
def task_weekly_schedule():
    """Sunday 7 PM: send next week's full agenda."""
    from app.database import SessionLocal
    from app.modules.notifications.scheduled_alerts import run_weekly_schedule
    db = SessionLocal()
    try:
        run_weekly_schedule(db)
    finally:
        db.close()


@celery_app.task(name="notifications.eod_recap")
def task_eod_recap():
    """9 PM: send end-of-day completed sessions + revenue."""
    from app.database import SessionLocal
    from app.modules.notifications.scheduled_alerts import run_eod_recap
    db = SessionLocal()
    try:
        run_eod_recap(db)
    finally:
        db.close()


@celery_app.task(name="notifications.appointment_reminders")
def task_appointment_reminders():
    """Every 15 min: send reminder for sessions starting in ~1 hour."""
    from app.database import SessionLocal
    from app.modules.notifications.scheduled_alerts import run_appointment_reminders
    db = SessionLocal()
    try:
        run_appointment_reminders(db)
    finally:
        db.close()


# ── Booking notification tasks ──────────────────────────────────────

@celery_app.task(name="notifications.send_booking_confirmation", bind=True, max_retries=3)
def task_send_booking_confirmation(self, session_id: int):
    from app.database import SessionLocal
    from app.modules.notifications.services import send_booking_confirmation
    db = SessionLocal()
    try:
        send_booking_confirmation(db, session_id)
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()


@celery_app.task(name="notifications.send_booking_reminder", bind=True, max_retries=3)
def task_send_booking_reminder(self, session_id: int):
    from app.database import SessionLocal
    from app.modules.notifications.services import send_booking_reminder
    db = SessionLocal()
    try:
        send_booking_reminder(db, session_id)
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()


@celery_app.task(name="notifications.send_reminders_for_tomorrow")
def task_send_reminders_for_tomorrow():
    """Scheduled task: runs daily to send reminders for next-day appointments."""
    from datetime import date, timedelta, datetime
    from app.database import SessionLocal
    from app.modules.sessions.models import Session as BookingSession, SessionStatus

    db = SessionLocal()
    try:
        tomorrow = date.today() + timedelta(days=1)
        dt_start = datetime.combine(tomorrow, datetime.min.time())
        dt_end = datetime.combine(tomorrow, datetime.max.time())
        sessions = (
            db.query(BookingSession)
            .filter(
                BookingSession.starts_at >= dt_start,
                BookingSession.starts_at <= dt_end,
                BookingSession.status == SessionStatus.CONFIRMED,
            )
            .all()
        )
        for s in sessions:
            task_send_booking_reminder.delay(s.id)
    finally:
        db.close()


# Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    "send-daily-reminders": {
        "task": "notifications.send_reminders_for_tomorrow",
        "schedule": crontab(hour=20, minute=0),  # 8 PM UTC
    },
    "daily-morning-brief": {
        "task": "notifications.daily_morning_brief",
        "schedule": crontab(hour=8, minute=0),  # 8 AM UTC
    },
    "weekly-schedule": {
        "task": "notifications.weekly_schedule",
        "schedule": crontab(hour=19, minute=0, day_of_week=0),  # Sunday 7 PM UTC
    },
    "eod-recap": {
        "task": "notifications.eod_recap",
        "schedule": crontab(hour=21, minute=0),  # 9 PM UTC
    },
    "appointment-reminders": {
        "task": "notifications.appointment_reminders",
        "schedule": crontab(minute="*/15"),  # every 15 minutes
    },
}


def queue_booking_confirmation(session_id: int) -> None:
    """Helper to enqueue from synchronous code."""
    task_send_booking_confirmation.delay(session_id)
