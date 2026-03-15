from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional, List

from app.modules.salons.models import Provider, ProviderOwner
from app.modules.salons.schemas import ProviderUpdate
from app.modules.users.models import User


def create_provider_for_owner(
    db: Session,
    owner_user: User,
    provider_name: str,
    provider_address: str,
    worker_payment_amount: float = 0.0,
) -> Provider:
    provider = Provider(
        name=provider_name,
        address=provider_address,
        worker_payment_amount=worker_payment_amount,
    )
    db.add(provider)
    db.flush()

    ownership = ProviderOwner(user_id=owner_user.id, provider_id=provider.id)
    db.add(ownership)
    db.commit()
    db.refresh(provider)
    return provider


def get_provider_by_id(db: Session, provider_id: int) -> Optional[Provider]:
    return db.query(Provider).filter(Provider.id == provider_id).first()


def get_provider_or_404(db: Session, provider_id: int) -> Provider:
    provider = get_provider_by_id(db, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


def get_owner_provider(db: Session, user: User) -> Optional[Provider]:
    ownership = db.query(ProviderOwner).filter(ProviderOwner.user_id == user.id).first()
    if not ownership:
        return None
    return ownership.provider


def list_providers(db: Session, skip: int = 0, limit: int = 50) -> List[Provider]:
    return db.query(Provider).filter(Provider.is_active == True).offset(skip).limit(limit).all()  # noqa: E712


def update_provider(db: Session, provider: Provider, data: ProviderUpdate) -> Provider:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(provider, field, value)
    db.commit()
    db.refresh(provider)
    return provider


def assert_owner_of_provider(db: Session, user: User, provider_id: int) -> Provider:
    from app.modules.users.models import UserRole
    provider = get_provider_or_404(db, provider_id)
    if user.role == UserRole.PLATFORM_ADMIN:
        return provider
    ownership = db.query(ProviderOwner).filter(
        ProviderOwner.user_id == user.id, ProviderOwner.provider_id == provider_id
    ).first()
    if not ownership:
        raise HTTPException(status_code=403, detail="Not the owner of this provider")
    return provider


# Backward-compat aliases used across the codebase
create_salon_for_owner = create_provider_for_owner
get_salon_by_id = get_provider_by_id
get_salon_or_404 = get_provider_or_404
get_owner_salon = get_owner_provider
list_salons = list_providers
update_salon = update_provider
assert_owner_of_salon = assert_owner_of_provider
