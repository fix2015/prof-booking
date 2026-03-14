from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.modules.payments.schemas import CreatePaymentIntent, PaymentResponse, CheckoutSessionResponse
from app.modules.payments.services import (
    create_checkout_session, handle_stripe_webhook, get_payment_by_session,
)
from app.modules.users.models import User

router = APIRouter()


@router.post("/checkout", response_model=CheckoutSessionResponse)
def create_checkout(
    data: CreatePaymentIntent,
    db: Session = Depends(get_db),
):
    """Create a Stripe checkout session. No auth required (public booking flow)."""
    checkout_url, payment = create_checkout_session(db, data)
    return CheckoutSessionResponse(checkout_url=checkout_url, payment_id=payment.id)


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    handle_stripe_webhook(db, payload, sig_header)
    return {"received": True}


@router.get("/session/{session_id}", response_model=PaymentResponse)
def get_session_payment(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = get_payment_by_session(db, session_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment
