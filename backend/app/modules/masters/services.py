from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from typing import Optional, List

from app.modules.masters.models import Professional, ProfessionalProvider, ProfessionalStatus
from app.modules.masters.schemas import ProfessionalUpdate, ProfessionalDirectCreate
from app.modules.users.models import User, UserRole


def create_professional_profile(
    db: Session,
    user: User,
    name: str,
    phone: Optional[str],
    social_links: dict,
    provider_id: Optional[int] = None,
) -> Professional:
    professional = Professional(
        user_id=user.id,
        name=name,
        phone=phone,
        social_links=social_links or {},
    )
    db.add(professional)
    db.flush()

    if provider_id:
        pp = ProfessionalProvider(
            professional_id=professional.id,
            provider_id=provider_id,
            status=ProfessionalStatus.PENDING,
        )
        db.add(pp)

    db.commit()
    db.refresh(professional)
    return professional


def create_professional_with_user(
    db: Session,
    provider_id: int,
    data: ProfessionalDirectCreate,
) -> ProfessionalProvider:
    """Owner creates a new professional account + immediately activates them at the provider."""
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
            role=UserRole.PROFESSIONAL,
        ),
    )
    professional = Professional(
        user_id=user.id,
        name=data.name,
        phone=data.phone,
        bio=data.bio,
        nationality=data.nationality,
        experience_years=data.experience_years,
        social_links={},
    )
    db.add(professional)
    db.flush()

    pp = ProfessionalProvider(
        professional_id=professional.id,
        provider_id=provider_id,
        status=ProfessionalStatus.ACTIVE,
        payment_amount=data.payment_amount,
        joined_at=datetime.utcnow(),
    )
    db.add(pp)
    db.commit()
    # Reload with professional relationship so the response serializes correctly
    from sqlalchemy.orm import joinedload
    return (
        db.query(ProfessionalProvider)
        .options(joinedload(ProfessionalProvider.professional))
        .filter(ProfessionalProvider.id == pp.id)
        .one()
    )


def get_professional_by_user_id(db: Session, user_id: int) -> Optional[Professional]:
    return db.query(Professional).filter(Professional.user_id == user_id).first()


def get_professional_by_id(db: Session, professional_id: int) -> Optional[Professional]:
    return db.query(Professional).filter(Professional.id == professional_id).first()


def get_professional_or_404(db: Session, professional_id: int) -> Professional:
    professional = get_professional_by_id(db, professional_id)
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    return professional


def list_provider_professionals(
    db: Session, provider_id: int, status: Optional[ProfessionalStatus] = None
) -> List[ProfessionalProvider]:
    from sqlalchemy.orm import joinedload
    query = (
        db.query(ProfessionalProvider)
        .options(joinedload(ProfessionalProvider.professional))
        .filter(ProfessionalProvider.provider_id == provider_id)
    )
    if status:
        query = query.filter(ProfessionalProvider.status == status)
    return query.all()


def approve_professional(
    db: Session, provider_id: int, professional_id: int,
    status: ProfessionalStatus, payment_amount: Optional[float]
) -> ProfessionalProvider:
    pp = db.query(ProfessionalProvider).filter(
        ProfessionalProvider.provider_id == provider_id,
        ProfessionalProvider.professional_id == professional_id,
    ).first()
    if not pp:
        raise HTTPException(status_code=404, detail="Professional-provider relationship not found")
    pp.status = status
    if payment_amount is not None:
        pp.payment_amount = payment_amount
    if status == ProfessionalStatus.ACTIVE:
        pp.joined_at = datetime.utcnow()
    db.commit()
    db.refresh(pp)
    return pp


def update_professional(db: Session, professional: Professional, data: ProfessionalUpdate) -> Professional:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(professional, field, value)
    db.commit()
    db.refresh(professional)
    return professional


def get_professional_providers(db: Session, professional_id: int) -> List[ProfessionalProvider]:
    return db.query(ProfessionalProvider).filter(
        ProfessionalProvider.professional_id == professional_id
    ).all()


# Backward-compat aliases used by other modules
create_master_profile = create_professional_profile
create_master_with_user = create_professional_with_user
get_master_by_user_id = get_professional_by_user_id
get_master_by_id = get_professional_by_id
get_master_or_404 = get_professional_or_404
list_salon_masters = list_provider_professionals
approve_master = approve_professional
update_master = update_professional
get_master_salons = get_professional_providers
