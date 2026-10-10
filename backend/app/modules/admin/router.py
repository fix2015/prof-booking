from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Literal, Optional

from app.database import get_db
from app.dependencies import get_current_admin
from app.modules.users.models import User, UserRole
from app.modules.salons.models import Provider
from app.modules.reviews.models import Review, ReviewReport, ReviewReportStatus
from app.modules.reviews.schemas import ReviewReportUpdate
from app.modules.reviews.services import HIDE_THRESHOLD
from app.modules.services.models import Service

router = APIRouter()


# ── Providers ─────────────────────────────────────────────────────────────────

@router.get("/providers")
def admin_list_providers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return db.query(Provider).order_by(Provider.id).offset(skip).limit(limit).all()


@router.patch("/providers/{provider_id}")
def admin_toggle_provider(
    provider_id: int,
    is_active: bool = Query(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    p = db.query(Provider).filter(Provider.id == provider_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Provider not found")
    p.is_active = is_active
    db.commit()
    return {"ok": True, "is_active": is_active}


@router.delete("/providers/{provider_id}", status_code=204)
def admin_delete_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    exists = db.execute(text("SELECT id FROM providers WHERE id = :pid"), {"pid": provider_id}).fetchone()
    if not exists:
        raise HTTPException(status_code=404, detail="Provider not found")
    # Raw SQL DELETE lets PostgreSQL handle ON DELETE CASCADE automatically
    db.execute(text("DELETE FROM providers WHERE id = :pid"), {"pid": provider_id})
    db.commit()


# ── Users / Professionals ─────────────────────────────────────────────────────

@router.get("/users")
def admin_list_users(
    role: Optional[UserRole] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    q = db.query(User).filter(User.id != current_user.id)
    if role:
        q = q.filter(User.role == role)
    return q.order_by(User.id).offset(skip).limit(limit).all()


@router.patch("/users/{user_id}")
def admin_toggle_user(
    user_id: int,
    is_active: bool = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if u.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    if u.role == UserRole.PLATFORM_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot modify another platform admin")
    u.is_active = is_active
    db.commit()
    return {"ok": True, "is_active": is_active}


@router.delete("/users/{user_id}", status_code=204)
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if u.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    if u.role == UserRole.PLATFORM_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot delete another platform admin")
    # If owner, delete their provider first (cascades sessions, services, etc.)
    owner_row = db.execute(
        text("SELECT provider_id FROM provider_owners WHERE user_id = :uid"), {"uid": user_id}
    ).fetchone()
    if owner_row:
        db.execute(text("DELETE FROM providers WHERE id = :pid"), {"pid": owner_row.provider_id})
    # Delete the user — PostgreSQL cascades to professionals, refresh_tokens, etc.
    db.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": user_id})
    db.commit()


# ── Reviews ───────────────────────────────────────────────────────────────────

@router.get("/reviews")
def admin_list_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return (
        db.query(Review)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.patch("/reviews/{review_id}")
def admin_toggle_review(
    review_id: int,
    is_published: bool = Query(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    r = db.query(Review).filter(Review.id == review_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Review not found")
    r.is_published = is_published
    db.commit()
    return {"ok": True, "is_published": is_published}


@router.get("/review-reports")
def admin_list_review_reports(
    status: Literal["open", "resolved", "all"] = Query("open"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Reported reviews (App Store guideline 1.2), newest first, with the review they refer to and how many open
    reports it has (a review with HIDE_THRESHOLD+ open reports is hidden from the public)."""
    open_counts = dict(
        db.query(ReviewReport.review_id, func.count(ReviewReport.id))
        .filter(ReviewReport.status == ReviewReportStatus.OPEN)
        .group_by(ReviewReport.review_id)
        .all()
    )
    q = (
        db.query(ReviewReport, Review, User.email)
        .join(Review, Review.id == ReviewReport.review_id)
        .outerjoin(User, User.id == ReviewReport.reporter_user_id)
    )
    if status != "all":
        q = q.filter(ReviewReport.status == ReviewReportStatus(status))
    return [
        {
            "id": rep.id, "review_id": rev.id, "reason": rep.reason.value, "note": rep.note,
            "status": rep.status.value, "created_at": rep.created_at,
            "reporter_user_id": rep.reporter_user_id, "reporter_email": email,
            "review": {
                "id": rev.id, "client_name": rev.client_name, "rating": rev.rating, "comment": rev.comment,
                "is_published": rev.is_published, "provider_id": rev.provider_id,
                "open_reports": open_counts.get(rev.id, 0),
                "hidden_by_reports": open_counts.get(rev.id, 0) >= HIDE_THRESHOLD,
            },
        }
        for rep, rev, email in q.order_by(ReviewReport.created_at.desc()).limit(500).all()
    ]


@router.patch("/review-reports/{report_id}")
def admin_update_review_report(
    report_id: int,
    data: ReviewReportUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Resolve (or re-open) a report. Resolving also resolves the other open reports of the same review, so the
    review is visible again unless review_published=false hides it."""
    rep = db.query(ReviewReport).filter(ReviewReport.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")
    new_status = ReviewReportStatus(data.status)
    if new_status == ReviewReportStatus.RESOLVED:
        db.query(ReviewReport).filter(
            ReviewReport.review_id == rep.review_id, ReviewReport.status == ReviewReportStatus.OPEN
        ).update({ReviewReport.status: ReviewReportStatus.RESOLVED}, synchronize_session=False)
    rep.status = new_status
    review = db.query(Review).filter(Review.id == rep.review_id).first()
    if review is not None and data.review_published is not None:
        review.is_published = data.review_published
    db.commit()
    db.refresh(rep)
    return {
        "id": rep.id, "review_id": rep.review_id, "status": rep.status.value,
        "review_published": review.is_published if review is not None else None,
    }


@router.delete("/reviews/{review_id}", status_code=204)
def admin_delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    r = db.query(Review).filter(Review.id == review_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(r)
    db.commit()


# ── Services ──────────────────────────────────────────────────────────────────

@router.get("/services")
def admin_list_services(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return (
        db.query(Service)
        .order_by(Service.name)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.patch("/services/{service_id}")
def admin_toggle_service(
    service_id: int,
    is_active: bool = Query(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    s = db.query(Service).filter(Service.id == service_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Service not found")
    s.is_active = is_active
    db.commit()
    return {"ok": True, "is_active": is_active}


@router.delete("/services/{service_id}", status_code=204)
def admin_delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    s = db.query(Service).filter(Service.id == service_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(s)
    db.commit()
