from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_master_or_owner, get_current_user
from app.modules.notifications.models import Notification, NotificationStatus
from app.modules.notifications.models import NotificationPreference
from app.modules.notifications.schemas import (
    NotificationResponse, NotificationPreferenceResponse, NotificationPreferenceUpdate,
    PushSubscriptionRequest, PushUnsubscribeRequest,
)
from app.modules.sessions.models import Session as SessionModel
from app.modules.users.models import User, UserRole

router = APIRouter()


@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
    session_id: Optional[int] = Query(None),
    status: Optional[NotificationStatus] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_master_or_owner),
    db: Session = Depends(get_db),
):
    query = db.query(Notification).join(
        SessionModel, Notification.session_id == SessionModel.id, isouter=True
    )

    if current_user.role == UserRole.PROVIDER_OWNER:
        # Filter to notifications for sessions belonging to the owner's provider
        provider_owner = current_user.provider_owner
        if provider_owner:
            query = query.filter(SessionModel.provider_id == provider_owner.provider_id)
        else:
            return []
    elif current_user.role == UserRole.PROFESSIONAL:
        # professional_id on Session refers to professionals.id, not users.id
        from app.modules.masters.models import Professional
        prof = db.query(Professional).filter(Professional.user_id == current_user.id).first()
        if not prof:
            return []
        query = query.filter(SessionModel.professional_id == prof.id)
    # PLATFORM_ADMIN sees all

    if session_id:
        query = query.filter(Notification.session_id == session_id)
    if status:
        query = query.filter(Notification.status == status)
    return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/preferences", response_model=NotificationPreferenceResponse)
def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pref = db.query(NotificationPreference).filter(NotificationPreference.user_id == current_user.id).first()
    if not pref:
        pref = NotificationPreference(user_id=current_user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return NotificationPreferenceResponse(
        daily_morning=bool(pref.daily_morning),
        weekly_schedule=bool(pref.weekly_schedule),
        eod_recap=bool(pref.eod_recap),
        cancellation=bool(pref.cancellation),
        new_review=bool(pref.new_review),
        appointment_reminder=bool(pref.appointment_reminder),
    )


@router.put("/preferences", response_model=NotificationPreferenceResponse)
def update_preferences(
    body: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pref = db.query(NotificationPreference).filter(NotificationPreference.user_id == current_user.id).first()
    if not pref:
        pref = NotificationPreference(user_id=current_user.id)
        db.add(pref)
        db.flush()

    updates = body.model_dump(exclude_none=True)
    for key, val in updates.items():
        setattr(pref, key, int(val))
    db.commit()
    db.refresh(pref)

    return NotificationPreferenceResponse(
        daily_morning=bool(pref.daily_morning),
        weekly_schedule=bool(pref.weekly_schedule),
        eod_recap=bool(pref.eod_recap),
        cancellation=bool(pref.cancellation),
        new_review=bool(pref.new_review),
        appointment_reminder=bool(pref.appointment_reminder),
    )


@router.get("/push/vapid-public-key")
def get_vapid_public_key():
    """Return the VAPID public key so the frontend can subscribe."""
    return {"public_key": settings.VAPID_PUBLIC_KEY}


@router.post("/push/subscribe", status_code=201)
def push_subscribe(
    body: PushSubscriptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.modules.notifications.webpush import subscribe
    subscribe(db, current_user.id, body.endpoint, body.keys["p256dh"], body.keys["auth"])
    return {"ok": True}


@router.post("/push/unsubscribe")
def push_unsubscribe(
    body: PushUnsubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.modules.notifications.webpush import unsubscribe
    unsubscribe(db, current_user.id, body.endpoint)
    return {"ok": True}
