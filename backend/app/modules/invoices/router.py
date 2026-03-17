from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_owner, get_current_user
from app.modules.invoices.models import Invoice, EarningsSplit
from app.modules.invoices.schemas import (
    InvoiceCreate, InvoiceResponse, InvoiceStatusUpdate,
    EarningsSplitCreate, EarningsSplitResponse,
)
from app.modules.sessions.models import Session as SessionModel, SessionStatus
from app.modules.salons.services import assert_owner_of_provider
from app.modules.masters.services import get_professional_by_user_id
from app.modules.users.models import User

router = APIRouter()


def _get_split_percentage(db: Session, provider_id: int, professional_id: int) -> float:
    """Get the most recent earnings split for a professional-provider pair, default 70%."""
    split = (
        db.query(EarningsSplit)
        .filter(
            EarningsSplit.provider_id == provider_id,
            EarningsSplit.professional_id == professional_id,
        )
        .order_by(EarningsSplit.effective_from.desc())
        .first()
    )
    return split.professional_percentage if split else 70.0


# ---------- Earnings Splits ----------

@router.get("/splits/provider/{provider_id}", response_model=List[EarningsSplitResponse])
def list_splits(
    provider_id: int,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_provider(db, current_user, provider_id)
    return db.query(EarningsSplit).filter(EarningsSplit.provider_id == provider_id).all()


@router.post("/splits/provider/{provider_id}", response_model=EarningsSplitResponse, status_code=201)
def create_split(
    provider_id: int,
    data: EarningsSplitCreate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_provider(db, current_user, provider_id)
    split = EarningsSplit(provider_id=provider_id, **data.model_dump())
    db.add(split)
    db.commit()
    db.refresh(split)
    return split


# ---------- Invoices ----------

@router.get("/provider/{provider_id}", response_model=List[InvoiceResponse])
def list_provider_invoices(
    provider_id: int,
    professional_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_provider(db, current_user, provider_id)
    q = db.query(Invoice).filter(Invoice.provider_id == provider_id)
    if professional_id:
        q = q.filter(Invoice.professional_id == professional_id)
    return q.order_by(Invoice.period_start.desc()).all()


@router.get("/me", response_model=List[InvoiceResponse])
def list_my_invoices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Professional can view their own invoices."""
    professional = get_professional_by_user_id(db, current_user.id)
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    return db.query(Invoice).filter(Invoice.professional_id == professional.id).order_by(Invoice.period_start.desc()).all()


@router.post("/provider/{provider_id}/generate", response_model=InvoiceResponse, status_code=201)
def generate_invoice(
    provider_id: int,
    data: InvoiceCreate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    """Generate a monthly invoice for a professional in a provider based on completed sessions."""
    assert_owner_of_provider(db, current_user, provider_id)

    # Check no duplicate
    existing = db.query(Invoice).filter(
        Invoice.provider_id == provider_id,
        Invoice.professional_id == data.professional_id,
        Invoice.period_start == data.period_start,
        Invoice.period_end == data.period_end,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Invoice already exists for this period")

    # Query completed sessions
    from datetime import datetime
    sessions = db.query(SessionModel).filter(
        SessionModel.provider_id == provider_id,
        SessionModel.professional_id == data.professional_id,
        SessionModel.status == SessionStatus.COMPLETED,
        SessionModel.starts_at >= datetime.combine(data.period_start, datetime.min.time()),
        SessionModel.starts_at <= datetime.combine(data.period_end, datetime.max.time()),
    ).all()

    total_revenue = sum(s.price or 0 for s in sessions)
    professional_pct = _get_split_percentage(db, provider_id, data.professional_id)
    professional_earnings = total_revenue * professional_pct / 100
    provider_earnings = total_revenue - professional_earnings

    invoice = Invoice(
        provider_id=provider_id,
        professional_id=data.professional_id,
        period_start=data.period_start,
        period_end=data.period_end,
        total_sessions=len(sessions),
        total_revenue=total_revenue,
        professional_earnings=professional_earnings,
        provider_earnings=provider_earnings,
        professional_percentage=professional_pct,
        notes=data.notes,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


# ── Backward-compat aliases using /salon/ prefix ─────────────────────────────

@router.get("/salon/{provider_id}", response_model=List[InvoiceResponse])
def list_salon_invoices(
    provider_id: int,
    master_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_provider(db, current_user, provider_id)
    q = db.query(Invoice).filter(Invoice.provider_id == provider_id)
    if master_id:
        q = q.filter(Invoice.professional_id == master_id)
    return q.order_by(Invoice.period_start.desc()).all()


@router.post("/salon/{provider_id}/generate", response_model=InvoiceResponse, status_code=201)
def generate_invoice_compat(
    provider_id: int,
    data: InvoiceCreate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    return generate_invoice(provider_id, data, current_user, db)


@router.get("/splits/salon/{provider_id}", response_model=List[EarningsSplitResponse])
def list_splits_compat(
    provider_id: int,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_provider(db, current_user, provider_id)
    return db.query(EarningsSplit).filter(EarningsSplit.provider_id == provider_id).all()


@router.post("/splits/salon/{provider_id}", response_model=EarningsSplitResponse, status_code=201)
def create_split_compat(
    provider_id: int,
    data: EarningsSplitCreate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_provider(db, current_user, provider_id)
    split = EarningsSplit(provider_id=provider_id, **data.model_dump())
    db.add(split)
    db.commit()
    db.refresh(split)
    return split


@router.patch("/{invoice_id}/status", response_model=InvoiceResponse)
def update_invoice_status(
    invoice_id: int,
    data: InvoiceStatusUpdate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    assert_owner_of_provider(db, current_user, invoice.provider_id)
    invoice.status = data.status
    db.commit()
    db.refresh(invoice)
    return invoice
