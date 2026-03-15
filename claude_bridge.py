#!/usr/bin/env python3
"""
claude_bridge.py — LOCAL COMPUTER side of the Claude ↔ Telegram bridge.

Role: This script runs on your LOCAL machine. It receives structured task
      messages from Server Claude (via Telegram), executes them locally
      (git, tests, code changes), and reports results back.

Architecture:
    Server Claude  ──Telegram──►  [this script on LOCAL]
                   ◄──Telegram──  results / logs / decisions

Structured message format (both directions):
    [CLAUDE_LOCAL] TYPE: <type> TASK_ID: <id> CONTENT: <payload>

Message types:
    request   — Server asks local to do something (run tests, commit, etc.)
    log       — Server sends diagnostic / status info to review locally
    decision  — Server sends a decision that updates local workflow
    result    — Local reports back the outcome of a task
    ack       — Simple acknowledgement

Setup:
    pip install python-telegram-bot

Usage:
    TELEGRAM_BOT_TOKEN=your_token python claude_bridge.py
    # OR set the constant below directly.

    Then send messages from your Telegram bot (Server Claude talks to the same bot).
"""

import asyncio
import json
import logging
import os
import re
import subprocess
import uuid
from datetime import datetime
from pathlib import Path
from typing import Callable, Awaitable

from telegram import Update, Bot
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

# ══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION — put your real bot token here (or use the env var)
# ══════════════════════════════════════════════════════════════════════════════

# ⚠️  REPLACE THIS with your actual Telegram Bot token from @BotFather
#     Or set the TELEGRAM_BOT_TOKEN environment variable instead.
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")

# The Telegram chat_id that is allowed to send tasks (Server Claude's chat or yours).
# Leave empty [] to allow any chat (not recommended for production).
ALLOWED_CHAT_IDS: list[int] = []

# Working directory for local operations (repo root)
WORK_DIR = Path(__file__).parent.resolve()

# Local log file path
LOG_FILE = WORK_DIR / "claude_bridge.log"

# Maximum bytes for command output captured and sent back via Telegram
MAX_OUTPUT_CHARS = 3000

# ══════════════════════════════════════════════════════════════════════════════
# LOGGING
# ══════════════════════════════════════════════════════════════════════════════

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    level=logging.INFO,
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
    ],
)
logger = logging.getLogger("claude_bridge")


def log_event(direction: str, task_id: str, msg_type: str, content: str) -> None:
    """Append a structured event to the local log file."""
    entry = {
        "ts": datetime.utcnow().isoformat(),
        "direction": direction,   # "IN" or "OUT"
        "task_id": task_id,
        "type": msg_type,
        "content": content[:500],
    }
    logger.info("[%s] task=%s type=%s | %s", direction, task_id, msg_type, content[:120])
    with open(LOG_FILE, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry) + "\n")


# ══════════════════════════════════════════════════════════════════════════════
# STRUCTURED MESSAGE PROTOCOL
# ══════════════════════════════════════════════════════════════════════════════

MSG_PREFIX = "[CLAUDE_LOCAL]"

_MSG_RE = re.compile(
    r"\[CLAUDE_LOCAL\]\s+TYPE:\s*(\w+)\s+TASK_ID:\s*(\S+)\s+CONTENT:\s*(.*)",
    re.DOTALL | re.IGNORECASE,
)


def parse_structured(text: str) -> dict | None:
    """
    Parse a structured message.
    Returns dict with keys: type, task_id, content — or None if not structured.
    """
    m = _MSG_RE.search(text)
    if not m:
        return None
    return {
        "type": m.group(1).lower(),
        "task_id": m.group(2),
        "content": m.group(3).strip(),
    }


def build_structured(msg_type: str, content: str, task_id: str | None = None) -> str:
    """Build a structured outbound message string."""
    tid = task_id or str(uuid.uuid4())[:8]
    return f"{MSG_PREFIX} TYPE: {msg_type} TASK_ID: {tid} CONTENT: {content}"


# ══════════════════════════════════════════════════════════════════════════════
# LOCAL TASK EXECUTOR
# ══════════════════════════════════════════════════════════════════════════════

