"""
Telegram bot endpoints:
  POST /api/v1/telegram/webhook  — Telegram sends updates here
  GET  /api/v1/telegram/link     — Get current user's link status + deep-link URL
  DELETE /api/v1/telegram/link   — Unlink Telegram
  POST /api/v1/telegram/notify   — Send notification to a user (internal/admin)
"""

import logging
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.notifications.telegram import (
    verify_deeplink_payload,
    link_telegram,
    unlink_telegram,
    get_telegram_link,
    get_deeplink_url,
    send_telegram,
    send_telegram_message,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Telegram Webhook (called by Telegram servers) ────────────────────

@router.post("/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receives updates from Telegram Bot API.
    Handles /start <payload> to link users.
    No auth required — Telegram calls this directly.
    """
    body = await request.json()
    message = body.get("message")
    if not message:
        return {"ok": True}

    text = message.get("text", "")
    chat = message.get("chat", {})
    chat_id = str(chat.get("id", ""))
    username = message.get("from", {}).get("username")

    if not text.startswith("/start"):
        # Reply with help
        send_telegram_message(chat_id, "Use the link from your ProBook app to connect your account.")
        return {"ok": True}

    # /start or /start <payload>
    parts = text.split(maxsplit=1)
    if len(parts) < 2:
        send_telegram_message(chat_id, "Welcome to ProBook Bot!\n\nTo link your account, use the \"Authorize Telegram\" button in the ProBook app.")
        return {"ok": True}

    payload = parts[1].strip()
    user_id = verify_deeplink_payload(payload)
    if user_id is None:
        send_telegram_message(chat_id, "Invalid or expired link. Please try again from the ProBook app.")
        return {"ok": True}

    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        send_telegram_message(chat_id, "User account not found.")
        return {"ok": True}

    # Link the accounts
    link_telegram(db, user_id, chat_id, username)
    send_telegram_message(
        chat_id,
        "Telegram successfully linked to your account!\n\n"
        "You'll now receive ProBook notifications here."
    )

    return {"ok": True}


# ── User-facing endpoints (require auth) ─────────────────────────────

class TelegramLinkResponse(BaseModel):
    linked: bool
    username: Optional[str] = None
    deeplink_url: str
    bot_username: str


@router.get("/link", response_model=TelegramLinkResponse)
def get_link_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's Telegram link status and deep-link URL."""
    link = get_telegram_link(db, current_user.id)
    return TelegramLinkResponse(
        linked=link is not None,
        username=link.username if link else None,
        deeplink_url=get_deeplink_url(current_user.id),
        bot_username=settings.TELEGRAM_BOT_USERNAME,
    )


@router.delete("/link")
def remove_link(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Unlink Telegram from user's account."""
    removed = unlink_telegram(db, current_user.id)
    if not removed:
        raise HTTPException(status_code=404, detail="No Telegram link found")
    return {"ok": True, "message": "Telegram unlinked"}


# ── Internal notification endpoint ───────────────────────────────────

class NotifyRequest(BaseModel):
    app_user_id: int
    message: str
    session_id: Optional[int] = None


@router.post("/notify")
def notify_user(body: NotifyRequest, db: Session = Depends(get_db)):
    """
    Send a Telegram notification to a user.
    Called internally by backend services.
    """
    success = send_telegram(db, body.app_user_id, body.message, body.session_id)
    if not success:
        raise HTTPException(status_code=404, detail="User has no Telegram link or send failed")
    return {"ok": True}
