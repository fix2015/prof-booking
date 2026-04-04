"""
Telegram Bot integration for ProBook notifications.

Architecture:
  1. User clicks "Authorize Telegram" in the app, which opens:
     https://t.me/<BOT_USERNAME>?start=<signed_user_id>
  2. Bot receives /start <payload>, verifies the signature,
     and stores {user_id -> chat_id} in the telegram_links table.
  3. Backend calls send_telegram(user_id, text) to push notifications.

The payload is HMAC-signed so users can't link to arbitrary accounts.
"""

import hashlib
import hmac
import logging
from datetime import datetime
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.modules.notifications.models import (
    Notification, NotificationType, NotificationStatus, TelegramLink,
)

logger = logging.getLogger(__name__)

TELEGRAM_API = "https://api.telegram.org/bot{token}"


# ── Deep-link signing ────────────────────────────────────────────────

def _sign(user_id: int) -> str:
    """HMAC-SHA256 signature for deep-link payload."""
    key = settings.APP_SECRET_KEY.encode()
    msg = str(user_id).encode()
    return hmac.new(key, msg, hashlib.sha256).hexdigest()[:16]


def make_deeplink_payload(user_id: int) -> str:
    """Create a signed payload: <user_id>_<signature>"""
    return f"{user_id}_{_sign(user_id)}"


def verify_deeplink_payload(payload: str) -> Optional[int]:
    """Verify and extract user_id from a signed payload. Returns None if invalid."""
    parts = payload.split("_", 1)
    if len(parts) != 2:
        return None
    try:
        user_id = int(parts[0])
    except ValueError:
        return None
    expected = _sign(user_id)
    if not hmac.compare_digest(parts[1], expected):
        return None
    return user_id


def get_deeplink_url(user_id: int) -> str:
    """Full Telegram deep-link URL for the frontend button."""
    payload = make_deeplink_payload(user_id)
    return f"https://t.me/{settings.TELEGRAM_BOT_USERNAME}?start={payload}"


# ── Database operations ──────────────────────────────────────────────

def link_telegram(db: Session, user_id: int, chat_id: str, username: Optional[str] = None) -> TelegramLink:
    """Create or update the user ↔ Telegram link."""
    link = db.query(TelegramLink).filter(TelegramLink.user_id == user_id).first()
    if link:
        link.chat_id = chat_id
        link.username = username
        link.linked_at = datetime.utcnow()
    else:
        link = TelegramLink(user_id=user_id, chat_id=chat_id, username=username)
        db.add(link)
    db.commit()
    db.refresh(link)
    return link


def unlink_telegram(db: Session, user_id: int) -> bool:
    """Remove a user's Telegram link."""
    link = db.query(TelegramLink).filter(TelegramLink.user_id == user_id).first()
    if link:
        db.delete(link)
        db.commit()
        return True
    return False


def get_telegram_link(db: Session, user_id: int) -> Optional[TelegramLink]:
    return db.query(TelegramLink).filter(TelegramLink.user_id == user_id).first()


# ── Sending messages ─────────────────────────────────────────────────

def _call_telegram(method: str, **kwargs) -> bool:
    """Call Telegram Bot API synchronously."""
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN not configured")
        return False
    url = f"{TELEGRAM_API.format(token=settings.TELEGRAM_BOT_TOKEN)}/{method}"
    try:
        resp = httpx.post(url, json=kwargs, timeout=10)
        if resp.status_code == 200 and resp.json().get("ok"):
            return True
        logger.error("Telegram API error: %s", resp.text)
        return False
    except Exception as e:
        logger.error("Telegram API call failed: %s", e)
        return False


def send_telegram_message(chat_id: str, text: str, parse_mode: str = "HTML") -> bool:
    """Send a message to a specific Telegram chat."""
    return _call_telegram("sendMessage", chat_id=chat_id, text=text, parse_mode=parse_mode)


def send_telegram(db: Session, user_id: int, text: str, session_id: Optional[int] = None) -> bool:
    """
    Send a Telegram notification to a user by app user_id.
    Looks up their linked chat_id and sends the message.
    Records the notification in the database.
    """
    link = get_telegram_link(db, user_id)
    if not link:
        logger.info("No Telegram link for user_id=%d", user_id)
        return False

    success = send_telegram_message(link.chat_id, text)

    # Record in notifications table
    n = Notification(
        session_id=session_id,
        notification_type=NotificationType.TELEGRAM,
        recipient=f"tg:{link.chat_id}",
        body=text,
        status=NotificationStatus.SENT if success else NotificationStatus.FAILED,
        sent_at=datetime.utcnow() if success else None,
    )
    db.add(n)
    db.commit()

    return success
