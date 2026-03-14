from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.modules.payments.models import PaymentStatus, PaymentType


class CreatePaymentIntent(BaseModel):
    session_id: int
    payment_type: PaymentType = PaymentType.FULL
    success_url: str
    cancel_url: str


class PaymentResponse(BaseModel):
    id: int
    session_id: int
    amount: float
    currency: str
    payment_type: PaymentType
    status: PaymentStatus
    stripe_receipt_url: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    payment_id: int
