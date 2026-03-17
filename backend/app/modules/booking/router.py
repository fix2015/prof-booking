from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.modules.booking.schemas import PublicBookingRequest, BookingConfirmation, BookingLookupResponse, BookingCancelRequest
from app.modules.booking.services import create_public_booking, lookup_bookings_by_phone, cancel_booking

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
