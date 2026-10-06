# Google Calendar Sync — Skill

Integrate Google Calendar with web applications: OAuth2 flow, fetch events, sync as blocked/busy slots, auto-refresh tokens.

Use when: user asks to sync Google Calendar, block personal events, import calendar events, or integrate with Google Calendar API.

---

## Architecture Overview

1. **Google Cloud Setup** — Create OAuth2 credentials
2. **OAuth2 Flow** — User consents → get tokens
3. **Token Storage** — Persist access + refresh tokens per user
4. **Event Fetching** — Pull events from Google Calendar API
5. **Slot Blocking** — Convert events into blocked time slots in your app

---

## 1. Google Cloud Setup

### Create OAuth2 Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create **OAuth 2.0 Client ID** (Web application)
3. Add **Authorized redirect URIs**:
   - Local: `http://localhost:8000/api/v1/calendar/google/callback`
   - Production: `https://yourdomain.com/api/v1/calendar/google/callback`
4. Enable the **Google Calendar API** in APIs & Services → Library

### Environment Variables
```
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-<your-secret>
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/v1/calendar/google/callback
```

### Scopes
- `https://www.googleapis.com/auth/calendar.readonly` — read-only access (recommended)
- `https://www.googleapis.com/auth/calendar.events.readonly` — events only, no settings
- `https://www.googleapis.com/auth/calendar` — full read/write (only if you need to create events)

Use the minimum scope needed. Read-only is sufficient for syncing personal events as blocked slots.

---

## 2. OAuth2 Flow

### Step 1: Generate Auth URL
```python
from urllib.parse import urlencode

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"

def get_auth_url(state: str) -> str:
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/calendar.readonly",
        "access_type": "offline",   # Required to get refresh_token
        "prompt": "consent",        # Force consent to always get refresh_token
        "state": state,             # Pass user_id to identify user in callback
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
```

### Step 2: Exchange Code for Tokens
```python
import httpx

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

def exchange_code(code: str) -> dict:
    resp = httpx.post(GOOGLE_TOKEN_URL, data={
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }, timeout=15)
    resp.raise_for_status()
    return resp.json()
    # Returns: {"access_token": "...", "refresh_token": "...", "expires_in": 3600, ...}
```

### Step 3: Refresh Expired Tokens
```python
def refresh_access_token(refresh_token: str) -> dict:
    resp = httpx.post(GOOGLE_TOKEN_URL, data={
        "refresh_token": refresh_token,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "grant_type": "refresh_token",
    }, timeout=15)
    resp.raise_for_status()
    return resp.json()
    # Returns: {"access_token": "...", "expires_in": 3600}
    # NOTE: refresh_token is NOT returned on refresh — keep the original
```

### Critical Rules
- **`access_type=offline`** is required to get a `refresh_token`
- **`prompt=consent`** forces the consent screen — without it, Google only returns `refresh_token` on first authorization
- **`refresh_token` is only returned once** during the initial consent. Store it securely. If lost, user must re-authorize with `prompt=consent`.
- **`state` parameter** — pass the user ID so the callback can identify which user authorized

---

## 3. Token Storage

### Database Model
```python
class GoogleCalendarToken(Base):
    __tablename__ = "google_calendar_tokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    token_expiry = Column(DateTime, nullable=True)
    calendar_id = Column(String(255), default="primary")
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Get Valid Token (Auto-Refresh)
```python
def get_valid_token(db, user_id: int) -> str | None:
    token = db.query(GoogleCalendarToken).filter_by(user_id=user_id).first()
    if not token:
        return None
    if token.token_expiry and token.token_expiry < datetime.utcnow():
        if not token.refresh_token:
            return None
        new_data = refresh_access_token(token.refresh_token)
        token.access_token = new_data["access_token"]
        token.token_expiry = datetime.utcnow() + timedelta(seconds=new_data.get("expires_in", 3600))
        db.commit()
    return token.access_token
