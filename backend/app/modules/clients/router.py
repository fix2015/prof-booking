from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session as DBSession
from typing import Optional, List

from app.database import get_db
from app.dependencies import get_current_admin, get_current_professional_or_owner
from app.modules.users.models import User, UserRole
from app.modules.masters.models import Professional, ProfessionalProvider, ProfessionalStatus
from app.modules.salons.models import ProviderOwner
from app.modules.clients import services
from app.modules.clients.schemas import (
    ClientListItem, ClientDetailResponse, ClientProfileUpdate,
    ClientNoteCreate, ClientNoteUpdate, ClientNoteResponse,
    ClientPhotoCreate, ClientPhotoResponse,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_professional(db: DBSession, user: User) -> Optional[Professional]:
    return db.query(Professional).filter(Professional.user_id == user.id).first()


def _get_provider_id(db: DBSession, user: User) -> Optional[int]:
    ownership = db.query(ProviderOwner).filter(ProviderOwner.user_id == user.id).first()
    return ownership.provider_id if ownership else None


def _get_provider_id_for_professional(db: DBSession, professional_id: int) -> Optional[int]:
    pp = db.query(ProfessionalProvider).filter(
        ProfessionalProvider.professional_id == professional_id,
        ProfessionalProvider.status == ProfessionalStatus.ACTIVE,
    ).first()
    return pp.provider_id if pp else None


# ---------------------------------------------------------------------------
# Client list
# ---------------------------------------------------------------------------

@router.get("/", response_model=List[ClientListItem])
def list_clients(
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_professional_or_owner),
):
    if current_user.role == UserRole.PLATFORM_ADMIN:
        return services.list_all_clients(db, search, skip, limit)
    if current_user.role == UserRole.PROVIDER_OWNER:
        provider_id = _get_provider_id(db, current_user)
        if not provider_id:
            return []
        return services.list_clients_for_provider(db, provider_id, search, skip, limit)
    # PROFESSIONAL
    professional = _get_professional(db, current_user)
    if not professional:
        return []
    return services.list_clients_for_professional(db, professional.id, search, skip, limit)


# ---------------------------------------------------------------------------
# Lookup by phone (must come before /{client_id} to avoid routing ambiguity)
# ---------------------------------------------------------------------------

@router.get("/lookup", response_model=ClientDetailResponse)
def lookup_client_by_phone(
    phone: str = Query(..., description="Client phone number"),
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_professional_or_owner),
):
    """Find (or auto-create) a client profile by phone number."""
    # Verify caller has a session with this phone
    is_admin = current_user.role == UserRole.PLATFORM_ADMIN
    professional_id = None
    provider_id = None

    if not is_admin:
        if current_user.role == UserRole.PROVIDER_OWNER:
            provider_id = _get_provider_id(db, current_user)
        else:
            prof = _get_professional(db, current_user)
            if prof:
                professional_id = prof.id

    # Auto-create profile if missing
    from app.modules.clients.services import _ensure_profiles_exist
    _ensure_profiles_exist(db, [phone])

    from app.modules.clients.models import ClientProfile as CP
    client = db.query(CP).filter(CP.phone == phone).first()
    if not client:
        raise HTTPException(status_code=404, detail="No client found with this phone")

    return services.get_client_detail(db, client.id, professional_id, provider_id, is_admin)


# ---------------------------------------------------------------------------
# Client detail
# ---------------------------------------------------------------------------

@router.get("/{client_id}", response_model=ClientDetailResponse)
def get_client(
    client_id: int,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_professional_or_owner),
):
    is_admin = current_user.role == UserRole.PLATFORM_ADMIN
    professional_id = None
    provider_id = None

    if not is_admin:
        if current_user.role == UserRole.PROVIDER_OWNER:
            provider_id = _get_provider_id(db, current_user)
        else:
            prof = _get_professional(db, current_user)
            if prof:
                professional_id = prof.id

    return services.get_client_detail(db, client_id, professional_id, provider_id, is_admin)


