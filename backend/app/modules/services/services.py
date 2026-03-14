from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List, Optional

from app.modules.services.models import Service
from app.modules.services.schemas import ServiceCreate, ServiceUpdate

DEFAULT_SERVICES = [
    {"name": "Manicure", "description": "Classic manicure", "duration_minutes": 60, "price": 30.0},
    {"name": "Pedicure", "description": "Classic pedicure", "duration_minutes": 90, "price": 45.0},
]


def seed_default_services(db: Session, salon_id: int) -> None:
    for svc in DEFAULT_SERVICES:
        db.add(Service(salon_id=salon_id, **svc))
    db.commit()


def create_service(db: Session, salon_id: int, data: ServiceCreate) -> Service:
    service = Service(salon_id=salon_id, **data.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


def list_services(db: Session, salon_id: int, active_only: bool = True) -> List[Service]:
    query = db.query(Service).filter(Service.salon_id == salon_id)
    if active_only:
        query = query.filter(Service.is_active == True)
    return query.all()


def get_service_or_404(db: Session, service_id: int, salon_id: Optional[int] = None) -> Service:
    query = db.query(Service).filter(Service.id == service_id)
    if salon_id is not None:
        query = query.filter(Service.salon_id == salon_id)
    service = query.first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


def update_service(db: Session, service: Service, data: ServiceUpdate) -> Service:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service


def delete_service(db: Session, service: Service) -> None:
    service.is_active = False
    db.commit()
