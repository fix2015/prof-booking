from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_master_or_owner
from app.modules.notifications.models import Notification, NotificationStatus
from app.modules.notifications.schemas import NotificationResponse
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
        # Filter to notifications for sessions where the professional is assigned
        query = query.filter(SessionModel.professional_id == current_user.id)
    # PLATFORM_ADMIN sees all

    if session_id:
        query = query.filter(Notification.session_id == session_id)
    if status:
        query = query.filter(Notification.status == status)
    return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
