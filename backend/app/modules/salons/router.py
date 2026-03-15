from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_owner, get_current_admin
from app.modules.salons.schemas import ProviderCreate, ProviderResponse, ProviderUpdate, ProviderPublic
from app.modules.salons.services import (
    list_providers, get_provider_or_404, update_provider, assert_owner_of_provider,
    create_provider_for_owner, get_owner_provider,
)
from app.modules.users.models import User

router = APIRouter()


@router.get("/public", response_model=List[ProviderPublic])
def get_public_providers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
):
    """Public endpoint — lists all active service providers for client booking."""
    return list_providers(db, skip=skip, limit=limit)


@router.get("/public/{provider_id}", response_model=ProviderPublic)
def get_public_provider(provider_id: int, db: Session = Depends(get_db)):
    return get_provider_or_404(db, provider_id)


@router.get("/my", response_model=ProviderResponse)
def get_my_provider(
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    """Returns the provider owned by the current user."""
    provider = get_owner_provider(db, current_user)
    if not provider:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No provider found for this owner")
    return provider


@router.post("/", response_model=ProviderResponse, status_code=201)
def create_my_provider(
    data: ProviderCreate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    """Creates a new provider for the current owner (only if they don't have one)."""
    existing = get_owner_provider(db, current_user)
    if existing:
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail="Owner already has a provider")
    return create_provider_for_owner(
        db,
        owner_user=current_user,
        provider_name=data.name,
        provider_address=data.address or "",
        worker_payment_amount=data.worker_payment_amount,
    )


@router.get("/", response_model=List[ProviderResponse])
def get_providers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return list_providers(db, skip=skip, limit=limit)


@router.get("/{provider_id}", response_model=ProviderResponse)
def get_provider(
    provider_id: int,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    return assert_owner_of_provider(db, current_user, provider_id)


@router.patch("/{provider_id}", response_model=ProviderResponse)
def update_provider_endpoint(
    provider_id: int,
    data: ProviderUpdate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    provider = assert_owner_of_provider(db, current_user, provider_id)
    return update_provider(db, provider, data)
