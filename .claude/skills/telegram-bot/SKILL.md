# Telegram Bot Integration — Skill

Build Telegram bot integrations for web applications: webhook handling, deep-link account linking, bot commands, and push notifications via Telegram Bot API.

Use when: user asks to add Telegram notifications, build a Telegram bot, connect Telegram to their app, add bot commands, or send messages via Telegram.

---

## Architecture Overview

A Telegram bot integration has 4 layers:

1. **Bot Registration** — Create bot via @BotFather, get token
2. **Webhook** — Receive messages/commands from Telegram servers
3. **Account Linking** — Securely connect app users to Telegram chat IDs
4. **Message Sending** — Push notifications from app to Telegram

---

## 1. Bot Setup

### Create the bot
1. Message @BotFather on Telegram
2. `/newbot` → choose name and username
3. Save the token: `BOT_TOKEN=123456:ABC-DEF...`
4. `/setcommands` → register command list for autocomplete

### Set webhook
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yourdomain.com/api/telegram/webhook"}'
```

### Verify webhook
```bash
curl -s "https://api.telegram.org/bot<TOKEN>/getWebhookInfo" | python3 -m json.tool
```

Check for `last_error_message` — common issues:
- **404 Not Found** — webhook endpoint not deployed or nginx not proxying
- **SSL certificate problem** — need HTTPS with valid cert
- **Wrong response** — endpoint must return 200 with JSON body

---

## 2. Webhook Handler

The webhook receives JSON updates from Telegram. Key fields:

```json
{
  "update_id": 123,
  "message": {
    "message_id": 456,
    "from": {"id": 297681330, "first_name": "John", "username": "john_doe"},
    "chat": {"id": 297681330, "type": "private"},
    "text": "/start abc123"
  }
}
```

### Webhook endpoint pattern (FastAPI example)
```python
@router.post("/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    message = body.get("message")
    if not message:
        return {"ok": True}  # Ignore non-message updates

    text = message.get("text", "")
    chat_id = str(message["chat"]["id"])
    username = message.get("from", {}).get("username")

    if text.startswith("/start "):
        # Account linking flow
        handle_start(db, chat_id, username, text.split(maxsplit=1)[1])
    elif text.startswith("/"):
        # Bot command
        reply = handle_command(db, chat_id, text)
        send_message(chat_id, reply)
    else:
        send_message(chat_id, "Type /help for available commands.")

    return {"ok": True}  # Always return 200 to Telegram
```

### Critical rules:
- **Always return 200** — non-200 causes Telegram to retry exponentially
- **No auth required** — Telegram calls this directly
- **Process quickly** — Telegram expects response within seconds; offload heavy work to background tasks
- **Idempotent** — Telegram may retry, so handle duplicate `update_id` gracefully

---

## 3. Account Linking (Deep Links)

Securely connect an app user to their Telegram chat. Never trust user input alone.

### Flow
1. App generates signed deep link: `https://t.me/BOT_USERNAME?start=<user_id>_<signature>`
2. User clicks link → opens Telegram → bot receives `/start <payload>`
3. Bot verifies signature → stores `user_id ↔ chat_id` mapping

### Signing (HMAC-SHA256)
```python
import hmac, hashlib

def sign_payload(user_id: int, secret: str) -> str:
    sig = hmac.new(secret.encode(), str(user_id).encode(), hashlib.sha256).hexdigest()[:16]
    return f"{user_id}_{sig}"

def verify_payload(payload: str, secret: str) -> int | None:
    parts = payload.split("_", 1)
    if len(parts) != 2:
        return None
    try:
        user_id = int(parts[0])
    except ValueError:
        return None
    expected = hmac.new(secret.encode(), str(user_id).encode(), hashlib.sha256).hexdigest()[:16]
    if not hmac.compare_digest(parts[1], expected):
        return None
    return user_id
```

### Database model for the link
```python
class TelegramLink(Base):
    __tablename__ = "telegram_links"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    chat_id = Column(String(64), nullable=False, index=True)
    username = Column(String(255), nullable=True)
    linked_at = Column(DateTime, default=datetime.utcnow)
```

### Frontend — link/unlink UI
- Show "Authorize Telegram" button with `href=deeplink_url` when unlinked
- Show "Linked as @username" + "Unlink" button when linked
- Fetch status from `GET /api/telegram/link` (requires auth)

---

## 4. Sending Messages

### Basic send function
```python
import httpx

TELEGRAM_API = "https://api.telegram.org/bot{token}"

def send_message(chat_id: str, text: str, parse_mode: str = "HTML") -> bool:
    if not BOT_TOKEN:
        return False
    url = f"{TELEGRAM_API.format(token=BOT_TOKEN)}/sendMessage"
    try:
        resp = httpx.post(url, json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
        }, timeout=10)
        return resp.status_code == 200 and resp.json().get("ok")
    except Exception:
        return False
```

### High-level send with DB tracking
```python
def send_to_user(db, user_id: int, text: str) -> bool:
    link = db.query(TelegramLink).filter_by(user_id=user_id).first()
    if not link:
        return False
    success = send_message(link.chat_id, text)
    # Record notification in DB for audit trail
    db.add(Notification(
        user_id=user_id,
        channel="telegram",
        recipient=f"tg:{link.chat_id}",
        body=text,
        status="sent" if success else "failed",
    ))
    db.commit()
    return success
```

### HTML formatting in messages
Telegram supports a subset of HTML:
- `<b>bold</b>`, `<i>italic</i>`, `<code>mono</code>`
- `<a href="url">link</a>`
- `<pre>code block</pre>`
- No `<br>` — use `\n` for line breaks
- Special chars `<`, `>`, `&` must be escaped in non-tag text

---

## 5. Bot Commands

### Command handler pattern
```python
COMMANDS = {
    "help": cmd_help,
    "me": cmd_me,
    "today": cmd_today,
    # ...
}

def handle_command(db, chat_id: str, text: str) -> str:
    cmd = text.split()[0].lower().strip("/").split("@")[0]  # Handle /cmd@botname
    handler = COMMANDS.get(cmd)
    if not handler:
        return f"Unknown command: /{cmd}\nType /help for available commands."

    user = lookup_user_by_chat(db, chat_id)
    if not user:
        return "Account not linked. Use the app to connect Telegram."

    return handler(db, user)
```

### Register commands with BotFather
For autocomplete in Telegram, either:
1. Message @BotFather → `/setcommands` → paste command list
2. Or use the API:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{"commands": [
    {"command": "help", "description": "List all commands"},
    {"command": "me", "description": "Your profile info"},
    {"command": "today", "description": "Today schedule"}
  ]}'
```

### Useful command ideas by domain

**Booking/Scheduling apps:**
- `/today` `/tomorrow` `/week` — view schedule
- `/next` — next upcoming appointment
- `/revenue` — earnings summary (today/week/month)
- `/reviews` — recent reviews
- `/settings` — notification preferences

**E-commerce:**
- `/orders` — recent orders
- `/track <id>` — shipment tracking
- `/sales` — daily sales summary

**General:**
- `/me` — profile info
- `/help` — command list
- `/settings` — preferences
- `/status` — system status

---

## 6. Common Gotchas

### Environment variables not in container
`docker compose restart` does NOT reload `env_file`. Must use:
```bash
docker compose up -d <service>  # Recreates container with new env
```

### Production deploy overwrites env
If CI/CD copies env files from secrets, manually-added vars get lost. **Always update the CI/CD secret** when adding new env vars.

### Webhook returns 404
- Check the route is registered in the app
- Check nginx/reverse proxy forwards the path
- Test locally: `curl -X POST http://localhost:8000/api/telegram/webhook -d '{}'`

### Bot doesn't respond to commands
1. Check webhook is set: `getWebhookInfo`
2. Check server logs for errors in the handler
3. Verify the account is linked (chat_id exists in DB)
4. Test with direct webhook simulation:
```bash
curl -X POST https://yourapp.com/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{"update_id":1,"message":{"message_id":1,"from":{"id":CHAT_ID},"chat":{"id":CHAT_ID,"type":"private"},"text":"/help"}}'
```

### Message formatting breaks
- Don't use `<br>`, use `\n`
- Escape `<`, `>`, `&` in dynamic content
- If HTML parsing fails, Telegram silently strips all formatting

### Deep link payload too long
Telegram `/start` payload max is 64 characters. Keep signatures short (16 hex chars is enough).

---

## 7. Testing Checklist

- [ ] `getWebhookInfo` shows correct URL, no errors
- [ ] `/start <payload>` links account, bot confirms
- [ ] `/help` returns command list
- [ ] All commands respond without errors
- [ ] Unknown commands return helpful message
- [ ] Plain text (non-command) returns guidance
- [ ] Send notification from app → arrives in Telegram
- [ ] Unlink → notifications stop
- [ ] Re-link → notifications resume
- [ ] Bot token missing → graceful fallback, no crash

---

## 8. Dependencies

**Python:**
- `httpx` — HTTP client for Telegram API calls (sync, lightweight)
- No Telegram-specific SDK needed — raw HTTP is simpler for webhook bots

**Config:**
```
TELEGRAM_BOT_TOKEN=<from @BotFather>
TELEGRAM_BOT_USERNAME=<bot username without @>
```

**Database:**
- `telegram_links` table (user_id, chat_id, username, linked_at)
- Optionally: notification log table for audit trail
