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
    service = get_service_or_404(db, data.service_id, data.provider_id)
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

    # Queue async SMS/email notifications
    try:
        from app.modules.notifications.tasks import queue_booking_confirmation
        queue_booking_confirmation(session.id)
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
        provider_name=session.provider.name if session.provider else "",
        service_name=session.service.name if session.service else None,
        professional_name=session.professional.name if session.professional else None,
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
    # Re-fetch with joins after refresh clears the instance state
    return _session_to_lookup_response(
        db.query(SessionModel).options(*_session_joins()).filter(SessionModel.id == session_id).first()
    )
