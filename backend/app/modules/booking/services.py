import hashlib
import hmac
from typing import List
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException

from app.modules.booking.schemas import PublicBookingRequest, BookingConfirmation, BookingLookupResponse
from app.modules.sessions.services import create_session
from app.modules.sessions.schemas import SessionCreate
from app.modules.sessions.models import Session as SessionModel, SessionStatus
from app.modules.salons.services import get_provider_or_404
from app.modules.services.services import get_service_or_404
from app.modules.masters.services import get_professional_by_id
from app.config import settings


def _session_joins():
    """Return joinedload options lazily to avoid triggering mapper config at import time."""
    return [
        joinedload(SessionModel.provider),
        joinedload(SessionModel.service),
        joinedload(SessionModel.professional),
    ]


def _generate_confirmation_code(session_id: int) -> str:
    """Deterministic short confirmation code from session id."""
    token = hmac.new(
        settings.APP_SECRET_KEY.encode(),
        str(session_id).encode(),
        hashlib.sha256,
    ).hexdigest()[:8].upper()
    return token


def create_public_booking(db: Session, data: PublicBookingRequest) -> BookingConfirmation:
    # Validate references
    provider = get_provider_or_404(db, data.provider_id)
    service = get_service_or_404(db, data.service_id)
    professional = None
    if data.professional_id:
        professional = get_professional_by_id(db, data.professional_id)
        if not professional:
            raise HTTPException(status_code=404, detail="Professional not found")

    session = create_session(
        db,
        SessionCreate(
            provider_id=data.provider_id,
            professional_id=data.professional_id,
            service_id=data.service_id,
            client_name=data.client_name,
            client_phone=data.client_phone,
            client_email=data.client_email,
            client_notes=data.client_notes,
            starts_at=data.starts_at,
            duration_minutes=service.duration_minutes,
            price=service.price,
        ),
    )

    # Save an in-app notification for the professional synchronously
    try:
        from app.modules.notifications.models import Notification, NotificationType, NotificationStatus
        if session.professional_id:
            notif_body = (
                f"New booking: {session.client_name} on "
                f"{session.starts_at.strftime('%b %d at %I:%M %p')}"
            )
            db.add(Notification(
                session_id=session.id,
                notification_type=NotificationType.SMS_CONFIRMATION,
                recipient=session.client_phone,
                subject="New Booking",
                body=notif_body,
                status=NotificationStatus.PENDING,
            ))
            db.commit()
    except Exception:
        pass  # Non-critical

    # Queue async SMS/email notifications (non-blocking)
    try:
        from app.modules.notifications.tasks import queue_booking_confirmation
        from threading import Thread
        Thread(target=queue_booking_confirmation, args=(session.id,), daemon=True).start()
    except Exception:
        pass  # Non-critical

    # Send Telegram notification to the professional (non-blocking)
    try:
        from app.modules.masters.models import Professional
        if session.professional_id:
            prof = db.query(Professional).filter(Professional.id == session.professional_id).first()
            if prof and prof.user_id:
                _prof_user_id = prof.user_id
                _session_id = session.id
                _tg_text = (
                    f"📅 <b>New Booking</b>\n\n"
                    f"Client: {session.client_name}\n"
                    f"Phone: {session.client_phone}\n"
                    f"Date: {session.starts_at.strftime('%b %d, %Y at %I:%M %p')}\n"
                    f"Service: {service.name}"
                )
                if session.price:
                    _tg_text += f"\nPrice: ${session.price:.2f}"

                def _send_tg():
                    from app.database import SessionLocal
                    from app.modules.notifications.telegram import send_telegram
                    tg_db = SessionLocal()
                    try:
                        send_telegram(tg_db, _prof_user_id, _tg_text, _session_id)
                    finally:
                        tg_db.close()

                from threading import Thread as TgThread
                TgThread(target=_send_tg, daemon=True).start()
    except Exception:
        pass  # Non-critical

    confirmation_code = _generate_confirmation_code(session.id)

    return BookingConfirmation(
        session_id=session.id,
        client_name=session.client_name,
        client_phone=session.client_phone,
        provider_name=provider.name,
        service_name=service.name,
        professional_name=professional.name if professional else None,
        starts_at=session.starts_at,
        ends_at=session.ends_at,
        price=session.price,
        confirmation_code=confirmation_code,
    )


