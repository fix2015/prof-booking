"""Analytics endpoints for owners and masters."""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date

from app.database import get_db
from app.dependencies import get_current_owner, get_current_user
from app.modules.sessions.models import Session as SessionModel, SessionStatus
from app.modules.masters.models import Master, MasterSalon, MasterStatus
from app.modules.salons.services import assert_owner_of_salon
from app.modules.masters.services import get_master_by_user_id
from app.modules.users.models import User

router = APIRouter()


@router.get("/owner/salon/{salon_id}/workers")
def owner_workers_analytics(
    salon_id: int,
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    """Owner analytics: worker list with hours, sessions, and earnings breakdown."""
    assert_owner_of_salon(db, current_user, salon_id)

    if not date_from:
        date_from = datetime(datetime.utcnow().year, datetime.utcnow().month, 1)
    if not date_to:
        date_to = datetime.utcnow()

    # Get active masters for this salon
    master_salons = (
        db.query(MasterSalon)
        .filter(MasterSalon.salon_id == salon_id, MasterSalon.status == MasterStatus.ACTIVE)
        .all()
    )

    result = []
    for ms in master_salons:
        sessions = db.query(SessionModel).filter(
            SessionModel.salon_id == salon_id,
            SessionModel.master_id == ms.master_id,
            SessionModel.starts_at >= date_from,
            SessionModel.starts_at <= date_to,
        ).all()

        completed = [s for s in sessions if s.status == SessionStatus.COMPLETED]
        total_minutes = sum(s.duration_minutes for s in completed)
        total_revenue = sum(s.price or 0 for s in completed)
        master_pct = ms.payment_amount or 70.0  # treat as percentage if <= 100
        master_earnings = total_revenue * master_pct / 100 if master_pct <= 100 else master_pct * len(completed)

        result.append({
            "master_id": ms.master_id,
            "master_name": ms.master.name if ms.master else "",
            "avatar_url": ms.master.avatar_url if ms.master else None,
            "status": ms.status,
            "total_sessions": len(sessions),
            "completed_sessions": len(completed),
            "total_hours": round(total_minutes / 60, 1),
            "total_revenue": total_revenue,
            "master_earnings": round(master_earnings, 2),
            "salon_earnings": round(total_revenue - master_earnings, 2),
            "master_percentage": master_pct,
        })

    return result


@router.get("/master/me/summary")
def master_own_analytics(
    salon_id: Optional[int] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Master analytics: own summary across salons."""
    master = get_master_by_user_id(db, current_user.id)
    if not master:
        raise HTTPException(status_code=404, detail="Master profile not found")

    if not date_from:
        date_from = datetime(datetime.utcnow().year, datetime.utcnow().month, 1)
    if not date_to:
        date_to = datetime.utcnow()

    q = db.query(SessionModel).filter(
        SessionModel.master_id == master.id,
        SessionModel.starts_at >= date_from,
        SessionModel.starts_at <= date_to,
    )
    if salon_id:
        q = q.filter(SessionModel.salon_id == salon_id)

    sessions = q.all()
    completed = [s for s in sessions if s.status == SessionStatus.COMPLETED]
    total_minutes = sum(s.duration_minutes for s in completed)
    total_revenue = sum(s.price or 0 for s in completed)

    # Per-salon breakdown
    salon_breakdown: dict = {}
    for s in completed:
        sid = s.salon_id
        if sid not in salon_breakdown:
            salon_breakdown[sid] = {"sessions": 0, "revenue": 0.0, "hours": 0.0}
        salon_breakdown[sid]["sessions"] += 1
        salon_breakdown[sid]["revenue"] += s.price or 0
        salon_breakdown[sid]["hours"] += s.duration_minutes / 60

    # Monthly breakdown
    monthly: dict = {}
    for s in completed:
        key = s.starts_at.strftime("%Y-%m")
        if key not in monthly:
            monthly[key] = {"sessions": 0, "revenue": 0.0}
        monthly[key]["sessions"] += 1
        monthly[key]["revenue"] += s.price or 0

    return {
        "master_id": master.id,
        "master_name": master.name,
        "period_from": date_from.isoformat(),
        "period_to": date_to.isoformat(),
        "total_sessions": len(sessions),
        "completed_sessions": len(completed),
        "total_hours": round(total_minutes / 60, 1),
        "total_revenue": total_revenue,
        "unique_clients": len(set(s.client_phone for s in completed)),
        "salon_breakdown": [
            {"salon_id": k, **v} for k, v in salon_breakdown.items()
        ],
        "monthly_breakdown": [
            {"month": k, **v} for k, v in sorted(monthly.items())
        ],
    }
