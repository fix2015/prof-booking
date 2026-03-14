import hashlib
import hmac
import secrets
from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import timedelta

from app.modules.booking.schemas import PublicBookingRequest, BookingConfirmation
from app.modules.sessions.models import Session as BookingSession, SessionStatus
from app.modules.sessions.services import create_session
from app.modules.sessions.schemas import SessionCreate
from app.modules.salons.services import get_salon_or_404
from app.modules.services.services import get_service_or_404
from app.modules.masters.services import get_master_by_id
from app.config import settings


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
    salon = get_salon_or_404(db, data.salon_id)
    service = get_service_or_404(db, data.service_id, data.salon_id)
    master = None
    if data.master_id:
        master = get_master_by_id(db, data.master_id)
        if not master:
            raise HTTPException(status_code=404, detail="Master not found")

    session = create_session(
        db,
        SessionCreate(
            salon_id=data.salon_id,
            master_id=data.master_id,
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

    # Queue notifications asynchronously
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
        salon_name=salon.name,
        service_name=service.name,
        master_name=master.name if master else None,
        starts_at=session.starts_at,
        ends_at=session.ends_at,
        price=session.price,
        confirmation_code=confirmation_code,
    )
