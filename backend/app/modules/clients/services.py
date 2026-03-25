from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func, desc
from typing import Optional, List

from fastapi import HTTPException

from app.modules.clients.models import ClientProfile, ClientNote, ClientPhoto
from app.modules.clients.schemas import (
    ClientProfileUpdate, ClientNoteCreate, ClientNoteUpdate, ClientPhotoCreate,
    ClientListItem, ClientDetailResponse, ClientNoteResponse, ClientPhotoResponse, SessionSummary,
)
from app.modules.sessions.models import Session as BookingSession


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_or_create(db: DBSession, phone: str, name: str, email: Optional[str] = None) -> ClientProfile:
    client = db.query(ClientProfile).filter(ClientProfile.phone == phone).first()
    if not client:
        client = ClientProfile(phone=phone, name=name, email=email)
        db.add(client)
        db.commit()
        db.refresh(client)
    return client


def _ensure_profiles_exist(db: DBSession, phones: List[str], provider_id: Optional[int] = None, professional_id: Optional[int] = None) -> None:
    """Auto-create ClientProfile entries for phones that don't have one yet, using latest session data."""
    if not phones:
        return
    existing = {c.phone for c in db.query(ClientProfile.phone).filter(ClientProfile.phone.in_(phones)).all()}
    missing = [p for p in phones if p not in existing]
    if not missing:
        return

    # Get latest session per phone to seed the name/email
    subq = (
        db.query(
            BookingSession.client_phone,
            func.max(BookingSession.id).label("max_id"),
        )
        .filter(BookingSession.client_phone.in_(missing))
        .group_by(BookingSession.client_phone)
        .subquery()
    )
    sessions = (
        db.query(BookingSession)
        .join(subq, BookingSession.id == subq.c.max_id)
        .all()
    )
    for s in sessions:
        if s.client_phone not in existing:
            db.add(ClientProfile(phone=s.client_phone, name=s.client_name, email=s.client_email))
    db.commit()


def _build_stats(db: DBSession, phone: str, filters: list) -> dict:
    row = db.query(
        func.count(BookingSession.id).label("total"),
        func.max(BookingSession.starts_at).label("last_visit"),
        func.coalesce(func.sum(BookingSession.total_paid), 0.0).label("spent"),
    ).filter(
        BookingSession.client_phone == phone,
        *filters,
    ).first()
    return {
        "total_visits": row.total or 0,
        "last_visit_at": row.last_visit,
        "total_spent": float(row.spent or 0.0),
    }


