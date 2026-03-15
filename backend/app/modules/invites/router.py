from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_owner
from app.modules.invites.schemas import InviteCreate, InviteResponse, InviteValidation
from app.modules.invites.services import (
    create_invite, list_provider_invites, revoke_invite, validate_invite_token,
)
from app.modules.salons.services import assert_owner_of_provider
from app.modules.users.models import User

router = APIRouter()


@router.get("/validate/{token}", response_model=InviteValidation)
def validate_token(token: str, db: Session = Depends(get_db)):
    """Public endpoint to validate an invite token."""
    try:
        invite = validate_invite_token(db, token)
        return InviteValidation(
            token=token,
            is_valid=True,
            provider_id=invite.provider_id,
            invited_email=invite.invited_email,
        )
    except Exception:
        return InviteValidation(token=token, is_valid=False, provider_id=None, invited_email=None)


@router.get("/provider/{provider_id}", response_model=List[InviteResponse])
def get_provider_invites(
    provider_id: int,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_provider(db, current_user, provider_id)
    return list_provider_invites(db, provider_id)


@router.post("/provider/{provider_id}", response_model=InviteResponse, status_code=201)
def send_invite(
    provider_id: int,
    data: InviteCreate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_provider(db, current_user, provider_id)
    return create_invite(db, provider_id, data, current_user)


@router.delete("/{invite_id}/provider/{provider_id}", status_code=204)
def revoke_invite_endpoint(
    invite_id: int,
    provider_id: int,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_provider(db, current_user, provider_id)
    revoke_invite(db, invite_id, provider_id)