```

---

## 4. Fetching Events

### Google Calendar API
```python
GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"

def fetch_events(access_token: str, time_min: datetime, time_max: datetime,
                 calendar_id: str = "primary") -> list[dict]:
    events = []
    page_token = None
    while True:
        params = {
            "timeMin": time_min.isoformat() + "Z",
            "timeMax": time_max.isoformat() + "Z",
            "singleEvents": "true",     # Expand recurring events
            "orderBy": "startTime",
            "maxResults": 250,
        }
        if page_token:
            params["pageToken"] = page_token
        resp = httpx.get(
            f"{GOOGLE_CALENDAR_API}/calendars/{calendar_id}/events",
            headers={"Authorization": f"Bearer {access_token}"},
            params=params, timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        events.extend(data.get("items", []))
        page_token = data.get("nextPageToken")
        if not page_token:
            break
    return events
```

### Event Format
```json
{
  "summary": "Dentist appointment",
  "start": {"dateTime": "2026-04-10T14:00:00+02:00"},
  "end": {"dateTime": "2026-04-10T15:00:00+02:00"},
  "status": "confirmed"
}
```

**All-day events** have `date` instead of `dateTime`:
```json
{
  "summary": "Vacation",
  "start": {"date": "2026-04-15"},
  "end": {"date": "2026-04-18"}
}
```

### Key Parameters
- **`singleEvents=true`** — expands recurring events into individual instances. Without this, recurring events return a single entry with an RRULE.
- **`timeMin`/`timeMax`** — must be in RFC 3339 format with timezone (append `Z` for UTC)
- **`maxResults`** — max 2500, default 250. Use pagination with `nextPageToken`.
- **`calendar_id`** — `"primary"` for user's main calendar, or a specific calendar ID

---

## 5. Converting Events to Blocked Slots

### Strategy
- **Timed events** → block exact time range
- **All-day events** → block full working day (e.g. 8AM–10PM)
- **Delete old synced blocks before re-syncing** to avoid duplicates
- **Mark blocked slots** with `is_available=False` to distinguish from regular work slots

```python
def sync_calendar(db, user_id: int, days_ahead: int = 30):
    access_token = get_valid_token(db, user_id)
    # ... fetch events ...

    # Clear previous synced blocks
    db.query(WorkSlot).filter(
        WorkSlot.professional_id == prof.id,
        WorkSlot.is_available == False,
        WorkSlot.slot_date >= date.today(),
    ).delete()

    for event in events:
        start = event.get("start", {})
        if "dateTime" in start:
            # Timed event
            start_dt = datetime.fromisoformat(start["dateTime"])
            end_dt = datetime.fromisoformat(event["end"]["dateTime"])
            db.add(WorkSlot(
                professional_id=prof.id,
                provider_id=provider_id,
                slot_date=start_dt.date(),
                start_time=start_dt.time(),
                end_time=end_dt.time(),
                is_available=False,
            ))
        elif "date" in start:
            # All-day event
            db.add(WorkSlot(
                professional_id=prof.id,
                provider_id=provider_id,
                slot_date=date.fromisoformat(start["date"]),
                start_time=time(8, 0),
                end_time=time(22, 0),
                is_available=False,
            ))
    db.commit()
```

---

## 6. API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/calendar/google/auth-url` | GET | Yes | Return Google OAuth consent URL |
| `/calendar/google/callback` | GET | No | OAuth callback — exchange code, save tokens, redirect |
| `/calendar/google/sync` | POST | Yes | Fetch events and create blocked slots |
| `/calendar/google/status` | GET | Yes | Check if connected + last sync time |
| `/calendar/google/disconnect` | DELETE | Yes | Remove tokens and connection |

### Callback Endpoint Pattern
```python
@router.get("/google/callback")
def google_callback(code: str, state: str, db: Session = Depends(get_db)):
    token_data = exchange_code(code)
    user_id = int(state)
    save_tokens(db, user_id, token_data)
    return RedirectResponse("/calendar?google=connected")
```

**Important:** The callback is called by Google's redirect, not by the frontend directly. It should:
1. Exchange the code for tokens
2. Save tokens to DB
3. Redirect the user back to the calendar page with a query param

---

## 7. Frontend Integration

### Connect Button
```tsx
function GoogleCalendarSync() {
  const { data: status } = useQuery({
    queryKey: ["google-calendar-status"],
    queryFn: () => api.get("/calendar/google/status"),
  });

  const connect = useMutation({
    mutationFn: () => api.get("/calendar/google/auth-url"),
    onSuccess: (data) => { window.location.href = data.auth_url; },
  });

  const sync = useMutation({
    mutationFn: () => api.post("/calendar/google/sync?days_ahead=30"),
    onSuccess: () => { queryClient.invalidateQueries(["work-slots"]); },
  });

  return status?.connected ? (
    <button onClick={() => sync.mutate()}>Sync Google Calendar</button>
  ) : (
    <button onClick={() => connect.mutate()}>Connect Google Calendar</button>
  );
}
```

### Handle OAuth Redirect
After Google redirects back to `/calendar?google=connected`:
```tsx
useEffect(() => {
  const g = searchParams.get("google");
  if (g === "connected") {
    toast("Google Calendar connected!");
    queryClient.invalidateQueries(["google-calendar-status"]);
    searchParams.delete("google");
    setSearchParams(searchParams, { replace: true });
  }
}, [searchParams]);
```

---

## 8. Common Gotchas

### `redirect_uri_mismatch` (Error 400)
The redirect URI in your code must **exactly match** what's registered in Google Cloud Console. Check:
- Protocol: `http` vs `https`
- Port: included or not
- Path: exact match
- Trailing slash: must match

**Fix:** Add both local and production URIs in Google Cloud Console → Credentials → Authorized redirect URIs.

### No `refresh_token` returned
Google only returns `refresh_token` on the **first** authorization. If you've already authorized:
- Use `prompt=consent` to force re-consent
- Or revoke access at https://myaccount.google.com/permissions then re-authorize

### Token expiry
Access tokens expire in 1 hour. Always check expiry before using and refresh if needed. Store `token_expiry` as a datetime, not just the `expires_in` seconds.

### Container env not loaded
`docker compose restart` does **NOT** reload `env_file`. Use `docker compose up -d <service>` to recreate with new env.

### All-day events have no time
All-day events use `start.date` (not `start.dateTime`). Handle both formats. Block the full working day for all-day events.

### Timezone handling
Google returns `dateTime` with timezone offset (e.g. `+02:00`). Parse with `datetime.fromisoformat()`. Convert to your app's timezone if needed. UTC times end with `Z`.

### Recurring events
Use `singleEvents=true` to expand recurring events. Without it, you get a single entry with RRULE that you'd have to parse yourself.

---

## 9. Testing Checklist

- [ ] OAuth consent URL generated correctly
- [ ] Redirect URI matches Google Cloud Console
- [ ] Tokens saved after callback
- [ ] Access token auto-refreshes when expired
- [ ] Events fetched for correct date range
- [ ] Timed events create correct blocked slots
- [ ] All-day events block full working day
- [ ] Re-sync clears old blocks before creating new ones
- [ ] Disconnect removes tokens
- [ ] Frontend shows connected/disconnected state
- [ ] Frontend handles OAuth redirect query params

---

## 10. Dependencies

**Python:**
- `httpx` — HTTP client for Google API calls (already in most projects)
- No Google SDK needed — raw HTTP is simpler

**Config:**
```
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/v1/calendar/google/callback
```

**Database:**
- `google_calendar_tokens` table (user_id, access_token, refresh_token, token_expiry, calendar_id, last_synced_at)
