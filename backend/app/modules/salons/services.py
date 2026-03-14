from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional, List

from app.modules.salons.models import Salon, SalonOwner
from app.modules.salons.schemas import SalonCreate, SalonUpdate
from app.modules.users.models import User


def create_salon_for_owner(
    db: Session,
    owner_user: User,
    salon_name: str,
    salon_address: str,
    worker_payment_amount: float = 0.0,
) -> Salon:
    salon = Salon(
        name=salon_name,
        address=salon_address,
        worker_payment_amount=worker_payment_amount,
    )
    db.add(salon)
    db.flush()

    ownership = SalonOwner(user_id=owner_user.id, salon_id=salon.id)
    db.add(ownership)
    db.commit()
    db.refresh(salon)
    return salon


def get_salon_by_id(db: Session, salon_id: int) -> Optional[Salon]:
    return db.query(Salon).filter(Salon.id == salon_id).first()


def get_salon_or_404(db: Session, salon_id: int) -> Salon:
    salon = get_salon_by_id(db, salon_id)
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    return salon


def get_owner_salon(db: Session, user: User) -> Optional[Salon]:
    ownership = db.query(SalonOwner).filter(SalonOwner.user_id == user.id).first()
    if not ownership:
        return None
    return ownership.salon


def list_salons(db: Session, skip: int = 0, limit: int = 50) -> List[Salon]:
    return db.query(Salon).filter(Salon.is_active == True).offset(skip).limit(limit).all()


def update_salon(db: Session, salon: Salon, data: SalonUpdate) -> Salon:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(salon, field, value)
    db.commit()
    db.refresh(salon)
    return salon


def assert_owner_of_salon(db: Session, user: User, salon_id: int) -> Salon:
    from app.modules.users.models import UserRole
    salon = get_salon_or_404(db, salon_id)
    if user.role == UserRole.PLATFORM_ADMIN:
        return salon
    ownership = db.query(SalonOwner).filter(
        SalonOwner.user_id == user.id, SalonOwner.salon_id == salon_id
    ).first()
    if not ownership:
        raise HTTPException(status_code=403, detail="Not the owner of this salon")
    return salon
