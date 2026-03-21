from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import io

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


@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download an invoice as a PDF."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.units import cm

    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Allow owner of the provider or the professional themselves
    if current_user.role in ("provider_owner", "platform_admin"):
        assert_owner_of_provider(db, current_user, invoice.provider_id)
    else:
        professional = get_professional_by_user_id(db, current_user.id)
        if not professional or professional.id != invoice.professional_id:
            raise HTTPException(status_code=403, detail="Access denied")

    # Load related names
    provider_name = invoice.provider.name if invoice.provider else f"Provider #{invoice.provider_id}"
    professional_name = invoice.professional.name if invoice.professional else f"Professional #{invoice.professional_id}"

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    bold = ParagraphStyle("bold", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=11)
    small = ParagraphStyle("small", parent=styles["Normal"], fontSize=9, textColor=colors.grey)

    story = []

    # Header
    story.append(Paragraph("INVOICE", ParagraphStyle("title", parent=styles["Title"], fontSize=24, spaceAfter=4)))
    story.append(Paragraph(f"Invoice #{invoice.id}", styles["Normal"]))
    story.append(Spacer(1, 0.4*cm))

    # Meta table
    meta = [
        ["Provider", provider_name],
        ["Professional", professional_name],
        ["Period", f"{invoice.period_start} – {invoice.period_end}"],
        ["Status", invoice.status.upper()],
        ["Created", str(invoice.created_at.date())],
    ]
    meta_table = Table(meta, colWidths=[4*cm, 12*cm])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 0.6*cm))

    # Earnings breakdown
    story.append(Paragraph("Earnings Summary", bold))
    story.append(Spacer(1, 0.2*cm))
    breakdown = [
        ["Description", "Amount"],
        ["Total Sessions", str(invoice.total_sessions)],
        ["Total Revenue", f"${invoice.total_revenue:,.2f}"],
        [f"Professional Earnings ({invoice.professional_percentage:.0f}%)", f"${invoice.professional_earnings:,.2f}"],
        [f"Provider Earnings ({100 - invoice.professional_percentage:.0f}%)", f"${invoice.provider_earnings:,.2f}"],
    ]
    t = Table(breakdown, colWidths=[10*cm, 6*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTNAME", (0, -2), (-1, -1), "Helvetica-Bold"),
    ]))
    story.append(t)

    if invoice.notes:
        story.append(Spacer(1, 0.6*cm))
        story.append(Paragraph("Notes", bold))
        story.append(Paragraph(invoice.notes, styles["Normal"]))

    story.append(Spacer(1, 1*cm))
    story.append(Paragraph("Generated by ProBook", small))

    doc.build(story)
    buf.seek(0)

    filename = f"invoice-{invoice.id}-{invoice.period_start}-{invoice.period_end}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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
