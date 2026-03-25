from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List, Optional

from app.modules.services.models import Service, service_providers
from app.modules.services.schemas import ServiceCreate, ServiceUpdate

DEFAULT_SERVICES = [
    {"name": "Service", "description": "General service", "duration_minutes": 60, "price": 30.0},
]


def _set_providers(db: Session, service: Service, provider_ids: List[int]) -> None:
    from app.modules.salons.models import Provider
    if provider_ids:
        service.providers = db.query(Provider).filter(Provider.id.in_(provider_ids)).all()
    else:
        service.providers = []


def seed_default_services(db: Session, provider_id: int) -> None:
    for svc in DEFAULT_SERVICES:
        s = Service(**svc)
        db.add(s)
        db.flush()
        _set_providers(db, s, [provider_id])
    db.commit()


def create_service(
    db: Session,
    data: ServiceCreate,
    provider_ids: Optional[List[int]] = None,
    professional_id: Optional[int] = None,
) -> Service:
    payload = data.model_dump(exclude={"provider_ids"})
    service = Service(professional_id=professional_id, **payload)
    db.add(service)
    db.flush()
    ids = provider_ids if provider_ids is not None else data.provider_ids
    _set_providers(db, service, ids)
    db.commit()
    db.refresh(service)
    return service


def list_services(db: Session, provider_id: int, active_only: bool = True) -> List[Service]:
    query = (
        db.query(Service)
        .join(service_providers, Service.id == service_providers.c.service_id)
        .filter(service_providers.c.provider_id == provider_id)
    )
    if active_only:
        query = query.filter(Service.is_active == True)  # noqa: E712
    return query.all()


def list_services_for_professional(db: Session, professional_id: int, active_only: bool = True) -> List[Service]:
    query = db.query(Service).filter(Service.professional_id == professional_id)
    if active_only:
        query = query.filter(Service.is_active == True)  # noqa: E712
    return query.all()


def get_service_or_404(db: Session, service_id: int) -> Service:
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


def update_service(db: Session, service: Service, data: ServiceUpdate) -> Service:
    fields = data.model_dump(exclude_none=True, exclude={"provider_ids"})
    for field, value in fields.items():
        setattr(service, field, value)
    if data.provider_ids is not None:
        _set_providers(db, service, data.provider_ids)
    db.commit()
    db.refresh(service)
    return service


def delete_service(db: Session, service: Service) -> None:
    service.is_active = False
    db.commit()