def _require_client(db: DBSession, client_id: int) -> ClientProfile:
    client = db.query(ClientProfile).filter(ClientProfile.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


# ---------------------------------------------------------------------------
# List endpoints
# ---------------------------------------------------------------------------

def list_clients_for_professional(
    db: DBSession, professional_id: int, search: Optional[str] = None, skip: int = 0, limit: int = 50
) -> List[ClientListItem]:
    phones = [
        r[0] for r in db.query(BookingSession.client_phone)
        .filter(BookingSession.professional_id == professional_id)
        .distinct().all()
    ]
    _ensure_profiles_exist(db, phones, professional_id=professional_id)

    q = db.query(ClientProfile).filter(ClientProfile.phone.in_(phones))
    if search:
        q = q.filter(
            (ClientProfile.name.ilike(f"%{search}%")) | (ClientProfile.phone.ilike(f"%{search}%"))
        )
    clients = q.offset(skip).limit(limit).all()

    stat_filter = [BookingSession.professional_id == professional_id]
    return [
        ClientListItem(
            **{k: getattr(c, k) for k in ("id", "phone", "name", "email", "avatar_url", "tags")},
            **_build_stats(db, c.phone, stat_filter),
        )
        for c in clients
    ]


def list_clients_for_provider(
    db: DBSession, provider_id: int, search: Optional[str] = None, skip: int = 0, limit: int = 50
) -> List[ClientListItem]:
    phones = [
        r[0] for r in db.query(BookingSession.client_phone)
        .filter(BookingSession.provider_id == provider_id)
        .distinct().all()
    ]
    _ensure_profiles_exist(db, phones, provider_id=provider_id)

    q = db.query(ClientProfile).filter(ClientProfile.phone.in_(phones))
    if search:
        q = q.filter(
            (ClientProfile.name.ilike(f"%{search}%")) | (ClientProfile.phone.ilike(f"%{search}%"))
        )
    clients = q.offset(skip).limit(limit).all()

    stat_filter = [BookingSession.provider_id == provider_id]
    return [
        ClientListItem(
            **{k: getattr(c, k) for k in ("id", "phone", "name", "email", "avatar_url", "tags")},
            **_build_stats(db, c.phone, stat_filter),
        )
        for c in clients
    ]


def list_all_clients(
    db: DBSession, search: Optional[str] = None, skip: int = 0, limit: int = 50
) -> List[ClientListItem]:
    q = db.query(ClientProfile)
    if search:
        q = q.filter(
            (ClientProfile.name.ilike(f"%{search}%")) | (ClientProfile.phone.ilike(f"%{search}%"))
        )
    clients = q.offset(skip).limit(limit).all()

    return [
        ClientListItem(
            **{k: getattr(c, k) for k in ("id", "phone", "name", "email", "avatar_url", "tags")},
            **_build_stats(db, c.phone, []),
        )
        for c in clients
    ]


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------

def get_client_detail(
    db: DBSession,
    client_id: int,
    professional_id: Optional[int],
    provider_id: Optional[int],
    is_admin: bool,
) -> ClientDetailResponse:
    client = _require_client(db, client_id)

    # Session history visible to caller
    session_q = db.query(BookingSession).filter(BookingSession.client_phone == client.phone)
    stats_filters = [BookingSession.client_phone == client.phone]
    if not is_admin:
        if professional_id:
            session_q = session_q.filter(BookingSession.professional_id == professional_id)
            stats_filters.append(BookingSession.professional_id == professional_id)
        elif provider_id:
            session_q = session_q.filter(BookingSession.provider_id == provider_id)
            stats_filters.append(BookingSession.provider_id == provider_id)

    sessions = session_q.order_by(desc(BookingSession.starts_at)).limit(10).all()

    row = db.query(
        func.count(BookingSession.id),
        func.max(BookingSession.starts_at),
        func.coalesce(func.sum(BookingSession.total_paid), 0.0),
    ).filter(*stats_filters).first()

    # Notes — professional sees their own; provider sees all from their provider; admin sees all
    notes_q = db.query(ClientNote).filter(ClientNote.client_id == client_id)
    if not is_admin:
        if professional_id:
            notes_q = notes_q.filter(ClientNote.professional_id == professional_id)
        elif provider_id:
            notes_q = notes_q.filter(ClientNote.provider_id == provider_id)
    my_notes = notes_q.order_by(desc(ClientNote.created_at)).all()

    # Photos — same visibility
    photos_q = db.query(ClientPhoto).filter(ClientPhoto.client_id == client_id)
    if not is_admin:
        if professional_id:
            photos_q = photos_q.filter(ClientPhoto.professional_id == professional_id)
        elif provider_id:
            photos_q = photos_q.filter(ClientPhoto.provider_id == provider_id)
    my_photos = photos_q.order_by(desc(ClientPhoto.created_at)).all()

    recent_sessions = [
        SessionSummary(
            id=s.id,
            starts_at=s.starts_at,
            service_name=s.service.name if s.service else None,
            professional_name=s.professional.name if s.professional else None,
            status=s.status.value,
            price=s.price,
        )
        for s in sessions
    ]

    return ClientDetailResponse(
        id=client.id,
        phone=client.phone,
        name=client.name,
        email=client.email,
        birth_date=client.birth_date,
        avatar_url=client.avatar_url,
        tags=client.tags,
        created_at=client.created_at,
        my_notes=[ClientNoteResponse.model_validate(n) for n in my_notes],
        my_photos=[ClientPhotoResponse.model_validate(p) for p in my_photos],
        total_visits=row[0] or 0,
        last_visit_at=row[1],
        total_spent=float(row[2] or 0.0),
        recent_sessions=recent_sessions,
    )


# ---------------------------------------------------------------------------
# Mutations
# ---------------------------------------------------------------------------

def update_client(db: DBSession, client_id: int, data: ClientProfileUpdate) -> ClientProfile:
    client = _require_client(db, client_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(client, field, value)
    db.commit()
    db.refresh(client)
    return client


def add_note(
    db: DBSession, client_id: int, professional_id: int, provider_id: Optional[int], data: ClientNoteCreate
) -> ClientNote:
    _require_client(db, client_id)
    note = ClientNote(
        client_id=client_id,
        professional_id=professional_id,
        provider_id=provider_id,
        title=data.title,
        content=data.content,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def update_note(db: DBSession, note_id: int, professional_id: int, data: ClientNoteUpdate) -> ClientNote:
    note = db.query(ClientNote).filter(
        ClientNote.id == note_id, ClientNote.professional_id == professional_id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(note, field, value)
    db.commit()
    db.refresh(note)
    return note


def delete_note(db: DBSession, note_id: int, professional_id: int) -> None:
    note = db.query(ClientNote).filter(
        ClientNote.id == note_id, ClientNote.professional_id == professional_id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()


def add_photo(
    db: DBSession, client_id: int, professional_id: int, provider_id: Optional[int], data: ClientPhotoCreate
) -> ClientPhoto:
    _require_client(db, client_id)
    photo = ClientPhoto(
        client_id=client_id,
        professional_id=professional_id,
        provider_id=provider_id,
        url=data.url,
        caption=data.caption,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


def delete_photo(db: DBSession, photo_id: int, professional_id: int) -> None:
    photo = db.query(ClientPhoto).filter(
        ClientPhoto.id == photo_id, ClientPhoto.professional_id == professional_id
    ).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    db.delete(photo)
    db.commit()


def delete_client(db: DBSession, client_id: int) -> None:
    client = _require_client(db, client_id)
    db.delete(client)
    db.commit()
