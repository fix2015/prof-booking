from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.modules.auth.schemas import (
    LoginRequest, TokenResponse, RefreshRequest,
    OwnerRegisterRequest, MasterRegisterRequest,
)
from app.modules.auth.services import (
    authenticate_user, create_access_token, create_refresh_token,
    refresh_access_token, revoke_all_tokens,
)
from app.modules.users.models import User, UserRole
from app.modules.users.services import create_user, get_user_by_email
from app.modules.users.schemas import UserCreate
from app.modules.salons.services import create_salon_for_owner
from app.modules.masters.services import create_master_profile
from app.modules.masters.models import MasterSalon, MasterStatus
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
            role=UserRole.SALON_OWNER,
        ),
    )
    create_salon_for_owner(
        db,
        owner_user=user,
        salon_name=data.salon_name,
        salon_address=data.salon_address,
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


@router.post("/register/master", response_model=TokenResponse, status_code=201)
def register_master(data: MasterRegisterRequest, db: Session = Depends(get_db)):
    user = create_user(
        db,
        UserCreate(
            email=data.email,
            phone=data.phone,
            password=data.password,
            role=UserRole.MASTER,
        ),
    )
    salon_id = None
    if data.invite_token:
        salon_id = consume_invite(db, data.invite_token, user)

    master = create_master_profile(
        db,
        user=user,
        name=data.name,
        phone=data.phone,
        social_links=data.social_links or {},
        salon_id=salon_id,
    )

    # Self-selected salons (without invite) — create PENDING requests
    for sid in (data.salon_ids or []):
        if sid == salon_id:
            continue  # already handled via invite
        existing = db.query(MasterSalon).filter(
            MasterSalon.master_id == master.id,
            MasterSalon.salon_id == sid,
        ).first()
        if not existing:
            db.add(MasterSalon(
                master_id=master.id,
                salon_id=sid,
                status=MasterStatus.PENDING,
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
