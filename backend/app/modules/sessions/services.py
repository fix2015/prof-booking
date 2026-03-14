from sqlalchemy.orm import Session as DBSession
from fastapi import HTTPException
from datetime import datetime, timedelta
from typing import Optional, List
import io

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

from app.modules.sessions.models import Session, SessionStatus
from app.modules.sessions.schemas import SessionCreate, SessionUpdate, EarningsInput


def create_session(db: DBSession, data: SessionCreate) -> Session:
    starts_at = data.starts_at
    ends_at = starts_at + timedelta(minutes=data.duration_minutes)

    # Check for conflicts
    conflict = (
        db.query(Session)
        .filter(
            Session.master_id == data.master_id,
            Session.status.notin_([SessionStatus.CANCELLED, SessionStatus.NO_SHOW]),
            Session.starts_at < ends_at,
            Session.ends_at > starts_at,
        )
        .first()
    )
    if conflict:
        raise HTTPException(status_code=409, detail="Time slot is already booked")

    session = Session(
        salon_id=data.salon_id,
        master_id=data.master_id,
        service_id=data.service_id,
        client_name=data.client_name,
        client_phone=data.client_phone,
        client_email=data.client_email,
        client_notes=data.client_notes,
        starts_at=starts_at,
        ends_at=ends_at,
        duration_minutes=data.duration_minutes,
        price=data.price,
        status=SessionStatus.PENDING,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_session_or_404(db: DBSession, session_id: int) -> Session:
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


def update_session(db: DBSession, session: Session, data: SessionUpdate) -> Session:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(session, field, value)
    if data.starts_at and data.duration_minutes:
        session.ends_at = data.starts_at + timedelta(minutes=data.duration_minutes)
    db.commit()
    db.refresh(session)
    return session


def record_earnings(db: DBSession, session: Session, data: EarningsInput) -> Session:
    if session.status not in (SessionStatus.COMPLETED, SessionStatus.IN_PROGRESS):
        raise HTTPException(
            status_code=400, detail="Can only record earnings for completed/in-progress sessions"
        )
    session.earnings_amount = data.earnings_amount
    session.earnings_recorded_at = datetime.utcnow()
    session.status = SessionStatus.COMPLETED
    db.commit()
    db.refresh(session)
    return session


def list_sessions(
    db: DBSession,
    salon_id: Optional[int] = None,
    master_id: Optional[int] = None,
    status: Optional[SessionStatus] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Session]:
    query = db.query(Session)
    if salon_id:
        query = query.filter(Session.salon_id == salon_id)
    if master_id:
        query = query.filter(Session.master_id == master_id)
    if status:
        query = query.filter(Session.status == status)
    if date_from:
        query = query.filter(Session.starts_at >= date_from)
    if date_to:
        query = query.filter(Session.starts_at <= date_to)
    return query.order_by(Session.starts_at.asc()).offset(skip).limit(limit).all()


def get_master_today_sessions(db: DBSession, master_id: int) -> List[Session]:
    today = datetime.utcnow().date()
    return (
        db.query(Session)
        .filter(
            Session.master_id == master_id,
            Session.starts_at >= datetime.combine(today, datetime.min.time()),
            Session.starts_at < datetime.combine(today, datetime.max.time()),
            Session.status.notin_([SessionStatus.CANCELLED]),
        )
        .order_by(Session.starts_at.asc())
        .all()
    )


# ── PDF confirmation ───────────────────────────────────────────────────────────

_PINK = colors.HexColor("#ec4899")
_DARK_PINK = colors.HexColor("#831843")
_LIGHT_PINK = colors.HexColor("#fce7f3")


def build_confirmation_pdf(session: Session) -> io.BytesIO:
    """Generate a booking confirmation PDF for a session."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=25 * mm,
        leftMargin=25 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ConfTitle",
        parent=styles["Heading1"],
        fontSize=22,
        textColor=_DARK_PINK,
        spaceAfter=4,
        alignment=1,  # center
    )
    sub_style = ParagraphStyle(
        "ConfSub",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.HexColor("#6b7280"),
        spaceAfter=2,
        alignment=1,
    )
    code_style = ParagraphStyle(
        "ConfCode",
        parent=styles["Normal"],
        fontSize=28,
        textColor=_PINK,
        fontName="Helvetica-Bold",
        spaceAfter=4,
        alignment=1,
    )

    salon_name = session.salon.name if session.salon else "Nail Salon"
    salon_addr = session.salon.address if session.salon else ""
    salon_phone = session.salon.phone if session.salon else ""
    service_name = session.service.name if session.service else "Service"
    master_name = session.master.name if session.master else "Assigned master"
    date_str = session.starts_at.strftime("%B %d, %Y")
    time_str = session.starts_at.strftime("%I:%M %p")
    duration = f"{session.duration_minutes} min"
    price = f"${session.price:.2f}" if session.price else "—"

    # confirmation_code isn't stored on session — show session id as reference
    ref = f"#{session.id:06d}"

    story = [
        Paragraph(salon_name, title_style),
        Paragraph("Booking Confirmation", sub_style),
        Spacer(1, 6 * mm),
        HRFlowable(width="100%", thickness=1.5, color=_PINK),
        Spacer(1, 4 * mm),
        Paragraph("Booking Reference", sub_style),
        Paragraph(ref, code_style),
        Spacer(1, 4 * mm),
        HRFlowable(width="100%", thickness=0.5, color=_LIGHT_PINK),
        Spacer(1, 4 * mm),
    ]

    details = [
        ["Client", session.client_name],
        ["Service", f"{service_name} ({duration})"],
        ["Master", master_name],
        ["Date", date_str],
        ["Time", time_str],
        ["Price", price],
    ]
    if salon_addr:
        details.append(["Location", salon_addr])

    tbl = Table(details, colWidths=[50 * mm, 110 * mm])
    tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("TEXTCOLOR", (0, 0), (0, -1), _DARK_PINK),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#111827")),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, _LIGHT_PINK]),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 8 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=_LIGHT_PINK))
    story.append(Spacer(1, 4 * mm))

    footer_lines = ["Please arrive 5 minutes early."]
    if salon_phone:
        footer_lines.append(f"Questions? Call us at {salon_phone}")

    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#9ca3af"),
        alignment=1,
        spaceAfter=3,
    )
    for line in footer_lines:
        story.append(Paragraph(line, footer_style))

    doc.build(story)
    buf.seek(0)
    return buf
