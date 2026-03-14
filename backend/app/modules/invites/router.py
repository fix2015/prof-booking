from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_owner
from app.modules.invites.schemas import InviteCreate, InviteResponse, InviteValidation
from app.modules.invites.services import (
    create_invite, list_salon_invites, revoke_invite, validate_invite_token,
)
from app.modules.salons.services import assert_owner_of_salon
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
            salon_id=invite.salon_id,
            invited_email=invite.invited_email,
        )
    except Exception:
        return InviteValidation(token=token, is_valid=False, salon_id=None, invited_email=None)


@router.get("/salon/{salon_id}", response_model=List[InviteResponse])
def get_salon_invites(
    salon_id: int,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_salon(db, current_user, salon_id)
    return list_salon_invites(db, salon_id)


@router.post("/salon/{salon_id}", response_model=InviteResponse, status_code=201)
def send_invite(
    salon_id: int,
    data: InviteCreate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_salon(db, current_user, salon_id)
    return create_invite(db, salon_id, data, current_user)


@router.delete("/{invite_id}/salon/{salon_id}", status_code=204)
def revoke_invite_endpoint(
    invite_id: int,
    salon_id: int,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_salon(db, current_user, salon_id)
    revoke_invite(db, invite_id, salon_id)
