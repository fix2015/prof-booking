#!/usr/bin/env python3
"""
claude_bridge.py — Telegram bot that forwards messages to Claude and replies.

Usage:
    pip install python-telegram-bot anthropic
    TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN ANTHROPIC_API_KEY=YOUR_KEY python claude_bridge.py

Or set the constants below directly.
"""

import os
import logging
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, ContextTypes, filters
import anthropic

# ── Configuration ─────────────────────────────────────────────────────────────

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
MODEL = "claude-opus-4-5"
MAX_TOKENS = 1024

# Optional: restrict to specific Telegram user IDs (leave empty to allow everyone)
ALLOWED_USER_IDS: list[int] = []

# System prompt for Claude
SYSTEM_PROMPT = (
    "You are a helpful assistant for the BeautyPlatform nail salon app. "
    "You help with bookings, answer questions about services, and provide support. "
    "Be concise and friendly."
)

# ── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# ── Per-user conversation history ─────────────────────────────────────────────

# Maps telegram user_id → list of {"role": ..., "content": ...} dicts
conversation_history: dict[int, list[dict]] = {}

MAX_HISTORY = 20  # keep last N messages per user


def get_history(user_id: int) -> list[dict]:
    return conversation_history.setdefault(user_id, [])


def add_to_history(user_id: int, role: str, content: str) -> None:
    history = get_history(user_id)
    history.append({"role": role, "content": content})
    # Trim to last MAX_HISTORY messages
    if len(history) > MAX_HISTORY:
        conversation_history[user_id] = history[-MAX_HISTORY:]


# ── Helpers ───────────────────────────────────────────────────────────────────

def is_allowed(user_id: int) -> bool:
    if not ALLOWED_USER_IDS:
        return True
    return user_id in ALLOWED_USER_IDS


async def call_claude(user_id: int, user_message: str) -> str:
    """Add user message to history, call Claude, return assistant reply."""
    add_to_history(user_id, "user", user_message)

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=SYSTEM_PROMPT,
            messages=get_history(user_id),
        )
        reply = response.content[0].text
        add_to_history(user_id, "assistant", reply)
        return reply
    except anthropic.APIError as e:
        logger.error("Anthropic API error: %s", e)
        return f"Sorry, I encountered an error: {e}"


# ── Handlers ──────────────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /start command."""
    user = update.effective_user
    if not is_allowed(user.id):
        await update.message.reply_text("Sorry, you are not authorized to use this bot.")
        return
    await update.message.reply_text(
        f"Hi {user.first_name}! I'm your BeautyPlatform assistant powered by Claude. "
        "Send me any question and I'll help you!"
    )


async def cmd_reset(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /reset — clears conversation history for this user."""
    user_id = update.effective_user.id
    conversation_history.pop(user_id, None)
    await update.message.reply_text("Conversation history cleared. Starting fresh!")


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /help command."""
    await update.message.reply_text(
        "Commands:\n"
        "  /start  — Start the bot\n"
        "  /reset  — Clear conversation history\n"
        "  /help   — Show this message\n\n"
        "Just send any message to chat with Claude!"
    )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle incoming text messages."""
    user = update.effective_user
    if not is_allowed(user.id):
        await update.message.reply_text("Sorry, you are not authorized to use this bot.")
        return

    user_text = update.message.text
    logger.info("User %s (%d): %s", user.username or user.first_name, user.id, user_text[:80])

    # Show typing indicator while Claude is thinking
    await context.bot.send_chat_action(
        chat_id=update.effective_chat.id,
        action="typing",
    )

    reply = await call_claude(user.id, user_text)
    await update.message.reply_text(reply)


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    if TELEGRAM_BOT_TOKEN == "YOUR_BOT_TOKEN_HERE":
        raise ValueError(
            "Set TELEGRAM_BOT_TOKEN environment variable or replace the placeholder in the script."
        )
    if not ANTHROPIC_API_KEY:
        raise ValueError(
            "Set ANTHROPIC_API_KEY environment variable."
        )

    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("reset", cmd_reset))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    logger.info("Bot is running. Press Ctrl+C to stop.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
