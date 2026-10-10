from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.modules.booking.schemas import PublicBookingRequest, BookingConfirmation, BookingLookupResponse, BookingCancelRequest
from app.modules.booking.services import (
    create_public_booking, lookup_bookings_by_phone, cancel_booking, _generate_confirmation_code, _session_joins,
)
from app.modules.booking.ics import build_booking_ics

router = APIRouter()


@router.post("/", response_model=BookingConfirmation, status_code=201)
def book_appointment(data: PublicBookingRequest, db: Session = Depends(get_db)):
    """
    Public endpoint — no authentication required.
    Clients book appointments using this endpoint.
    """
    return create_public_booking(db, data)


@router.get("/lookup", response_model=List[BookingLookupResponse])
def lookup_my_bookings(
    phone: str = Query(..., description="Client phone number used when booking"),
    db: Session = Depends(get_db),
):
    """
    Public endpoint — look up all bookings for a phone number.
    Clients use this to manage their appointments.
    """
    return lookup_bookings_by_phone(db, phone)


@router.post("/{session_id}/cancel", response_model=BookingLookupResponse)
def cancel_my_booking(
    session_id: int,
    data: BookingCancelRequest,
    db: Session = Depends(get_db),
):
    """
    Public endpoint — cancel a booking.
    Requires the confirmation code and phone to verify ownership.
    """
    return cancel_booking(db, session_id, data.confirmation_code, data.phone, data.reason)


@router.get("/{session_id}/calendar.ics")
def booking_calendar_file(
    session_id: int,
    code: str = Query(..., description="Booking confirmation code"),
    db: Session = Depends(get_db),
):
    """Public: the booking as an .ics file (Add to Calendar), authorised by its confirmation code.
    Contains no client personal data."""
    from app.modules.sessions.models import Session as SessionModel

    booking = db.query(SessionModel).options(*_session_joins()).filter(SessionModel.id == session_id).first()
    if not booking or code.strip().upper() != _generate_confirmation_code(session_id):
        raise HTTPException(status_code=404, detail="Booking not found")
    provider = booking.provider
    service_name = booking.service.name if booking.service else "Appointment"
    title = f"{service_name} at {provider.name}" if provider else service_name
    details = [f"Confirmation code: {_generate_confirmation_code(session_id)}"]
    if booking.professional:
        details.insert(0, f"With {booking.professional.name}")
    if provider and provider.phone:
        details.append(f"Salon phone: {provider.phone}")
    ics = build_booking_ics(
        uid=f"booking-{session_id}@probooking.app",
        title=title,
        starts_at=booking.starts_at,
        ends_at=booking.ends_at,
        location=(provider.address if provider else None),
        description="\n".join(details),
    )
    return Response(
        content=ics,
        media_type="text/calendar; charset=utf-8",
        headers={"Content-Disposition": f'inline; filename="probook-booking-{session_id}.ics"'},
    )
