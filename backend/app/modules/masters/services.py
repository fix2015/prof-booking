from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from typing import Optional, List

from app.modules.masters.models import Master, MasterSalon, MasterStatus
from app.modules.masters.schemas import MasterCreate, MasterUpdate, MasterDirectCreate
from app.modules.users.models import User, UserRole


def create_master_profile(
    db: Session,
    user: User,
    name: str,
    phone: Optional[str],
    social_links: dict,
    salon_id: Optional[int] = None,
) -> Master:
    master = Master(
        user_id=user.id,
        name=name,
        phone=phone,
        social_links=social_links or {},
    )
    db.add(master)
    db.flush()

    if salon_id:
        ms = MasterSalon(
            master_id=master.id,
            salon_id=salon_id,
            status=MasterStatus.PENDING,
        )
        db.add(ms)

    db.commit()
    db.refresh(master)
    return master


def create_master_with_user(
    db: Session,
    salon_id: int,
    data: MasterDirectCreate,
) -> MasterSalon:
    """Owner creates a new master account + immediately activates them in the salon."""
    from app.modules.users.services import create_user, get_user_by_email
    from app.modules.users.schemas import UserCreate

    if get_user_by_email(db, data.email):
        raise HTTPException(status_code=409, detail="Email already registered")

    user = create_user(
        db,
        UserCreate(
            email=data.email,
            phone=data.phone,
            password=data.password,
            role=UserRole.MASTER,
        ),
    )
    master = Master(
        user_id=user.id,
        name=data.name,
        phone=data.phone,
        bio=data.bio,
        nationality=data.nationality,
        experience_years=data.experience_years,
        social_links={},
    )
    db.add(master)
    db.flush()

    ms = MasterSalon(
        master_id=master.id,
        salon_id=salon_id,
        status=MasterStatus.ACTIVE,
        payment_amount=data.payment_amount,
        joined_at=datetime.utcnow(),
    )
    db.add(ms)
    db.commit()
    db.refresh(ms)
    return ms


def get_master_by_user_id(db: Session, user_id: int) -> Optional[Master]:
    return db.query(Master).filter(Master.user_id == user_id).first()


def get_master_by_id(db: Session, master_id: int) -> Optional[Master]:
    return db.query(Master).filter(Master.id == master_id).first()


def get_master_or_404(db: Session, master_id: int) -> Master:
    master = get_master_by_id(db, master_id)
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    return master


def list_salon_masters(
    db: Session, salon_id: int, status: Optional[MasterStatus] = MasterStatus.ACTIVE
) -> List[MasterSalon]:
    query = db.query(MasterSalon).filter(MasterSalon.salon_id == salon_id)
    if status:
        query = query.filter(MasterSalon.status == status)
    return query.all()


def approve_master(
    db: Session, salon_id: int, master_id: int, status: MasterStatus, payment_amount: Optional[float]
) -> MasterSalon:
    ms = db.query(MasterSalon).filter(
        MasterSalon.salon_id == salon_id,
        MasterSalon.master_id == master_id,
    ).first()
    if not ms:
        raise HTTPException(status_code=404, detail="Master-salon relationship not found")
    ms.status = status
    if payment_amount is not None:
        ms.payment_amount = payment_amount
    if status == MasterStatus.ACTIVE:
        ms.joined_at = datetime.utcnow()
    db.commit()
    db.refresh(ms)
    return ms


def update_master(db: Session, master: Master, data: MasterUpdate) -> Master:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(master, field, value)
    db.commit()
    db.refresh(master)
    return master


def get_master_salons(db: Session, master_id: int) -> List[MasterSalon]:
    return db.query(MasterSalon).filter(MasterSalon.master_id == master_id).all()
