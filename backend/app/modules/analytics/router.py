"""Analytics endpoints for owners and professionals."""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.dependencies import get_current_owner, get_current_user
from app.modules.sessions.models import Session as SessionModel, SessionStatus
from app.modules.masters.models import ProfessionalProvider, ProfessionalStatus
from app.modules.salons.services import assert_owner_of_provider
from app.modules.masters.services import get_professional_by_user_id
from app.modules.users.models import User

router = APIRouter()


@router.get("/owner/provider/{provider_id}/workers")
def owner_workers_analytics(
    provider_id: int,
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    """Owner analytics: worker list with hours, sessions, and earnings breakdown."""
    assert_owner_of_provider(db, current_user, provider_id)

    if not date_from:
        date_from = datetime(datetime.utcnow().year, datetime.utcnow().month, 1)
    if not date_to:
        date_to = datetime.utcnow()

    # Get active professionals for this provider
    professional_providers = (
        db.query(ProfessionalProvider)
        .filter(ProfessionalProvider.provider_id == provider_id, ProfessionalProvider.status == ProfessionalStatus.ACTIVE)
        .all()
    )

    result = []
    for pp in professional_providers:
        sessions = db.query(SessionModel).filter(
            SessionModel.provider_id == provider_id,
            SessionModel.professional_id == pp.professional_id,
            SessionModel.starts_at >= date_from,
            SessionModel.starts_at <= date_to,
        ).all()

        completed = [s for s in sessions if s.status == SessionStatus.COMPLETED]
        total_minutes = sum(s.duration_minutes for s in completed)
        total_revenue = sum(s.price or 0 for s in completed)
        professional_pct = pp.payment_amount or 70.0  # treat as percentage if <= 100
        professional_earnings = total_revenue * professional_pct / 100 if professional_pct <= 100 else professional_pct * len(completed)

        result.append({
            "professional_id": pp.professional_id,
            "professional_name": pp.professional.name if pp.professional else "",
            "avatar_url": pp.professional.avatar_url if pp.professional else None,
            "status": pp.status,
            "total_sessions": len(sessions),
            "completed_sessions": len(completed),
            "total_hours": round(total_minutes / 60, 1),
            "total_revenue": total_revenue,
            "professional_earnings": round(professional_earnings, 2),
            "provider_earnings": round(total_revenue - professional_earnings, 2),
            "professional_percentage": professional_pct,
        })

    return result


@router.get("/professional/me/summary")
def professional_own_analytics(
    provider_id: Optional[int] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Professional analytics: own summary across providers."""
    professional = get_professional_by_user_id(db, current_user.id)
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")

    if not date_from:
        date_from = datetime(datetime.utcnow().year, datetime.utcnow().month, 1)
    if not date_to:
        date_to = datetime.utcnow()

    q = db.query(SessionModel).filter(
        SessionModel.professional_id == professional.id,
        SessionModel.starts_at >= date_from,
        SessionModel.starts_at <= date_to,
    )
    if provider_id:
        q = q.filter(SessionModel.provider_id == provider_id)

    sessions = q.all()
    completed = [s for s in sessions if s.status == SessionStatus.COMPLETED]
    total_minutes = sum(s.duration_minutes for s in completed)
    total_revenue = sum(s.price or 0 for s in completed)

    # Per-provider breakdown
    provider_breakdown: dict = {}
    for s in completed:
        pid = s.provider_id
        if pid not in provider_breakdown:
            provider_breakdown[pid] = {"sessions": 0, "revenue": 0.0, "hours": 0.0}
        provider_breakdown[pid]["sessions"] += 1
        provider_breakdown[pid]["revenue"] += s.price or 0
        provider_breakdown[pid]["hours"] += s.duration_minutes / 60

    # Monthly breakdown
    monthly: dict = {}
    for s in completed:
        key = s.starts_at.strftime("%Y-%m")
        if key not in monthly:
            monthly[key] = {"sessions": 0, "revenue": 0.0}
        monthly[key]["sessions"] += 1
        monthly[key]["revenue"] += s.price or 0

    return {
        "professional_id": professional.id,
        "professional_name": professional.name,
        "period_from": date_from.isoformat(),
        "period_to": date_to.isoformat(),
        "total_sessions": len(sessions),
        "completed_sessions": len(completed),
        "total_hours": round(total_minutes / 60, 1),
        "total_revenue": total_revenue,
        "unique_clients": len(set(s.client_phone for s in completed)),
        "provider_breakdown": [
            {"provider_id": k, **v} for k, v in provider_breakdown.items()
        ],
        "monthly_breakdown": [
            {"month": k, **v} for k, v in sorted(monthly.items())
        ],
    }
