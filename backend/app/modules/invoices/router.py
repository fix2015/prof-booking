from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.dependencies import get_current_owner, get_current_user
from app.modules.invoices.models import Invoice, EarningsSplit, InvoiceStatus
from app.modules.invoices.schemas import (
    InvoiceCreate, InvoiceResponse, InvoiceStatusUpdate,
    EarningsSplitCreate, EarningsSplitResponse,
)
from app.modules.sessions.models import Session as SessionModel, SessionStatus
from app.modules.salons.services import assert_owner_of_salon
from app.modules.masters.services import get_master_by_user_id
from app.modules.users.models import User, UserRole

router = APIRouter()


def _get_split_percentage(db: Session, salon_id: int, master_id: int) -> float:
    """Get the most recent earnings split for a master-salon pair, default 70%."""
    split = (
        db.query(EarningsSplit)
        .filter(
            EarningsSplit.salon_id == salon_id,
            EarningsSplit.master_id == master_id,
        )
        .order_by(EarningsSplit.effective_from.desc())
        .first()
    )
    return split.master_percentage if split else 70.0


# ---------- Earnings Splits ----------

@router.get("/splits/salon/{salon_id}", response_model=List[EarningsSplitResponse])
def list_splits(
    salon_id: int,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_salon(db, current_user, salon_id)
    return db.query(EarningsSplit).filter(EarningsSplit.salon_id == salon_id).all()


@router.post("/splits/salon/{salon_id}", response_model=EarningsSplitResponse, status_code=201)
def create_split(
    salon_id: int,
    data: EarningsSplitCreate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_salon(db, current_user, salon_id)
    split = EarningsSplit(salon_id=salon_id, **data.model_dump())
    db.add(split)
    db.commit()
    db.refresh(split)
    return split


# ---------- Invoices ----------

@router.get("/salon/{salon_id}", response_model=List[InvoiceResponse])
def list_salon_invoices(
    salon_id: int,
    master_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_salon(db, current_user, salon_id)
    q = db.query(Invoice).filter(Invoice.salon_id == salon_id)
    if master_id:
        q = q.filter(Invoice.master_id == master_id)
    return q.order_by(Invoice.period_start.desc()).all()


@router.get("/me", response_model=List[InvoiceResponse])
def list_my_invoices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Master can view their own invoices."""
    master = get_master_by_user_id(db, current_user.id)
    if not master:
        raise HTTPException(status_code=404, detail="Master profile not found")
    return db.query(Invoice).filter(Invoice.master_id == master.id).order_by(Invoice.period_start.desc()).all()


@router.post("/salon/{salon_id}/generate", response_model=InvoiceResponse, status_code=201)
def generate_invoice(
    salon_id: int,
    data: InvoiceCreate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    """Generate a monthly invoice for a master in a salon based on completed sessions."""
    assert_owner_of_salon(db, current_user, salon_id)

    # Check no duplicate
    existing = db.query(Invoice).filter(
        Invoice.salon_id == salon_id,
        Invoice.master_id == data.master_id,
        Invoice.period_start == data.period_start,
        Invoice.period_end == data.period_end,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Invoice already exists for this period")

    # Query completed sessions
    from datetime import datetime
    sessions = db.query(SessionModel).filter(
        SessionModel.salon_id == salon_id,
        SessionModel.master_id == data.master_id,
        SessionModel.status == SessionStatus.COMPLETED,
        SessionModel.starts_at >= datetime.combine(data.period_start, datetime.min.time()),
        SessionModel.starts_at <= datetime.combine(data.period_end, datetime.max.time()),
    ).all()

    total_revenue = sum(s.price or 0 for s in sessions)
    master_pct = _get_split_percentage(db, salon_id, data.master_id)
    master_earnings = total_revenue * master_pct / 100
    salon_earnings = total_revenue - master_earnings

    invoice = Invoice(
        salon_id=salon_id,
        master_id=data.master_id,
        period_start=data.period_start,
        period_end=data.period_end,
        total_sessions=len(sessions),
        total_revenue=total_revenue,
        master_earnings=master_earnings,
        salon_earnings=salon_earnings,
        master_percentage=master_pct,
        notes=data.notes,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


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
    assert_owner_of_salon(db, current_user, invoice.salon_id)
    invoice.status = data.status
    db.commit()
    db.refresh(invoice)
    return invoice
