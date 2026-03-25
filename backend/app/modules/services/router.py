from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_user
from app.modules.services.schemas import ServiceCreate, ServiceUpdate, ServiceResponse
from app.modules.services.services import (
    create_service, list_services, list_services_for_professional,
    get_service_or_404, update_service, delete_service,
)
from app.modules.users.models import User, UserRole

router = APIRouter()


def _assert_can_manage(db: Session, current_user: User, provider_id: int) -> None:
    """Professionals (at this provider), provider owners, and admins can manage services."""
    if current_user.role == UserRole.PLATFORM_ADMIN:
        return
    if current_user.role == UserRole.PROVIDER_OWNER:
        from app.modules.salons.models import Provider
        provider = db.query(Provider).filter(
            Provider.id == provider_id,
            Provider.owner_id == current_user.id,
        ).first()
        if not provider:
            raise HTTPException(status_code=403, detail="Not your provider")
        return
    if current_user.role == UserRole.PROFESSIONAL:
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
        return
    raise HTTPException(status_code=403, detail="Access denied")


@router.get("/my", response_model=List[ServiceResponse])
def get_my_services(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns all active services owned by the current professional or provider."""
    if current_user.role == UserRole.PROFESSIONAL:
        from app.modules.masters.models import Professional
        prof = db.query(Professional).filter(Professional.user_id == current_user.id).first()
        if not prof:
            raise HTTPException(status_code=404, detail="Professional profile not found")
        return list_services_for_professional(db, prof.id)
    if current_user.role == UserRole.PROVIDER_OWNER:
        from app.modules.salons.models import Provider
        provider = db.query(Provider).filter(Provider.owner_id == current_user.id).first()
        if not provider:
            return []
        return list_services(db, provider.id)
    raise HTTPException(status_code=403, detail="Access denied")


@router.post("/", response_model=ServiceResponse, status_code=201)
def create_service_for_user(
    data: ServiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a service. Provider_id in body is optional for professionals."""
    if current_user.role == UserRole.PROFESSIONAL:
        from app.modules.masters.models import Professional, ProfessionalProvider, ProfessionalStatus
        prof = db.query(Professional).filter(Professional.user_id == current_user.id).first()
        if not prof:
            raise HTTPException(status_code=403, detail="Professional profile not found")
        provider_id = data.provider_id
        if provider_id is not None:
            # Validate the professional is linked to this provider
            pp = db.query(ProfessionalProvider).filter(
                ProfessionalProvider.professional_id == prof.id,
                ProfessionalProvider.provider_id == provider_id,
                ProfessionalProvider.status == ProfessionalStatus.ACTIVE,
            ).first()
            if not pp:
                raise HTTPException(status_code=403, detail="Not an active professional at this provider")
        return create_service(db, data, provider_id=provider_id, professional_id=prof.id)
    if current_user.role == UserRole.PROVIDER_OWNER:
        from app.modules.salons.models import Provider
        provider = db.query(Provider).filter(Provider.owner_id == current_user.id).first()
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
        provider_id = data.provider_id if data.provider_id is not None else provider.id
        _assert_can_manage(db, current_user, provider_id)
        return create_service(db, data, provider_id=provider_id)
    raise HTTPException(status_code=403, detail="Access denied")


@router.get("/names", response_model=List[str])
def get_service_names(db: Session = Depends(get_db)):
    """Public: return distinct active service names across all providers."""
    from sqlalchemy import func
    from app.modules.services.models import Service
    rows = (
        db.query(Service.name)
        .filter(Service.is_active == True)  # noqa: E712
        .order_by(func.lower(Service.name))
        .all()
    )
    seen: set[str] = set()
    names: list[str] = []
    for (name,) in rows:
        key = name.lower()
        if key not in seen:
            seen.add(key)
            names.append(name)
    return names


@router.get("/professional/{professional_id}", response_model=List[ServiceResponse])
def get_services_by_professional(professional_id: int, db: Session = Depends(get_db)):
    """Public: returns services from the professional's active provider."""
    from app.modules.masters.models import Professional, ProfessionalProvider, ProfessionalStatus
    prof = db.query(Professional).filter(Professional.id == professional_id).first()
    if not prof:
        raise HTTPException(status_code=404, detail="Professional not found")
    pp = db.query(ProfessionalProvider).filter(
        ProfessionalProvider.professional_id == prof.id,
        ProfessionalProvider.status == ProfessionalStatus.ACTIVE,
    ).first()
    if not pp:
        return []
    return list_services(db, pp.provider_id)


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
    return create_service(db, data, provider_id=provider_id)


def _assert_can_manage_service(db: Session, current_user: User, service) -> None:
    """Assert the current user can edit/delete this service."""
    if current_user.role == UserRole.PLATFORM_ADMIN:
        return
    if current_user.role == UserRole.PROFESSIONAL:
        from app.modules.masters.models import Professional
        prof = db.query(Professional).filter(Professional.user_id == current_user.id).first()
        if prof and service.professional_id == prof.id:
            return
        # Also allow if they manage it via provider link
        if service.provider_id is not None:
            _assert_can_manage(db, current_user, service.provider_id)
            return
        raise HTTPException(status_code=403, detail="Access denied")
    if service.provider_id is not None:
        _assert_can_manage(db, current_user, service.provider_id)
        return
    raise HTTPException(status_code=403, detail="Access denied")


@router.patch("/{service_id}", response_model=ServiceResponse)
def update_service_endpoint(
    service_id: int,
    data: ServiceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = get_service_or_404(db, service_id)
    _assert_can_manage_service(db, current_user, service)
    return update_service(db, service, data)


@router.delete("/{service_id}", status_code=204)
def delete_service_endpoint(
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = get_service_or_404(db, service_id)
    _assert_can_manage_service(db, current_user, service)
    delete_service(db, service)
