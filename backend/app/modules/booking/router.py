from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.booking.schemas import PublicBookingRequest, BookingConfirmation
from app.modules.booking.services import create_public_booking

router = APIRouter()


@router.post("/", response_model=BookingConfirmation, status_code=201)
def book_appointment(data: PublicBookingRequest, db: Session = Depends(get_db)):
    """
    Public endpoint — no authentication required.
    Clients book appointments using this endpoint.
    """
    return create_public_booking(db, data)
