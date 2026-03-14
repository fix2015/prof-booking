from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_user, get_current_owner
from app.modules.masters.schemas import (
    MasterResponse, MasterUpdate, MasterSalonResponse,
    MasterApprovalRequest, MasterPublic,
)
from app.modules.masters.services import (
    list_salon_masters, get_master_or_404, approve_master,
    update_master, get_master_by_user_id, get_master_salons,
)
from app.modules.masters.models import MasterStatus
from app.modules.salons.services import assert_owner_of_salon
from app.modules.users.models import User

router = APIRouter()


@router.get("/me", response_model=MasterResponse)
def get_my_master_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    master = get_master_by_user_id(db, current_user.id)
    if not master:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Master profile not found")
    return master


@router.patch("/me", response_model=MasterResponse)
def update_my_master_profile(
    data: MasterUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    master = get_master_by_user_id(db, current_user.id)
    if not master:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Master profile not found")
    return update_master(db, master, data)


@router.get("/salon/{salon_id}", response_model=List[MasterSalonResponse])
def get_salon_masters(
    salon_id: int,
    status: Optional[MasterStatus] = Query(MasterStatus.ACTIVE),
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_salon(db, current_user, salon_id)
    return list_salon_masters(db, salon_id, status)


@router.get("/salon/{salon_id}/public", response_model=List[MasterPublic])
def get_salon_masters_public(
    salon_id: int,
    db: Session = Depends(get_db),
):
    """Public endpoint for booking page."""
    master_salons = list_salon_masters(db, salon_id, MasterStatus.ACTIVE)
    return [ms.master for ms in master_salons]


@router.patch("/salon/{salon_id}/{master_id}/approval", response_model=MasterSalonResponse)
def approve_or_reject_master(
    salon_id: int,
    master_id: int,
    data: MasterApprovalRequest,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_salon(db, current_user, salon_id)
    return approve_master(db, salon_id, master_id, data.status, data.payment_amount)


@router.get("/{master_id}", response_model=MasterResponse)
def get_master(
    master_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_master_or_404(db, master_id)


@router.get("/{master_id}/salons", response_model=List[MasterSalonResponse])
def get_master_salon_list(
    master_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_master_salons(db, master_id)
