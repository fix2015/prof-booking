"""
Web Push notification sending via pywebpush + VAPID.
"""

import json
import logging
from datetime import datetime
from typing import Optional

from pywebpush import webpush, WebPushException
from sqlalchemy.orm import Session

from app.config import settings
from app.modules.notifications.models import (
    Notification, NotificationType, NotificationStatus, PushSubscription,
)

logger = logging.getLogger(__name__)


def subscribe(db: Session, user_id: int, endpoint: str, p256dh: str, auth: str) -> PushSubscription:
    """Create or update a push subscription for a user."""
    sub = db.query(PushSubscription).filter(PushSubscription.endpoint == endpoint).first()
    if sub:
        sub.user_id = user_id
        sub.p256dh = p256dh
        sub.auth = auth
        sub.created_at = datetime.utcnow()
    else:
        sub = PushSubscription(user_id=user_id, endpoint=endpoint, p256dh=p256dh, auth=auth)
        db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def unsubscribe(db: Session, user_id: int, endpoint: str) -> bool:
    """Remove a push subscription."""
    sub = db.query(PushSubscription).filter(
        PushSubscription.user_id == user_id,
        PushSubscription.endpoint == endpoint,
    ).first()
    if sub:
        db.delete(sub)
        db.commit()
        return True
    return False


def _send_one(sub: PushSubscription, payload: str) -> bool:
    """Send a web push to a single subscription. Returns True on success."""
    if not settings.VAPID_PRIVATE_KEY:
        logger.warning("VAPID_PRIVATE_KEY not configured")
        return False
    try:
        webpush(
            subscription_info={
                "endpoint": sub.endpoint,
                "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
            },
            data=payload,
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_CLAIMS_EMAIL},
        )
        return True
    except WebPushException as e:
        logger.error("Web push failed for endpoint=%s: %s", sub.endpoint[:60], e)
        if e.response and e.response.status_code in (404, 410):
            # Subscription expired/invalid — clean up
            return False
        return False
    except Exception as e:
        logger.error("Web push error: %s", e)
        return False


def send_web_push(db: Session, user_id: int, title: str, body: str,
                  url: Optional[str] = None, session_id: Optional[int] = None) -> bool:
    """Send web push to all subscriptions for a user. Records notification."""
    subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
    if not subs:
        logger.info("No push subscriptions for user_id=%d", user_id)
        return False

    payload = json.dumps({"title": title, "body": body, "url": url or "/"})
    any_success = False
    stale = []

    for sub in subs:
        ok = _send_one(sub, payload)
        if ok:
            any_success = True
        else:
            stale.append(sub)

    # Remove stale/expired subscriptions
    for sub in stale:
        db.delete(sub)

    # Record notification
    n = Notification(
        session_id=session_id,
        notification_type=NotificationType.WEB_PUSH,
        recipient=f"push:user:{user_id}",
        body=f"{title}: {body}",
        status=NotificationStatus.SENT if any_success else NotificationStatus.FAILED,
        sent_at=datetime.utcnow() if any_success else None,
    )
    db.add(n)
    db.commit()

    return any_success
