"""
Telegram bot command handlers.

Commands:
  /me       — Show user profile info
  /today    — Today's bookings
  /tomorrow — Tomorrow's bookings
  /week     — This week's bookings
  /revenue  — Earnings summary (today / this week / this month)
  /reviews  — Recent reviews
  /next     — Next upcoming appointment
  /settings — Current notification preferences
  /help     — List all commands
"""

import logging
from datetime import date, datetime, timedelta, time
from sqlalchemy.orm import Session

from app.modules.notifications.models import TelegramLink, NotificationPreference
from app.modules.users.models import User
from app.modules.masters.models import Professional
from app.modules.sessions.models import Session as BookingSession, SessionStatus
from sqlalchemy.orm import joinedload

logger = logging.getLogger(__name__)


def _get_user_by_chat(db: Session, chat_id: str) -> tuple[User | None, Professional | None]:
    """Resolve app user + professional from Telegram chat_id."""
    link = db.query(TelegramLink).filter(TelegramLink.chat_id == chat_id).first()
    if not link:
        return None, None
    user = db.query(User).filter(User.id == link.user_id).first()
    prof = db.query(Professional).filter(Professional.user_id == link.user_id).first() if user else None
    return user, prof


def _format_session_line(s: BookingSession) -> str:
    t = s.starts_at.strftime("%I:%M %p")
    svc = s.service.name if s.service else "Service"
    price = f" · ${s.price:.0f}" if s.price else ""
    return f"  {t} — {s.client_name} ({svc}{price})"


def _sessions_in_range(db: Session, prof_id: int, dt_start: datetime, dt_end: datetime) -> list[BookingSession]:
    return (
        db.query(BookingSession)
        .options(joinedload(BookingSession.service))
        .filter(
            BookingSession.professional_id == prof_id,
            BookingSession.starts_at >= dt_start,
            BookingSession.starts_at <= dt_end,
            BookingSession.status.in_([SessionStatus.PENDING, SessionStatus.CONFIRMED]),
        )
        .order_by(BookingSession.starts_at)
        .all()
    )


def handle_command(db: Session, chat_id: str, command: str) -> str:
    """Route a /command to the right handler. Returns HTML reply text."""
    cmd = command.split()[0].lower().replace("@", "").strip("/")

    if cmd == "help":
        return cmd_help()

    user, prof = _get_user_by_chat(db, chat_id)
    if not user:
        return "Your account is not linked. Use the <b>Authorize Telegram</b> button in ProBook."

    if cmd == "me":
        return cmd_me(user, prof)
    elif cmd == "today":
        return cmd_today(db, prof)
    elif cmd == "tomorrow":
        return cmd_tomorrow(db, prof)
    elif cmd == "week":
        return cmd_week(db, prof)
    elif cmd == "revenue":
        return cmd_revenue(db, prof)
    elif cmd == "reviews":
        return cmd_reviews(db, prof)
    elif cmd == "next":
        return cmd_next(db, prof)
    elif cmd == "settings":
        return cmd_settings(db, user)
    else:
        return f"Unknown command: /{cmd}\n\nType /help to see available commands."


def cmd_help() -> str:
    return (
        "<b>ProBook Bot Commands</b>\n\n"
        "/me — Your profile info\n"
        "/today — Today's bookings\n"
        "/tomorrow — Tomorrow's bookings\n"
        "/week — This week's schedule\n"
        "/next — Next upcoming appointment\n"
        "/revenue — Earnings summary\n"
        "/reviews — Recent reviews\n"
        "/settings — Notification preferences\n"
        "/help — This message"
    )


def cmd_me(user: User, prof: Professional | None) -> str:
    lines = ["<b>👤 Profile</b>\n"]
    if user.name:
        lines.append(f"Name: {user.name}")
    lines.append(f"Email: {user.email}")
    if user.phone:
        lines.append(f"Phone: {user.phone}")
    lines.append(f"Role: {user.role.value}")
    if prof:
        lines.append(f"Professional ID: #{prof.id}")
        if prof.bio:
            lines.append(f"Bio: {prof.bio[:100]}")
        if prof.experience_years:
            lines.append(f"Experience: {prof.experience_years} years")
    return "\n".join(lines)


