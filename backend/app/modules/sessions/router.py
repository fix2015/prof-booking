from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session as DBSession
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.dependencies import get_current_user, get_current_professional_or_owner
from app.modules.sessions.schemas import SessionCreate, SessionUpdate, SessionResponse, SessionSummary, EarningsInput
from app.modules.sessions.services import (
    create_session, get_session_or_404, update_session,
    list_sessions, record_earnings, get_professional_today_sessions,
    build_confirmation_pdf,
)
from app.modules.sessions.models import SessionStatus
from app.modules.users.models import User, UserRole
from app.modules.masters.services import get_professional_by_user_id

router = APIRouter()


@router.get("/today", response_model=List[SessionSummary])
def my_today_sessions(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    professional = get_professional_by_user_id(db, current_user.id)
    if not professional:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Professional profile not found")
    return get_professional_today_sessions(db, professional.id)


@router.get("/", response_model=List[SessionSummary])
def get_sessions(
    provider_id: Optional[int] = Query(None),
    professional_id: Optional[int] = Query(None),
    status: Optional[SessionStatus] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    current_user: User = Depends(get_current_professional_or_owner),
    db: DBSession = Depends(get_db),
):
    # Professionals can only see their own sessions
    if current_user.role == UserRole.PROFESSIONAL:
        professional = get_professional_by_user_id(db, current_user.id)
        professional_id = professional.id if professional else None
    return list_sessions(db, provider_id, professional_id, status, date_from, date_to, skip, limit)


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: int,
    current_user: User = Depends(get_current_professional_or_owner),
    db: DBSession = Depends(get_db),
):
    return get_session_or_404(db, session_id)


@router.patch("/{session_id}", response_model=SessionResponse)
def update_session_endpoint(
    session_id: int,
    data: SessionUpdate,
    current_user: User = Depends(get_current_professional_or_owner),
    db: DBSession = Depends(get_db),
):
    session = get_session_or_404(db, session_id)
    return update_session(db, session, data)


@router.post("/{session_id}/earnings", response_model=SessionResponse)
def post_earnings(
    session_id: int,
    data: EarningsInput,
    current_user: User = Depends(get_current_professional_or_owner),
    db: DBSession = Depends(get_db),
):
    session = get_session_or_404(db, session_id)
    return record_earnings(db, session, data)


@router.get("/{session_id}/confirmation.pdf")
def get_confirmation_pdf(
    session_id: int,
    current_user: User = Depends(get_current_professional_or_owner),
    db: DBSession = Depends(get_db),
):
    """Download a PDF booking confirmation for a session."""
    session = get_session_or_404(db, session_id)
    buf = build_confirmation_pdf(session)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="confirmation-{session_id}.pdf"'},
    )