def run_local(cmd: str | list, cwd: Path = WORK_DIR, timeout: int = 120) -> tuple[int, str]:
    """
    Run a shell command locally and return (returncode, combined_output).
    Output is truncated to MAX_OUTPUT_CHARS.
    """
    logger.info("Running: %s  (cwd=%s)", cmd, cwd)
    try:
        result = subprocess.run(
            cmd,
            shell=isinstance(cmd, str),
            cwd=str(cwd),
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        combined = (result.stdout + result.stderr).strip()
        if len(combined) > MAX_OUTPUT_CHARS:
            combined = combined[-MAX_OUTPUT_CHARS:] + "\n…[truncated]"
        return result.returncode, combined
    except subprocess.TimeoutExpired:
        return -1, f"Command timed out after {timeout}s"
    except Exception as exc:  # noqa: BLE001
        return -1, f"Execution error: {exc}"


# ══════════════════════════════════════════════════════════════════════════════
# HOOK HANDLERS — one per message TYPE
# ══════════════════════════════════════════════════════════════════════════════

HookFn = Callable[[dict, "BridgeContext"], Awaitable[str]]
_HOOKS: dict[str, HookFn] = {}


def hook(msg_type: str):
    """Decorator to register a hook for a message type."""
    def decorator(fn: HookFn):
        _HOOKS[msg_type] = fn
        return fn
    return decorator


class BridgeContext:
    """Thin context passed to every hook so they can send Telegram messages."""
    def __init__(self, bot: Bot, chat_id: int):
        self.bot = bot
        self.chat_id = chat_id

    async def reply(self, text: str) -> None:
        """Send a plain-text reply (splits if needed for Telegram's 4096-char limit)."""
        chunk_size = 4000
        for i in range(0, len(text), chunk_size):
            await self.bot.send_message(chat_id=self.chat_id, text=text[i : i + chunk_size])

    async def send_result(self, task_id: str, content: str) -> None:
        """Send a structured RESULT message back."""
        msg = build_structured("result", content, task_id=task_id)
        log_event("OUT", task_id, "result", content)
        await self.reply(msg)


# ── on_request ────────────────────────────────────────────────────────────────

@hook("request")
async def on_request(msg: dict, ctx: BridgeContext) -> str:
    """
    Handle a task request from Server Claude.
    The CONTENT field is a JSON object or a plain command string.

    Supported request actions (in CONTENT JSON):
        {"action": "run_tests"}
        {"action": "run_tests", "suite": "booking"}
        {"action": "git_status"}
        {"action": "git_commit", "message": "fix: something"}
        {"action": "git_push"}
        {"action": "shell", "cmd": "npm run build"}
        {"action": "read_file", "path": "relative/path"}
        {"action": "write_file", "path": "relative/path", "content": "..."}
    """
    task_id = msg["task_id"]
    raw_content = msg["content"]

    # Try parsing JSON, fall back to treating content as raw shell command
    try:
        payload = json.loads(raw_content)
    except json.JSONDecodeError:
        payload = {"action": "shell", "cmd": raw_content}

    action = payload.get("action", "unknown")
    logger.info("[on_request] task=%s action=%s", task_id, action)

    # ── git_status ──
    if action == "git_status":
        rc, out = run_local("git status --short && git log --oneline -5")
        result = f"exit={rc}\n{out}"

    # ── git_commit ──
    elif action == "git_commit":
        commit_msg = payload.get("message", "chore: auto-commit from claude_bridge")
        rc1, out1 = run_local("git add -A")
        rc2, out2 = run_local(["git", "commit", "-m", commit_msg])
        result = f"add exit={rc1}\ncommit exit={rc2}\n{out1}\n{out2}".strip()

    # ── git_push ──
    elif action == "git_push":
        rc, out = run_local("git push")
        result = f"exit={rc}\n{out}"

    # ── run_tests ──
    elif action == "run_tests":
        suite = payload.get("suite", "")
        frontend_dir = WORK_DIR / "frontend"
        if suite:
            cmd = f"npx playwright test tests/e2e/{suite} --reporter=line"
        else:
            cmd = "npx playwright test --reporter=line"
        rc, out = run_local(cmd, cwd=frontend_dir, timeout=300)
        result = f"exit={rc}\n{out}"

    # ── shell (arbitrary command) ──
    elif action == "shell":
        cmd = payload.get("cmd", "echo no command")
        rc, out = run_local(cmd, timeout=180)
        result = f"exit={rc}\n{out}"

    # ── read_file ──
    elif action == "read_file":
        rel_path = payload.get("path", "")
        full_path = (WORK_DIR / rel_path).resolve()
        if not str(full_path).startswith(str(WORK_DIR)):
            result = "ERROR: path traversal denied"
        elif full_path.exists():
            content = full_path.read_text(encoding="utf-8", errors="replace")
            result = content[:MAX_OUTPUT_CHARS]
        else:
            result = f"ERROR: file not found: {rel_path}"

    # ── write_file ──
    elif action == "write_file":
        rel_path = payload.get("path", "")
        file_content = payload.get("content", "")
        full_path = (WORK_DIR / rel_path).resolve()
        if not str(full_path).startswith(str(WORK_DIR)):
            result = "ERROR: path traversal denied"
        else:
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(file_content, encoding="utf-8")
            result = f"OK: wrote {len(file_content)} chars to {rel_path}"

    else:
        result = f"ERROR: unknown action '{action}'"

    await ctx.send_result(task_id, result)
    return result


# ── on_log ────────────────────────────────────────────────────────────────────

@hook("log")
async def on_log(msg: dict, ctx: BridgeContext) -> str:
    """
    Server Claude sends a diagnostic / status log.
    We persist it locally and send a simple ACK.
    """
    task_id = msg["task_id"]
    content = msg["content"]

    # Write to a separate diagnostics file
    diag_file = WORK_DIR / "claude_bridge_diag.log"
    with open(diag_file, "a", encoding="utf-8") as fh:
        fh.write(f"[{datetime.utcnow().isoformat()}] {content}\n")

    ack = build_structured("ack", f"log received and saved (task={task_id})", task_id=task_id)
    log_event("OUT", task_id, "ack", "log received")
    await ctx.reply(ack)
    return "ack sent"


# ── on_result ─────────────────────────────────────────────────────────────────

@hook("result")
async def on_result(msg: dict, ctx: BridgeContext) -> str:
    """
    Server Claude reports the result of a previously requested server-side task.
    We log it and display it locally.
    """
    task_id = msg["task_id"]
    content = msg["content"]

    result_file = WORK_DIR / "claude_bridge_results.jsonl"
    with open(result_file, "a", encoding="utf-8") as fh:
        entry = {"ts": datetime.utcnow().isoformat(), "task_id": task_id, "result": content}
        fh.write(json.dumps(entry) + "\n")

    await ctx.reply(f"✅ Result recorded for task {task_id}:\n{content[:500]}")
    return "result stored"


# ── on_request (already registered above) ─────────────────────────────────────

@hook("decision")
async def on_decision(msg: dict, ctx: BridgeContext) -> str:
    """
    Server Claude sends a workflow decision (e.g. "use branch X", "skip test Y").
    We store it in a local decisions file and acknowledge.
    """
    task_id = msg["task_id"]
    content = msg["content"]

    decisions_file = WORK_DIR / "claude_bridge_decisions.jsonl"
    with open(decisions_file, "a", encoding="utf-8") as fh:
        entry = {"ts": datetime.utcnow().isoformat(), "task_id": task_id, "decision": content}
        fh.write(json.dumps(entry) + "\n")

    await ctx.reply(f"📋 Decision recorded (task={task_id}):\n{content[:300]}")
    ack = build_structured("ack", f"decision recorded (task={task_id})", task_id=task_id)
    log_event("OUT", task_id, "ack", "decision recorded")
    await ctx.reply(ack)
    return "decision stored"


@hook("ack")
async def on_ack(msg: dict, ctx: BridgeContext) -> str:
    """Simple acknowledgement — just log it."""
    logger.info("[on_ack] Server acknowledged task=%s", msg["task_id"])
    return "ok"


# ══════════════════════════════════════════════════════════════════════════════
# TELEGRAM HANDLERS
# ══════════════════════════════════════════════════════════════════════════════

def _is_allowed(chat_id: int) -> bool:
    if not ALLOWED_CHAT_IDS:
        return True
    return chat_id in ALLOWED_CHAT_IDS


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    if not _is_allowed(chat_id):
        await update.message.reply_text("⛔ Unauthorized.")
        return
    await update.message.reply_text(
        "🤖 Claude Bridge LOCAL is running.\n\n"
        "Send structured messages like:\n"
        f"`{MSG_PREFIX} TYPE: request TASK_ID: abc123 CONTENT: {{\"action\":\"git_status\"}}`\n\n"
        "Commands:\n"
        "  /status   — show git status + last 5 commits\n"
        "  /tests    — run all Playwright E2E tests\n"
        "  /push     — git add -A && push\n"
        "  /logs     — show last 20 lines of bridge log\n"
        "  /help     — this message"
    )


async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _is_allowed(update.effective_chat.id):
        return
    rc, out = run_local("git status --short && echo '---' && git log --oneline -5")
    await update.message.reply_text(f"```\n{out or '(clean)'}\n```", parse_mode="Markdown")


async def cmd_tests(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _is_allowed(update.effective_chat.id):
        return
    await update.message.reply_text("⏳ Running Playwright tests (may take ~30s)…")
    frontend_dir = WORK_DIR / "frontend"
    rc, out = run_local("npx playwright test --reporter=line", cwd=frontend_dir, timeout=300)
    icon = "✅" if rc == 0 else "❌"
    await update.message.reply_text(f"{icon} Tests exit={rc}\n```\n{out[-2000:]}\n```", parse_mode="Markdown")


async def cmd_push(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _is_allowed(update.effective_chat.id):
        return
    await update.message.reply_text("⏳ Committing and pushing…")
    rc1, out1 = run_local("git add -A")
    rc2, out2 = run_local('git commit -m "chore: auto-push from claude_bridge" || true')
    rc3, out3 = run_local("git push")
    combined = f"add={rc1} commit={rc2} push={rc3}\n{out2}\n{out3}"
    await update.message.reply_text(f"```\n{combined[-1500:]}\n```", parse_mode="Markdown")


async def cmd_logs(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _is_allowed(update.effective_chat.id):
        return
    if LOG_FILE.exists():
        lines = LOG_FILE.read_text(encoding="utf-8").splitlines()
        tail = "\n".join(lines[-20:])
        await update.message.reply_text(f"```\n{tail}\n```", parse_mode="Markdown")
    else:
        await update.message.reply_text("No log file yet.")


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await cmd_start(update, context)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle all incoming text messages — look for structured protocol messages."""
    chat_id = update.effective_chat.id
    if not _is_allowed(chat_id):
        await update.message.reply_text("⛔ Unauthorized.")
        return

    text = update.message.text or ""
    ctx = BridgeContext(bot=context.bot, chat_id=chat_id)

    parsed = parse_structured(text)
    if parsed:
        msg_type = parsed["type"]
        task_id = parsed["task_id"]
        log_event("IN", task_id, msg_type, parsed["content"])

        handler = _HOOKS.get(msg_type)
        if handler:
            try:
                await handler(parsed, ctx)
            except Exception as exc:  # noqa: BLE001
                logger.exception("Hook %s failed: %s", msg_type, exc)
                await ctx.send_result(task_id, f"ERROR in hook '{msg_type}': {exc}")
        else:
            await ctx.reply(
                build_structured(
                    "result",
                    f"ERROR: no hook for type '{msg_type}'",
                    task_id=task_id,
                )
            )
    else:
        # Plain text — echo help hint
        await update.message.reply_text(
            "ℹ️ Not a structured message. Use /help or send:\n"
            f"`{MSG_PREFIX} TYPE: request TASK_ID: <id> CONTENT: <json>`",
            parse_mode="Markdown",
        )


# ══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

def main() -> None:
    if TELEGRAM_BOT_TOKEN == "YOUR_BOT_TOKEN_HERE":
        raise SystemExit(
            "\n❌ No bot token configured!\n"
            "   Set the TELEGRAM_BOT_TOKEN environment variable, or\n"
            "   edit the TELEGRAM_BOT_TOKEN constant at the top of this file.\n"
        )

    logger.info("Starting Claude Bridge LOCAL | work_dir=%s", WORK_DIR)
    logger.info("Registered hooks: %s", list(_HOOKS.keys()))

    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(CommandHandler("tests", cmd_tests))
    app.add_handler(CommandHandler("push", cmd_push))
    app.add_handler(CommandHandler("logs", cmd_logs))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    logger.info("Bot polling started. Press Ctrl+C to stop.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