def cmd_today(db: Session, prof: Professional | None) -> str:
    if not prof:
        return "You don't have a professional profile."
    today = date.today()
    sessions = _sessions_in_range(
        db, prof.id,
        datetime.combine(today, time.min),
        datetime.combine(today, time.max),
    )
    if not sessions:
        return f"<b>📅 Today ({today.strftime('%b %d')})</b>\n\nNo bookings today."
    lines = [f"<b>📅 Today ({today.strftime('%b %d')})</b>\n\n{len(sessions)} booking{'s' if len(sessions) > 1 else ''}:"]
    for s in sessions:
        lines.append(_format_session_line(s))
    return "\n".join(lines)


def cmd_tomorrow(db: Session, prof: Professional | None) -> str:
    if not prof:
        return "You don't have a professional profile."
    tomorrow = date.today() + timedelta(days=1)
    sessions = _sessions_in_range(
        db, prof.id,
        datetime.combine(tomorrow, time.min),
        datetime.combine(tomorrow, time.max),
    )
    if not sessions:
        return f"<b>📅 Tomorrow ({tomorrow.strftime('%b %d')})</b>\n\nNo bookings tomorrow."
    lines = [f"<b>📅 Tomorrow ({tomorrow.strftime('%b %d')})</b>\n\n{len(sessions)} booking{'s' if len(sessions) > 1 else ''}:"]
    for s in sessions:
        lines.append(_format_session_line(s))
    return "\n".join(lines)


def cmd_week(db: Session, prof: Professional | None) -> str:
    if not prof:
        return "You don't have a professional profile."
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)
    sessions = _sessions_in_range(
        db, prof.id,
        datetime.combine(monday, time.min),
        datetime.combine(sunday, time.max),
    )
    if not sessions:
        return f"<b>📋 This Week ({monday.strftime('%b %d')}–{sunday.strftime('%b %d')})</b>\n\nNo bookings this week."

    by_day: dict[str, list[str]] = {}
    for s in sessions:
        day_key = s.starts_at.strftime("%a %b %d")
        by_day.setdefault(day_key, []).append(_format_session_line(s))

    lines = [f"<b>📋 This Week</b>\n\n{len(sessions)} booking{'s' if len(sessions) > 1 else ''}:"]
    for day, entries in by_day.items():
        lines.append(f"\n<b>{day}</b>")
        lines.extend(entries)
    return "\n".join(lines)


def cmd_revenue(db: Session, prof: Professional | None) -> str:
    if not prof:
        return "You don't have a professional profile."
    today = date.today()
    now_start = datetime.combine(today, time.min)
    now_end = datetime.combine(today, time.max)

    # Today
    today_sessions = (
        db.query(BookingSession)
        .filter(
            BookingSession.professional_id == prof.id,
            BookingSession.starts_at >= now_start,
            BookingSession.starts_at <= now_end,
            BookingSession.status == SessionStatus.COMPLETED,
        )
        .all()
    )
    today_rev = sum(s.price or 0 for s in today_sessions)
    today_count = len(today_sessions)

    # This week
    monday = today - timedelta(days=today.weekday())
    week_sessions = (
        db.query(BookingSession)
        .filter(
            BookingSession.professional_id == prof.id,
            BookingSession.starts_at >= datetime.combine(monday, time.min),
            BookingSession.starts_at <= now_end,
            BookingSession.status == SessionStatus.COMPLETED,
        )
        .all()
    )
    week_rev = sum(s.price or 0 for s in week_sessions)
    week_count = len(week_sessions)

    # This month
    month_start = today.replace(day=1)
    month_sessions = (
        db.query(BookingSession)
        .filter(
            BookingSession.professional_id == prof.id,
            BookingSession.starts_at >= datetime.combine(month_start, time.min),
            BookingSession.starts_at <= now_end,
            BookingSession.status == SessionStatus.COMPLETED,
        )
        .all()
    )
    month_rev = sum(s.price or 0 for s in month_sessions)
    month_count = len(month_sessions)

    return (
        f"<b>💰 Revenue</b>\n\n"
        f"Today: ${today_rev:.2f} ({today_count} sessions)\n"
        f"This week: ${week_rev:.2f} ({week_count} sessions)\n"
        f"This month: ${month_rev:.2f} ({month_count} sessions)"
    )


