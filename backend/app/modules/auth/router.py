from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.modules.auth.schemas import (
    LoginRequest, TokenResponse, RefreshRequest,
    OwnerRegisterRequest, ProfessionalRegisterRequest,
)
from app.modules.auth.services import (
    authenticate_user, create_access_token, create_refresh_token,
    refresh_access_token, revoke_all_tokens,
)
from app.modules.users.models import User, UserRole
from app.modules.users.services import create_user
from app.modules.users.schemas import UserCreate
from app.modules.salons.services import create_provider_for_owner
from app.modules.masters.services import create_professional_profile
from app.modules.masters.models import ProfessionalProvider, ProfessionalStatus
from app.modules.invites.services import consume_invite

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(db, user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        role=user.role,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    access_token, new_refresh = refresh_access_token(db, data.refresh_token)
    from app.modules.users.models import RefreshToken
    rt = db.query(RefreshToken).filter(RefreshToken.token == new_refresh).first()
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        user_id=rt.user_id,
        role=rt.user.role,
    )


@router.post("/logout", status_code=204)
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    revoke_all_tokens(db, current_user.id)


@router.post("/register/owner", response_model=TokenResponse, status_code=201)
def register_owner(data: OwnerRegisterRequest, db: Session = Depends(get_db)):
    user = create_user(
        db,
        UserCreate(
            email=data.email,
            phone=data.phone,
            password=data.password,
            role=UserRole.PROVIDER_OWNER,
        ),
    )
    create_provider_for_owner(
        db,
        owner_user=user,
        provider_name=data.provider_name,
        provider_address=data.provider_address,
        worker_payment_amount=data.worker_payment_amount,
    )
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(db, user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        role=user.role,
    )


@router.post("/register/professional", response_model=TokenResponse, status_code=201)
def register_professional(data: ProfessionalRegisterRequest, db: Session = Depends(get_db)):
    user = create_user(
        db,
        UserCreate(
            email=data.email,
            phone=data.phone,
            password=data.password,
            role=UserRole.PROFESSIONAL,
        ),
    )
    provider_id = None
    if data.invite_token:
        provider_id = consume_invite(db, data.invite_token, user)

    professional = create_professional_profile(
        db,
        user=user,
        name=data.name,
        phone=data.phone,
        social_links=data.social_links or {},
        provider_id=provider_id,
    )

    # Self-selected providers (without invite) — create PENDING requests
    for pid in (data.provider_ids or []):
        if pid == provider_id:
            continue  # already handled via invite
        existing = db.query(ProfessionalProvider).filter(
            ProfessionalProvider.professional_id == professional.id,
            ProfessionalProvider.provider_id == pid,
        ).first()
        if not existing:
            db.add(ProfessionalProvider(
                professional_id=professional.id,
                provider_id=pid,
                status=ProfessionalStatus.PENDING,
            ))
    db.commit()
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(db, user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        role=user.role,
    )


# Backward-compat alias — keeps old /register/master endpoint working
@router.post("/register/master", response_model=TokenResponse, status_code=201, include_in_schema=False)
def register_master(data: ProfessionalRegisterRequest, db: Session = Depends(get_db)):
    return register_professional(data, db)