@router.patch("/{client_id}", response_model=ClientDetailResponse)
def update_client(
    client_id: int,
    data: ClientProfileUpdate,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_professional_or_owner),
):
    services.update_client(db, client_id, data)
    is_admin = current_user.role == UserRole.PLATFORM_ADMIN
    professional_id = None
    provider_id = None
    if not is_admin:
        if current_user.role == UserRole.PROVIDER_OWNER:
            provider_id = _get_provider_id(db, current_user)
        else:
            prof = _get_professional(db, current_user)
            if prof:
                professional_id = prof.id
    return services.get_client_detail(db, client_id, professional_id, provider_id, is_admin)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: int,
    db: DBSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    services.delete_client(db, client_id)


# ---------------------------------------------------------------------------
# Notes (professionals only)
# ---------------------------------------------------------------------------

@router.post("/{client_id}/notes", response_model=ClientNoteResponse, status_code=status.HTTP_201_CREATED)
def add_note(
    client_id: int,
    data: ClientNoteCreate,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_professional_or_owner),
):
    if current_user.role not in (UserRole.PROFESSIONAL, UserRole.PLATFORM_ADMIN):
        raise HTTPException(status_code=403, detail="Only professionals can add client notes")
    professional = _get_professional(db, current_user)
    if not professional:
        raise HTTPException(status_code=403, detail="Professional profile not found")
    provider_id = _get_provider_id_for_professional(db, professional.id)
    return services.add_note(db, client_id, professional.id, provider_id, data)


@router.patch("/{client_id}/notes/{note_id}", response_model=ClientNoteResponse)
def update_note(
    client_id: int,
    note_id: int,
    data: ClientNoteUpdate,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_professional_or_owner),
):
    if current_user.role not in (UserRole.PROFESSIONAL, UserRole.PLATFORM_ADMIN):
        raise HTTPException(status_code=403, detail="Only professionals can edit client notes")
    professional = _get_professional(db, current_user)
    if not professional:
        raise HTTPException(status_code=403, detail="Professional profile not found")
    return services.update_note(db, note_id, professional.id, data)


@router.delete("/{client_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    client_id: int,
    note_id: int,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_professional_or_owner),
):
    if current_user.role not in (UserRole.PROFESSIONAL, UserRole.PLATFORM_ADMIN):
        raise HTTPException(status_code=403, detail="Only professionals can delete client notes")
    professional = _get_professional(db, current_user)
    if not professional:
        raise HTTPException(status_code=403, detail="Professional profile not found")
    services.delete_note(db, note_id, professional.id)


# ---------------------------------------------------------------------------
# Photos (professionals only)
# ---------------------------------------------------------------------------

@router.post("/{client_id}/photos", response_model=ClientPhotoResponse, status_code=status.HTTP_201_CREATED)
def add_photo(
    client_id: int,
    data: ClientPhotoCreate,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_professional_or_owner),
):
    if current_user.role not in (UserRole.PROFESSIONAL, UserRole.PLATFORM_ADMIN):
        raise HTTPException(status_code=403, detail="Only professionals can add client photos")
    professional = _get_professional(db, current_user)
    if not professional:
        raise HTTPException(status_code=403, detail="Professional profile not found")
    provider_id = _get_provider_id_for_professional(db, professional.id)
    return services.add_photo(db, client_id, professional.id, provider_id, data)


@router.delete("/{client_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(
    client_id: int,
    photo_id: int,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_professional_or_owner),
):
    if current_user.role not in (UserRole.PROFESSIONAL, UserRole.PLATFORM_ADMIN):
        raise HTTPException(status_code=403, detail="Only professionals can delete client photos")
    professional = _get_professional(db, current_user)
    if not professional:
        raise HTTPException(status_code=403, detail="Professional profile not found")
    services.delete_photo(db, photo_id, professional.id)
