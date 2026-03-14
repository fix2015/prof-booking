from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_user, get_current_owner
from app.modules.masters.models import Master, MasterSalon, MasterStatus, MasterPhoto
from app.modules.masters.schemas import (
    MasterResponse, MasterUpdate, MasterSalonResponse,
    MasterApprovalRequest, MasterPublic, MasterPhotoResponse,
    MasterDirectCreate,
)
from app.modules.masters.services import (
    list_salon_masters, get_master_or_404, approve_master,
    update_master, get_master_by_user_id, get_master_salons,
    create_master_with_user,
)
from app.modules.salons.services import assert_owner_of_salon
from app.modules.users.models import User

router = APIRouter()


# ──────────────────────────────────────────────
# My profile
# ──────────────────────────────────────────────

@router.get("/me", response_model=MasterResponse)
def get_my_master_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    master = get_master_by_user_id(db, current_user.id)
    if not master:
        raise HTTPException(status_code=404, detail="Master profile not found")
    return master


@router.patch("/me", response_model=MasterResponse)
def update_my_master_profile(
    data: MasterUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    master = get_master_by_user_id(db, current_user.id)
    if not master:
        raise HTTPException(status_code=404, detail="Master profile not found")
    return update_master(db, master, data)


# ──────────────────────────────────────────────
# Discovery (public)
# ──────────────────────────────────────────────

@router.get("/discover", response_model=List[MasterPublic])
def discover_masters(
    search: Optional[str] = Query(None, description="Search by name"),
    nationality: Optional[str] = Query(None),
    min_experience: Optional[int] = Query(None, ge=0),
    salon_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(24, le=100),
    db: Session = Depends(get_db),
):
    """Public endpoint: browse all active masters."""
    q = db.query(Master)

    if salon_id:
        q = q.join(MasterSalon, Master.id == MasterSalon.master_id).filter(
            MasterSalon.salon_id == salon_id,
            MasterSalon.status == MasterStatus.ACTIVE,
        )
    else:
        active_ids = db.query(MasterSalon.master_id).filter(
            MasterSalon.status == MasterStatus.ACTIVE
        ).subquery()
        q = q.filter(Master.id.in_(active_ids))

    if search:
        q = q.filter(Master.name.ilike(f"%{search}%"))
    if nationality:
        q = q.filter(Master.nationality.ilike(f"%{nationality}%"))
    if min_experience is not None:
        q = q.filter(Master.experience_years >= min_experience)

    return q.offset(skip).limit(limit).all()


# ──────────────────────────────────────────────
# Salon masters management (owner)
# ──────────────────────────────────────────────

@router.get("/salon/{salon_id}", response_model=List[MasterSalonResponse])
def get_salon_masters(
    salon_id: int,
    status: Optional[MasterStatus] = Query(MasterStatus.ACTIVE),
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_salon(db, current_user, salon_id)
    return list_salon_masters(db, salon_id, status)


@router.post("/salon/{salon_id}/create", response_model=MasterSalonResponse, status_code=201)
def create_master_directly(
    salon_id: int,
    data: MasterDirectCreate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    """Owner creates a fully new master account and adds them directly as active."""
    assert_owner_of_salon(db, current_user, salon_id)
    return create_master_with_user(db, salon_id, data)


@router.get("/salon/{salon_id}/public", response_model=List[MasterPublic])
def get_salon_masters_public(
    salon_id: int,
    db: Session = Depends(get_db),
):
    """Public endpoint for booking page."""
    master_salons = list_salon_masters(db, salon_id, MasterStatus.ACTIVE)
    return [ms.master for ms in master_salons]


@router.patch("/salon/{salon_id}/{master_id}/approval", response_model=MasterSalonResponse)
def approve_or_reject_master(
    salon_id: int,
    master_id: int,
    data: MasterApprovalRequest,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_salon(db, current_user, salon_id)
    return approve_master(db, salon_id, master_id, data.status, data.payment_amount)


# ──────────────────────────────────────────────
# Individual master (public)
# ──────────────────────────────────────────────

@router.get("/{master_id}", response_model=MasterPublic)
def get_master(
    master_id: int,
    db: Session = Depends(get_db),
):
    """Public: get one master's full profile."""
    master = db.query(Master).filter(Master.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    return master


@router.get("/{master_id}/salons", response_model=List[MasterSalonResponse])
def get_master_salon_list(
    master_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_master_salons(db, master_id)


# ──────────────────────────────────────────────
# Master photos
# ──────────────────────────────────────────────

@router.get("/{master_id}/photos", response_model=List[MasterPhotoResponse])
def get_master_photos(
    master_id: int,
    db: Session = Depends(get_db),
):
    """Public: list master's gallery photos."""
    return (
        db.query(MasterPhoto)
        .filter(MasterPhoto.master_id == master_id)
        .order_by(MasterPhoto.order)
        .all()
    )


@router.post("/me/photos", response_model=MasterPhotoResponse, status_code=201)
def add_my_photo(
    image_url: str,
    caption: Optional[str] = None,
    order: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Master adds a photo to their gallery."""
    master = get_master_by_user_id(db, current_user.id)
    if not master:
        raise HTTPException(status_code=404, detail="Master profile not found")
    photo = MasterPhoto(
        master_id=master.id,
        image_url=image_url,
        caption=caption,
        order=order,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


@router.delete("/me/photos/{photo_id}", status_code=204)
def delete_my_photo(
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    master = get_master_by_user_id(db, current_user.id)
    if not master:
        raise HTTPException(status_code=404, detail="Master profile not found")
    photo = db.query(MasterPhoto).filter(
        MasterPhoto.id == photo_id,
        MasterPhoto.master_id == master.id,
    ).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    db.delete(photo)
    db.commit()
