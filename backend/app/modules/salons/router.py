from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date as date_type

from app.database import get_db
from app.dependencies import get_current_owner, get_current_admin
from app.modules.salons.schemas import ProviderCreate, ProviderResponse, ProviderUpdate, ProviderPublic
from app.modules.salons.services import (
    list_providers, get_provider_or_404, update_provider, assert_owner_of_provider,
    create_provider_for_owner, get_owner_provider,
)
from app.modules.users.models import User

router = APIRouter()


@router.get("/search", response_model=List[ProviderPublic])
def search_providers(
    q: Optional[str] = Query(None, description="Search by name or address"),
    address: Optional[str] = Query(None),
    service_name: Optional[str] = Query(None),
    available_date: Optional[date_type] = Query(None, description="Filter to providers with available slots on this date"),
    category: Optional[str] = Query(None, description="Filter by provider category"),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    nationality: Optional[str] = Query(None),
    min_experience: Optional[int] = Query(None),
    sort: Optional[str] = Query(None),
    lat_min: Optional[float] = Query(None, description="SW latitude of map bounds"),
    lat_max: Optional[float] = Query(None, description="NE latitude of map bounds"),
    lng_min: Optional[float] = Query(None, description="SW longitude of map bounds"),
    lng_max: Optional[float] = Query(None, description="NE longitude of map bounds"),
    skip: int = Query(0, ge=0),
    limit: int = Query(24, le=100),
    db: Session = Depends(get_db),
):
    """Public: search providers by name, address, and/or service offered."""
    from app.modules.salons.models import Provider
    from app.modules.services.models import Service

    query = db.query(Provider).filter(Provider.is_active == True)  # noqa: E712
    search_term = q or address
    if search_term:
        query = query.filter(
            (Provider.name.ilike(f"%{search_term}%")) |
            (Provider.address.ilike(f"%{search_term}%"))
        )
    if service_name:
        from app.modules.services.models import service_providers
        provider_ids_sub = (
            db.query(service_providers.c.provider_id)
            .join(Service, Service.id == service_providers.c.service_id)
            .filter(
                Service.name.ilike(f"%{service_name}%"),
                Service.is_active == True,  # noqa: E712
            )
            .subquery()
        )
        query = query.filter(Provider.id.in_(provider_ids_sub))
    if available_date:
        from app.modules.calendar.models import WorkSlot
        provider_ids_with_slots = (
            db.query(WorkSlot.provider_id)
            .filter(
                WorkSlot.slot_date == available_date,
                WorkSlot.is_available == True,  # noqa: E712
            )
            .distinct()
            .subquery()
        )
        query = query.filter(Provider.id.in_(provider_ids_with_slots))
    if category:
        query = query.filter(Provider.category.ilike(category))
    if min_price is not None:
        query = query.filter(Provider.worker_payment_amount >= min_price)
    if max_price is not None:
        query = query.filter(Provider.worker_payment_amount <= max_price)
    if nationality:
        from app.modules.masters.models import Professional, ProfessionalProvider
        provider_ids_nat = (
            db.query(ProfessionalProvider.provider_id)
            .join(Professional, Professional.id == ProfessionalProvider.professional_id)
            .filter(Professional.nationality == nationality)
            .distinct()
            .subquery()
        )
        query = query.filter(Provider.id.in_(provider_ids_nat))
    if min_experience is not None:
        from app.modules.masters.models import Professional, ProfessionalProvider
        provider_ids_exp = (
            db.query(ProfessionalProvider.provider_id)
            .join(Professional, Professional.id == ProfessionalProvider.professional_id)
            .filter(Professional.experience_years >= min_experience)
            .distinct()
            .subquery()
        )
        query = query.filter(Provider.id.in_(provider_ids_exp))
    if lat_min is not None and lat_max is not None and lng_min is not None and lng_max is not None:
        query = query.filter(
            Provider.latitude.isnot(None),
            Provider.longitude.isnot(None),
            Provider.latitude >= lat_min,
            Provider.latitude <= lat_max,
            Provider.longitude >= lng_min,
            Provider.longitude <= lng_max,
        )
    if sort == "price_asc":
        query = query.order_by(Provider.worker_payment_amount.asc())
    elif sort == "price_desc":
        query = query.order_by(Provider.worker_payment_amount.desc())
    return query.offset(skip).limit(limit).all()


@router.get("/categories", response_model=List[str])
def get_provider_categories(db: Session = Depends(get_db)):
    """Public: return distinct non-empty categories from active providers."""
    from sqlalchemy import func
    from app.modules.salons.models import Provider as ProviderModel
    rows = (
        db.query(ProviderModel.category)
        .filter(
            ProviderModel.is_active == True,  # noqa: E712
            ProviderModel.category.isnot(None),
            ProviderModel.category != "",
        )
        .order_by(func.lower(ProviderModel.category))
        .all()
    )
    seen: set = set()
    result: list = []
    for (cat,) in rows:
        key = cat.lower()
        if key not in seen:
            seen.add(key)
            result.append(cat)
    return result


@router.get("/public", response_model=List[ProviderPublic])
def get_public_providers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    search: Optional[str] = Query(None, description="Search by name or category"),
    db: Session = Depends(get_db),
):
    """Public endpoint — lists all active service providers for client booking."""
    return list_providers(db, skip=skip, limit=limit, search=search)


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
