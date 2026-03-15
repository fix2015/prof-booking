import stripe
from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional

from app.config import settings
from app.modules.payments.models import Payment, PaymentStatus, PaymentType
from app.modules.payments.schemas import CreatePaymentIntent
from app.modules.sessions.services import get_session_or_404
from app.modules.sessions.models import SessionStatus

stripe.api_key = settings.STRIPE_SECRET_KEY


def create_checkout_session(db: Session, data: CreatePaymentIntent) -> tuple[str, Payment]:
    session = get_session_or_404(db, data.session_id)
    if not session.price:
        raise HTTPException(status_code=400, detail="Session has no price set")

    amount = session.price
    if data.payment_type == PaymentType.DEPOSIT:
        amount = round(amount * 0.3, 2)  # 30% deposit

    # Create Stripe checkout
    try:
        checkout = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {"name": f"Booking #{session.id}"},
                        "unit_amount": int(amount * 100),
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=data.success_url + f"?session_id={session.id}",
            cancel_url=data.cancel_url,
            metadata={"nail_session_id": str(session.id), "payment_type": data.payment_type.value},
        )
    except stripe.StripeError as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {str(e)}")

    payment = Payment(
        session_id=session.id,
        stripe_checkout_session_id=checkout.id,
        amount=amount,
        currency="usd",
        payment_type=data.payment_type,
        status=PaymentStatus.PENDING,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return checkout.url, payment


def handle_stripe_webhook(db: Session, payload: bytes, sig_header: str) -> None:
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.SignatureVerificationError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "checkout.session.completed":
        stripe_session = event["data"]["object"]
        checkout_id = stripe_session["id"]
        payment = db.query(Payment).filter(
            Payment.stripe_checkout_session_id == checkout_id
        ).first()
        if payment:
            payment.status = PaymentStatus.SUCCEEDED
            payment.stripe_payment_intent_id = stripe_session.get("payment_intent")
            # Update booking session
            booking_session = payment.session
            if payment.payment_type == PaymentType.DEPOSIT:
                booking_session.deposit_paid = payment.amount
            else:
                booking_session.total_paid = payment.amount
            booking_session.status = SessionStatus.CONFIRMED
            db.commit()

    elif event["type"] == "payment_intent.payment_failed":
        pi = event["data"]["object"]
        payment = db.query(Payment).filter(
            Payment.stripe_payment_intent_id == pi["id"]
        ).first()
        if payment:
            payment.status = PaymentStatus.FAILED
            payment.failure_message = pi.get("last_payment_error", {}).get("message", "")
            db.commit()


def get_payment_by_session(db: Session, session_id: int) -> Optional[Payment]:
    return db.query(Payment).filter(Payment.session_id == session_id).first()
