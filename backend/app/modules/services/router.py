from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_user, get_current_owner
from app.modules.services.schemas import ServiceCreate, ServiceUpdate, ServiceResponse
from app.modules.services.services import (
    create_service, list_services, get_service_or_404, update_service, delete_service,
)
from app.modules.salons.services import assert_owner_of_salon
from app.modules.users.models import User

router = APIRouter()


@router.get("/salon/{salon_id}", response_model=List[ServiceResponse])
def get_services(salon_id: int, db: Session = Depends(get_db)):
    """Public endpoint for listing salon services."""
    return list_services(db, salon_id)


@router.post("/salon/{salon_id}", response_model=ServiceResponse, status_code=201)
def create_service_endpoint(
    salon_id: int,
    data: ServiceCreate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_salon(db, current_user, salon_id)
    return create_service(db, salon_id, data)


@router.patch("/{service_id}", response_model=ServiceResponse)
def update_service_endpoint(
    service_id: int,
    data: ServiceUpdate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    service = get_service_or_404(db, service_id)
    assert_owner_of_salon(db, current_user, service.salon_id)
    return update_service(db, service, data)


@router.delete("/{service_id}", status_code=204)
def delete_service_endpoint(
    service_id: int,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    service = get_service_or_404(db, service_id)
    assert_owner_of_salon(db, current_user, service.salon_id)
    delete_service(db, service)
