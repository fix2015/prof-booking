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


def _assert_can_manage_provider(db: Session, current_user: User, provider_id: int) -> None:
    """Assert user can manage services for a given provider."""
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


def _assert_can_manage_service(db: Session, current_user: User, service: object) -> None:
    """Assert user can edit/delete this specific service."""
    if current_user.role == UserRole.PLATFORM_ADMIN:
        return
    if current_user.role == UserRole.PROFESSIONAL:
        from app.modules.masters.models import Professional
        prof = db.query(Professional).filter(Professional.user_id == current_user.id).first()
        if prof and service.professional_id == prof.id:
            return
        # Allow if linked to any of the service's providers
        for p in (service.providers or []):
            try:
                _assert_can_manage_provider(db, current_user, p.id)
                return
            except HTTPException:
                pass
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == UserRole.PROVIDER_OWNER:
        for p in (service.providers or []):
            try:
                _assert_can_manage_provider(db, current_user, p.id)
                return
            except HTTPException:
                pass
        raise HTTPException(status_code=403, detail="Access denied")
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
    """Create a service with an optional list of providers."""
    if current_user.role == UserRole.PROFESSIONAL:
        from app.modules.masters.models import Professional, ProfessionalProvider, ProfessionalStatus
        prof = db.query(Professional).filter(Professional.user_id == current_user.id).first()
        if not prof:
            raise HTTPException(status_code=403, detail="Professional profile not found")
        # Validate each provider_id
        for pid in data.provider_ids:
            pp = db.query(ProfessionalProvider).filter(
                ProfessionalProvider.professional_id == prof.id,
                ProfessionalProvider.provider_id == pid,
                ProfessionalProvider.status == ProfessionalStatus.ACTIVE,
            ).first()
            if not pp:
                raise HTTPException(status_code=403, detail=f"Not an active professional at provider {pid}")
        return create_service(db, data, professional_id=prof.id)

    if current_user.role == UserRole.PROVIDER_OWNER:
        from app.modules.salons.models import Provider
        provider = db.query(Provider).filter(Provider.owner_id == current_user.id).first()
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
        provider_ids = data.provider_ids if data.provider_ids else [provider.id]
        return create_service(db, data, provider_ids=provider_ids)

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
    """Public: returns services owned by this professional."""
    from app.modules.masters.models import Professional, ProfessionalProvider, ProfessionalStatus
    prof = db.query(Professional).filter(Professional.id == professional_id).first()
    if not prof:
        raise HTTPException(status_code=404, detail="Professional not found")
    # Return personal services + services at their active provider
    personal = list_services_for_professional(db, prof.id)
    pp = db.query(ProfessionalProvider).filter(
        ProfessionalProvider.professional_id == prof.id,
        ProfessionalProvider.status == ProfessionalStatus.ACTIVE,
    ).first()
    provider_services = list_services(db, pp.provider_id) if pp else []
    # Deduplicate by id
    seen: set[int] = set()
    result = []
    for s in personal + provider_services:
        if s.id not in seen:
            seen.add(s.id)
            result.append(s)
    return result


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
    _assert_can_manage_provider(db, current_user, provider_id)
    # Merge provider_id with any ids in body
    ids = list(set(data.provider_ids + [provider_id]))
    return create_service(db, data, provider_ids=ids)


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