def _session_to_lookup_response(session: SessionModel) -> BookingLookupResponse:
    confirmation_code = _generate_confirmation_code(session.id)
    return BookingLookupResponse(
        session_id=session.id,
        client_name=session.client_name,
        client_phone=session.client_phone,
        provider_id=session.provider_id,
        provider_name=session.provider.name if session.provider else "",
        provider_address=session.provider.address if session.provider else None,
        provider_phone=session.provider.phone if session.provider else None,
        service_name=session.service.name if session.service else None,
        professional_id=session.professional_id,
        professional_name=session.professional.name if session.professional else None,
        professional_phone=session.professional.phone if session.professional else None,
        starts_at=session.starts_at,
        ends_at=session.ends_at,
        price=session.price,
        status=session.status.value,
        cancellation_reason=session.cancellation_reason,
        confirmation_code=confirmation_code,
        created_at=session.created_at,
    )


def lookup_bookings_by_phone(db: Session, phone: str) -> List[BookingLookupResponse]:
    """Look up all bookings for a phone number."""
    sessions = (
        db.query(SessionModel)
        .options(*_session_joins())
        .filter(SessionModel.client_phone == phone.strip())
        .order_by(SessionModel.starts_at.desc())
        .limit(20)
        .all()
    )
    return [_session_to_lookup_response(s) for s in sessions]


def cancel_booking(db: Session, session_id: int, confirmation_code: str, phone: str, reason: str | None) -> BookingLookupResponse:
    """Cancel a booking after verifying confirmation code + phone."""
    session = (
        db.query(SessionModel)
        .options(*_session_joins())
        .filter(SessionModel.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check both credentials together to avoid leaking which one failed
    expected_code = _generate_confirmation_code(session.id)
    if session.client_phone.strip() != phone.strip() or confirmation_code.upper() != expected_code:
        raise HTTPException(status_code=403, detail="Invalid phone or confirmation code")

    if session.status in (SessionStatus.CANCELLED, SessionStatus.COMPLETED, SessionStatus.NO_SHOW):
        raise HTTPException(status_code=409, detail=f"Booking cannot be cancelled (status: {session.status.value})")

    session.status = SessionStatus.CANCELLED
    session.cancellation_reason = reason
    db.commit()
    db.refresh(session)

    # Send cancellation notifications
    try:
        from app.modules.notifications.models import Notification, NotificationType, NotificationStatus
        from app.modules.masters.models import Professional

        provider_name = session.provider.name if session.provider else "the salon"
        date_str = session.starts_at.strftime("%b %d at %I:%M %p")
        client_name = session.client_name
        reason_str = f" Reason: {reason}" if reason else ""

        notifs = [
            Notification(
                session_id=session.id,
                notification_type=NotificationType.SMS_CONFIRMATION,
                recipient=session.client_phone,
                subject="Booking Cancelled",
                body=f"Your appointment on {date_str} at {provider_name} has been cancelled.{reason_str}",
                status=NotificationStatus.SENT,
            ),
        ]

        if session.professional_id:
            pro = db.query(Professional).filter(Professional.id == session.professional_id).first()
            notifs.append(Notification(
                session_id=session.id,
                notification_type=NotificationType.SMS_CONFIRMATION,
                recipient=pro.phone if pro and pro.phone else "app",
                subject="Booking Cancelled",
                body=f"Booking cancelled: {client_name} on {date_str}.{reason_str}",
                status=NotificationStatus.SENT,
            ))

        if session.provider_id:
            notifs.append(Notification(
                session_id=session.id,
                notification_type=NotificationType.SMS_CONFIRMATION,
                recipient="app",
                subject="Booking Cancelled",
                body=f"Booking cancelled at {provider_name}: {client_name} · {date_str}.{reason_str}",
                status=NotificationStatus.SENT,
            ))

        for n in notifs:
            db.add(n)
        db.commit()
    except Exception:
        pass  # Non-critical

    # Re-fetch with joins after refresh clears the instance state
    return _session_to_lookup_response(
        db.query(SessionModel).options(*_session_joins()).filter(SessionModel.id == session_id).first()
    )
