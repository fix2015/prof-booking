"""
Background task queue using Redis + Celery.
These tasks handle async notifications and reminders.
"""
from celery import Celery
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
        "schedule": 86400.0,  # every 24 hours
    }
}


def queue_booking_confirmation(session_id: int) -> None:
    """Helper to enqueue from synchronous code."""
    task_send_booking_confirmation.delay(session_id)
