from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_user, get_current_owner
from app.modules.masters.models import Professional, ProfessionalProvider, ProfessionalStatus, ProfessionalPhoto
from app.modules.masters.schemas import (
    ProfessionalResponse, ProfessionalUpdate, ProfessionalProviderResponse,
    ProfessionalApprovalRequest, ProfessionalPublic, ProfessionalPhotoResponse,
    ProfessionalDirectCreate,
)
from app.modules.masters.services import (
    list_provider_professionals, approve_professional,
    update_professional, get_professional_by_user_id, get_professional_providers,
    create_professional_with_user,
)
from app.modules.salons.services import assert_owner_of_provider
from app.modules.users.models import User

router = APIRouter()


# ──────────────────────────────────────────────
# My profile
# ──────────────────────────────────────────────

@router.get("/me", response_model=ProfessionalResponse)
def get_my_professional_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    professional = get_professional_by_user_id(db, current_user.id)
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    return professional


@router.post("/me/providers/{provider_id}", response_model=ProfessionalProviderResponse, status_code=201)
def attach_to_provider(
    provider_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Professional requests to join a provider (creates PENDING relationship)."""
    from app.modules.salons.models import Provider
    professional = get_professional_by_user_id(db, current_user.id)
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    if not db.query(Provider).filter(Provider.id == provider_id).first():
        raise HTTPException(status_code=404, detail="Provider not found")
    existing = db.query(ProfessionalProvider).filter(
        ProfessionalProvider.professional_id == professional.id,
        ProfessionalProvider.provider_id == provider_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already attached to this provider")
    pp = ProfessionalProvider(
        professional_id=professional.id,
        provider_id=provider_id,
        status=ProfessionalStatus.PENDING,
    )
    db.add(pp)
    db.commit()
    db.refresh(pp)
    return pp


@router.patch("/me", response_model=ProfessionalResponse)
def update_my_professional_profile(
    data: ProfessionalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    professional = get_professional_by_user_id(db, current_user.id)
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    return update_professional(db, professional, data)


# ──────────────────────────────────────────────
# Discovery (public)
# ──────────────────────────────────────────────

@router.get("/discover", response_model=List[ProfessionalPublic])
def discover_professionals(
    search: Optional[str] = Query(None, description="Search by name"),
    nationality: Optional[str] = Query(None),
    min_experience: Optional[int] = Query(None, ge=0),
    provider_id: Optional[int] = Query(None),
    service_name: Optional[str] = Query(None, description="Filter by service offered at their provider"),
    is_independent: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(24, le=100),
    db: Session = Depends(get_db),
):
    """Public endpoint: browse all active service professionals."""
    from app.modules.services.models import Service

    q = db.query(Professional)
    needs_distinct = False

    if provider_id:
        q = q.join(ProfessionalProvider, Professional.id == ProfessionalProvider.professional_id).filter(
            ProfessionalProvider.provider_id == provider_id,
            ProfessionalProvider.status == ProfessionalStatus.ACTIVE,
        )
    elif is_independent is True:
        # Independent-only: skip the active_via_provider subquery entirely
        q = q.filter(Professional.is_independent == True)  # noqa: E712
    else:
        active_via_provider = db.query(ProfessionalProvider.professional_id).filter(
            ProfessionalProvider.status == ProfessionalStatus.ACTIVE
        ).subquery()
        if is_independent is False:
            q = q.filter(Professional.id.in_(active_via_provider))
        else:
            # Default: active via any provider OR self-declared independent
            q = q.filter(
                (Professional.id.in_(active_via_provider)) | (Professional.is_independent == True)  # noqa: E712
            )

    if service_name:
        provider_ids_with_service = db.query(Service.provider_id).filter(
            Service.name.ilike(f"%{service_name}%"),
            Service.is_active == True,  # noqa: E712
        ).subquery()
        matching_prof_ids = db.query(ProfessionalProvider.professional_id).filter(
            ProfessionalProvider.provider_id.in_(provider_ids_with_service),
            ProfessionalProvider.status == ProfessionalStatus.ACTIVE,
        ).subquery()
        q = q.filter(Professional.id.in_(matching_prof_ids))
        needs_distinct = True

    if search:
        q = q.filter(Professional.name.ilike(f"%{search}%"))
    if nationality:
        q = q.filter(Professional.nationality.ilike(f"%{nationality}%"))
    if min_experience is not None:
        q = q.filter(Professional.experience_years >= min_experience)

    if needs_distinct:
        q = q.distinct()
    return q.offset(skip).limit(limit).all()


# ──────────────────────────────────────────────
# Provider professionals management (owner)
# ──────────────────────────────────────────────

@router.get("/provider/{provider_id}", response_model=List[ProfessionalProviderResponse])
def get_provider_professionals(
    provider_id: int,
    status: Optional[ProfessionalStatus] = Query(None),
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_provider(db, current_user, provider_id)
    return list_provider_professionals(db, provider_id, status)


@router.post("/provider/{provider_id}/create", response_model=ProfessionalProviderResponse, status_code=201)
def create_professional_directly(
    provider_id: int,
    data: ProfessionalDirectCreate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    """Owner creates a fully new professional account and adds them directly as active."""
    assert_owner_of_provider(db, current_user, provider_id)
    return create_professional_with_user(db, provider_id, data)


@router.get("/provider/{provider_id}/public", response_model=List[ProfessionalPublic])
def get_provider_professionals_public(
    provider_id: int,
    db: Session = Depends(get_db),
):
    """Public endpoint for booking page."""
    professional_providers = list_provider_professionals(db, provider_id, ProfessionalStatus.ACTIVE)
    return [pp.professional for pp in professional_providers]


@router.patch("/provider/{provider_id}/{professional_id}/approval", response_model=ProfessionalProviderResponse)
def approve_or_reject_professional(
    provider_id: int,
    professional_id: int,
    data: ProfessionalApprovalRequest,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_provider(db, current_user, provider_id)
    return approve_professional(db, provider_id, professional_id, data.status, data.payment_amount)


# ──────────────────────────────────────────────
# Individual professional (public)
# ──────────────────────────────────────────────

@router.get("/{professional_id}", response_model=ProfessionalPublic)
def get_professional(
    professional_id: int,
    db: Session = Depends(get_db),
):
    """Public: get one professional's full profile."""
    professional = db.query(Professional).filter(Professional.id == professional_id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    return professional


@router.get("/{professional_id}/providers", response_model=List[ProfessionalProviderResponse])
def get_professional_provider_list(
    professional_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_professional_providers(db, professional_id)


# ──────────────────────────────────────────────
# Professional photos
# ──────────────────────────────────────────────

@router.get("/{professional_id}/photos", response_model=List[ProfessionalPhotoResponse])
def get_professional_photos(
    professional_id: int,
    db: Session = Depends(get_db),
):
    """Public: list professional's gallery photos."""
    return (
        db.query(ProfessionalPhoto)
        .filter(ProfessionalPhoto.professional_id == professional_id)
        .order_by(ProfessionalPhoto.order)
        .all()
    )


@router.post("/me/photos", response_model=ProfessionalPhotoResponse, status_code=201)
def add_my_photo(
    image_url: str,
    caption: Optional[str] = None,
    order: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Professional adds a photo to their gallery."""
    professional = get_professional_by_user_id(db, current_user.id)
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    photo = ProfessionalPhoto(
        professional_id=professional.id,
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
    professional = get_professional_by_user_id(db, current_user.id)
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    photo = db.query(ProfessionalPhoto).filter(
        ProfessionalPhoto.id == photo_id,
        ProfessionalPhoto.professional_id == professional.id,
    ).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    db.delete(photo)
    db.commit()
