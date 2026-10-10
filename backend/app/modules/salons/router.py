from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date as date_type, time as time_type
import math

from sqlalchemy import and_, func

from app.database import get_db
from app.dependencies import get_current_owner, get_current_admin
from app.modules.salons.schemas import ProviderCreate, ProviderResponse, ProviderUpdate, ProviderPublic
from app.modules.salons.services import (
    list_providers, get_provider_or_404, update_provider, assert_owner_of_provider,
    create_provider_for_owner, get_owner_provider,
)
from app.modules.users.models import User
from app.modules.reviews.services import attach_ratings

router = APIRouter()


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


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
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="Minimum average rating (visible reviews)"),
    open_now: bool = Query(False, description="Only providers with a work slot covering now_date/now_time"),
    now_date: Optional[date_type] = Query(None, description="Caller's local date for open_now"),
    now_time: Optional[time_type] = Query(None, description="Caller's local time for open_now"),
    lat: Optional[float] = Query(None, ge=-90, le=90, description="Caller's latitude (distance filter / nearest sort)"),
    lng: Optional[float] = Query(None, ge=-180, le=180, description="Caller's longitude"),
    radius_km: Optional[float] = Query(None, gt=0, le=500, description="Only providers within this distance"),
    skip: int = Query(0, ge=0),
    limit: int = Query(24, le=100),
    db: Session = Depends(get_db),
):
    """Public: search providers by name, address, professional name, and/or service offered."""
    from app.modules.salons.models import Provider
    from app.modules.services.models import Service
    from app.modules.masters.models import Professional, ProfessionalProvider

    query = db.query(Provider).filter(Provider.is_active == True)  # noqa: E712
    search_term = q or address
    if search_term:
        # Split into words and require ALL words to match (across name, address, or professional name)
        words = search_term.strip().split()
        for word in words:
            w = f"%{word}%"
            # Provider has a matching professional?
            prof_provider_ids = (
                db.query(ProfessionalProvider.provider_id)
                .join(Professional, Professional.id == ProfessionalProvider.professional_id)
                .filter(Professional.name.ilike(w))
                .subquery()
            )
            query = query.filter(
                (Provider.name.ilike(w)) |
                (Provider.address.ilike(w)) |
                (Provider.id.in_(prof_provider_ids))
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
        from app.modules.services.models import Service, service_providers
        provider_ids_cat = (
            db.query(service_providers.c.provider_id)
            .join(Service, Service.id == service_providers.c.service_id)
            .filter(Service.name.ilike(f"%{category}%"), Service.is_active == True)  # noqa: E712
            .distinct()
            .subquery()
        )
        query = query.filter(Provider.id.in_(provider_ids_cat))
    if min_price is not None or max_price is not None:
        # A provider matches when one of its active services (or its base price) falls inside the range
        from app.modules.services.models import service_providers
        price_conds = [Service.is_active == True]  # noqa: E712
        base_conds = []
        if min_price is not None:
            price_conds.append(Service.price >= min_price)
            base_conds.append(Provider.worker_payment_amount >= min_price)
        if max_price is not None:
            price_conds.append(Service.price <= max_price)
            base_conds.append(Provider.worker_payment_amount <= max_price)
        priced_ids = (
            db.query(service_providers.c.provider_id)
            .join(Service, Service.id == service_providers.c.service_id)
            .filter(*price_conds)
            .subquery()
        )
        query = query.filter(
            Provider.id.in_(db.query(priced_ids.c.provider_id))
            | (and_(Provider.worker_payment_amount > 0, *base_conds))
        )
    if min_rating:
        from app.modules.reviews.models import Review
        from app.modules.reviews.services import visible
        rated_ids = (
            visible(db, db.query(Review.provider_id))
            .group_by(Review.provider_id)
            .having(func.avg(Review.rating) >= min_rating)
            .subquery()
        )
        query = query.filter(Provider.id.in_(db.query(rated_ids.c.provider_id)))
    if open_now and now_date and now_time:
        from app.modules.calendar.models import WorkSlot
        open_ids = (
            db.query(WorkSlot.provider_id)
            .filter(
                WorkSlot.slot_date == now_date,
                WorkSlot.is_available == True,  # noqa: E712
                WorkSlot.start_time <= now_time,
                WorkSlot.end_time > now_time,
            )
            .distinct()
            .subquery()
        )
        query = query.filter(Provider.id.in_(db.query(open_ids.c.provider_id)))
    dist_sq = None
    if lat is not None and lng is not None:
        # Equirectangular approximation in km² — accurate to <1% at city scale and portable (SQLite/Postgres)
        kx = 111.32 * math.cos(math.radians(lat))
        dist_sq = (
            (Provider.latitude - lat) * 111.32 * (Provider.latitude - lat) * 111.32
            + (Provider.longitude - lng) * kx * (Provider.longitude - lng) * kx
        )
        if radius_km:
            query = query.filter(
                Provider.latitude.isnot(None), Provider.longitude.isnot(None), dist_sq <= radius_km * radius_km,
            )
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
        query = query.order_by(Provider.worker_payment_amount.asc(), Provider.id)
    elif sort == "price_desc":
        query = query.order_by(Provider.worker_payment_amount.desc(), Provider.id)
    elif sort == "top_rated":
        from app.modules.reviews.models import Review
        from app.modules.reviews.services import visible
        avg_sub = (
            visible(db, db.query(Review.provider_id.label("pid"), func.avg(Review.rating).label("avg")))
            .group_by(Review.provider_id)
            .subquery()
        )
        query = query.outerjoin(avg_sub, avg_sub.c.pid == Provider.id).order_by(
            func.coalesce(avg_sub.c.avg, 0).desc(), Provider.id
        )
    elif dist_sq is not None:  # "nearest" (default) when the caller's location is known
        query = query.order_by(Provider.latitude.is_(None), dist_sq, Provider.id)
    providers = attach_ratings(db, query.offset(skip).limit(limit).all())
    if lat is not None and lng is not None:
        for p in providers:
            p.distance_km = (
                round(haversine_km(lat, lng, p.latitude, p.longitude), 2)
                if p.latitude is not None and p.longitude is not None else None
            )
    return providers


@router.get("/categories", response_model=List[str])
def get_provider_categories(db: Session = Depends(get_db)):
    """Public: return distinct active service names across all providers."""
    from sqlalchemy import func
    from app.modules.services.models import Service
    rows = (
        db.query(Service.name)
        .filter(Service.is_active == True)  # noqa: E712
        .order_by(func.lower(Service.name))
        .all()
    )
    seen: set = set()
    result: list = []
    for (name,) in rows:
        key = name.lower()
        if key not in seen:
            seen.add(key)
            result.append(name)
    return result


@router.get("/public", response_model=List[ProviderPublic])
def get_public_providers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    search: Optional[str] = Query(None, description="Search by name or category"),
    ids: Optional[str] = Query(None, description="Comma-separated provider ids (e.g. a client's favourites)"),
    db: Session = Depends(get_db),
):
    """Public endpoint — lists all active service providers for client booking."""
    if ids is not None:
        from fastapi import HTTPException
        from app.modules.salons.models import Provider
        try:
            wanted = [int(x) for x in ids.split(",") if x.strip()][:100]
        except ValueError:
            raise HTTPException(status_code=422, detail="ids must be comma-separated integers")
        found = {p.id: p for p in db.query(Provider).filter(Provider.id.in_(wanted), Provider.is_active == True).all()}  # noqa: E712
        return attach_ratings(db, [found[i] for i in wanted if i in found])
    return attach_ratings(db, list_providers(db, skip=skip, limit=limit, search=search))


@router.get("/public/{provider_id}", response_model=ProviderPublic)
def get_public_provider(provider_id: int, db: Session = Depends(get_db)):
    return attach_ratings(db, get_provider_or_404(db, provider_id))


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
