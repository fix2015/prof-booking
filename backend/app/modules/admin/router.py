from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_admin
from app.modules.users.models import User, UserRole
from app.modules.salons.models import Provider
from app.modules.reviews.models import Review
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
