from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_user
from app.modules.services.schemas import ServiceCreate, ServiceUpdate, ServiceResponse
from app.modules.services.services import (
    create_service, list_services, get_service_or_404, update_service, delete_service,
)
from app.modules.users.models import User, UserRole

router = APIRouter()


def _assert_can_manage(db: Session, current_user: User, provider_id: int) -> None:
    """Allow the provider owner OR an active professional at this provider."""
    if current_user.role == UserRole.PROVIDER_OWNER:
        from app.modules.salons.services import assert_owner_of_provider
        assert_owner_of_provider(db, current_user, provider_id)
    elif current_user.role == UserRole.PROFESSIONAL:
        from app.modules.masters.models import Professional, ProfessionalProvider, ProfessionalStatus
        prof = db.query(Professional).filter(Professional.user_id == current_user.id).first()
        if not prof:
            raise HTTPException(status_code=403, detail="Professional profile not found")
        pp = db.query(ProfessionalProvider).filter(
            ProfessionalProvider.professional_id == prof.id,
            ProfessionalProvider.provider_id == provider_id,
            ProfessionalProvider.status == ProfessionalStatus.ACTIVE,
        ).first()
        if not pp:
            raise HTTPException(status_code=403, detail="Not an active professional at this provider")
    else:
        raise HTTPException(status_code=403, detail="Access denied")


@router.get("/names", response_model=List[str])
def get_service_names(db: Session = Depends(get_db)):
    """Public: return distinct active service names across all providers."""
    from sqlalchemy import distinct, func
    from app.modules.services.models import Service
    rows = (
        db.query(distinct(func.lower(Service.name)), Service.name)
        .filter(Service.is_active == True)  # noqa: E712
        .order_by(func.lower(Service.name))
        .all()
    )
    seen: set[str] = set()
    names: list[str] = []
    for _, name in rows:
        key = name.lower()
        if key not in seen:
            seen.add(key)
            names.append(name)
    return names


@router.get("/provider/{provider_id}", response_model=List[ServiceResponse])
def get_services(provider_id: int, db: Session = Depends(get_db)):
    """Public endpoint for listing provider services."""
    return list_services(db, provider_id)


@router.post("/provider/{provider_id}", response_model=ServiceResponse, status_code=201)
def create_service_endpoint(
    provider_id: int,
    data: ServiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_can_manage(db, current_user, provider_id)
    return create_service(db, provider_id, data)


@router.patch("/{service_id}", response_model=ServiceResponse)
def update_service_endpoint(
    service_id: int,
    data: ServiceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = get_service_or_404(db, service_id)
    _assert_can_manage(db, current_user, service.provider_id)
    return update_service(db, service, data)


@router.delete("/{service_id}", status_code=204)
def delete_service_endpoint(
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = get_service_or_404(db, service_id)
    _assert_can_manage(db, current_user, service.provider_id)
    delete_service(db, service)