def cmd_reviews(db: Session, prof: Professional | None) -> str:
    if not prof:
        return "You don't have a professional profile."
    from app.modules.reviews.models import Review
    reviews = (
        db.query(Review)
        .filter(Review.professional_id == prof.id, Review.is_published == True)  # noqa: E712
        .order_by(Review.created_at.desc())
        .limit(5)
        .all()
    )
    if not reviews:
        return "<b>⭐ Reviews</b>\n\nNo reviews yet."

    # Compute average
    all_reviews = (
        db.query(Review)
        .filter(Review.professional_id == prof.id, Review.is_published == True)  # noqa: E712
        .all()
    )
    avg = sum(r.rating for r in all_reviews) / len(all_reviews) if all_reviews else 0

    lines = [f"<b>⭐ Reviews</b> — {avg:.1f}/5 ({len(all_reviews)} total)\n"]
    for r in reviews:
        stars = "★" * r.rating + "☆" * (5 - r.rating)
        line = f"{stars} — {r.client_name}"
        if r.comment:
            line += f'\n  "{r.comment[:80]}"'
        lines.append(line)
    return "\n".join(lines)


def cmd_next(db: Session, prof: Professional | None) -> str:
    if not prof:
        return "You don't have a professional profile."
    now = datetime.utcnow()
    session = (
        db.query(BookingSession)
        .options(joinedload(BookingSession.service))
        .filter(
            BookingSession.professional_id == prof.id,
            BookingSession.starts_at >= now,
            BookingSession.status.in_([SessionStatus.PENDING, SessionStatus.CONFIRMED]),
        )
        .order_by(BookingSession.starts_at)
        .first()
    )
    if not session:
        return "<b>⏭ Next Appointment</b>\n\nNo upcoming appointments."

    delta = session.starts_at - now
    if delta.days > 0:
        time_str = f"in {delta.days} day{'s' if delta.days > 1 else ''}"
    elif delta.seconds >= 3600:
        hours = delta.seconds // 3600
        time_str = f"in {hours} hour{'s' if hours > 1 else ''}"
    else:
        mins = delta.seconds // 60
        time_str = f"in {mins} min"

    svc = session.service.name if session.service else "N/A"
    price = f"${session.price:.2f}" if session.price else "N/A"

    return (
        f"<b>⏭ Next Appointment</b> ({time_str})\n\n"
        f"Client: {session.client_name}\n"
        f"Phone: {session.client_phone}\n"
        f"Date: {session.starts_at.strftime('%b %d, %Y at %I:%M %p')}\n"
        f"Service: {svc}\n"
        f"Price: {price}"
    )


def cmd_settings(db: Session, user: User) -> str:
    pref = db.query(NotificationPreference).filter(NotificationPreference.user_id == user.id).first()
    if not pref:
        pref = NotificationPreference(user_id=user.id)

    def icon(on: int) -> str:
        return "✅" if on else "❌"

    return (
        f"<b>⚙ Notification Settings</b>\n\n"
        f"{icon(pref.daily_morning)} Daily Morning Brief\n"
        f"{icon(pref.weekly_schedule)} Weekly Schedule\n"
        f"{icon(pref.eod_recap)} End-of-Day Recap\n"
        f"{icon(pref.cancellation)} Cancellation Alerts\n"
        f"{icon(pref.new_review)} New Review Alert\n"
        f"{icon(pref.appointment_reminder)} Appointment Reminder\n\n"
        f"Manage in the ProBook app → Notifications"
    )
