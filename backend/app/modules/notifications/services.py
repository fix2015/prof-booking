from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.config import settings
from app.modules.notifications.models import Notification, NotificationType, NotificationStatus


def _send_sms(to: str, body: str) -> bool:
    """Send SMS via Twilio."""
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        return False
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            to=to,
            from_=settings.TWILIO_FROM_NUMBER,
            body=body,
        )
        return True
    except Exception:
        return False


def _send_email(to: str, subject: str, body: str) -> bool:
    """Send email via SMTP."""
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        return False
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
        msg["To"] = to
        msg.attach(MIMEText(body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.sendmail(settings.EMAIL_FROM, to, msg.as_string())
        return True
    except Exception:
        return False


def send_booking_confirmation(db: Session, session_id: int) -> None:
    from app.modules.sessions.models import Session as BookingSession
    session = db.query(BookingSession).filter(BookingSession.id == session_id).first()
    if not session:
        return

    # SMS confirmation
    sms_body = (
        f"Your appointment has been confirmed!\n"
        f"Date: {session.starts_at.strftime('%b %d, %Y at %I:%M %p')}\n"
        f"Ref: #{session.id}"
    )
    sms_ok = _send_sms(session.client_phone, sms_body)
    _save_notification(
        db,
        session_id=session_id,
        ntype=NotificationType.SMS_CONFIRMATION,
        recipient=session.client_phone,
        body=sms_body,
        success=sms_ok,
    )

    # Email confirmation
    if session.client_email:
        html_body = f"""
        <h2>Booking Confirmed!</h2>
        <p>Hi {session.client_name},</p>
        <p>Your appointment is confirmed for <strong>{session.starts_at.strftime('%B %d, %Y at %I:%M %p')}</strong>.</p>
        <p>Booking reference: <strong>#{session.id}</strong></p>
        <p>Thank you for choosing us!</p>
        """
        email_ok = _send_email(session.client_email, "Booking Confirmation", html_body)
        _save_notification(
            db,
            session_id=session_id,
            ntype=NotificationType.EMAIL_CONFIRMATION,
            recipient=session.client_email,
            subject="Booking Confirmation",
            body=html_body,
            success=email_ok,
        )


def send_booking_reminder(db: Session, session_id: int) -> None:
    from app.modules.sessions.models import Session as BookingSession
    session = db.query(BookingSession).filter(BookingSession.id == session_id).first()
    if not session:
        return

    sms_body = (
        f"Reminder: You have an appointment tomorrow at "
        f"{session.starts_at.strftime('%I:%M %p')}. Ref: #{session.id}"
    )
    sms_ok = _send_sms(session.client_phone, sms_body)
    _save_notification(
        db,
        session_id=session_id,
        ntype=NotificationType.SMS_REMINDER,
        recipient=session.client_phone,
        body=sms_body,
        success=sms_ok,
    )


def _save_notification(
    db: Session,
    session_id: int,
    ntype: NotificationType,
    recipient: str,
    body: str,
    success: bool,
    subject: Optional[str] = None,
    error: Optional[str] = None,
) -> Notification:
    n = Notification(
        session_id=session_id,
        notification_type=ntype,
        recipient=recipient,
        subject=subject,
        body=body,
        status=NotificationStatus.SENT if success else NotificationStatus.FAILED,
        sent_at=datetime.utcnow() if success else None,
        error_message=error,
    )
    db.add(n)
    db.commit()
    return n
