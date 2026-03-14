from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_user, get_current_owner, get_current_admin
from app.modules.salons.schemas import SalonResponse, SalonUpdate, SalonPublic
from app.modules.salons.services import (
    list_salons, get_salon_or_404, update_salon, assert_owner_of_salon,
)
from app.modules.users.models import User

router = APIRouter()


@router.get("/public", response_model=List[SalonPublic])
def get_public_salons(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
):
    """Public endpoint — lists all active salons for client booking."""
    return list_salons(db, skip=skip, limit=limit)


@router.get("/public/{salon_id}", response_model=SalonPublic)
def get_public_salon(salon_id: int, db: Session = Depends(get_db)):
    return get_salon_or_404(db, salon_id)


@router.get("/", response_model=List[SalonResponse])
def get_salons(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return list_salons(db, skip=skip, limit=limit)


@router.get("/{salon_id}", response_model=SalonResponse)
def get_salon(
    salon_id: int,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    return assert_owner_of_salon(db, current_user, salon_id)


@router.patch("/{salon_id}", response_model=SalonResponse)
def update_salon_endpoint(
    salon_id: int,
    data: SalonUpdate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    salon = assert_owner_of_salon(db, current_user, salon_id)
    return update_salon(db, salon, data)
