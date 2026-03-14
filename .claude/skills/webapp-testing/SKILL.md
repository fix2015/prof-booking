---
name: webapp-testing
description: Use this skill when writing, running, or debugging Playwright end-to-end tests for the nail salon frontend. Triggers on: "write E2E tests", "run frontend tests", "test the booking flow", "Playwright", "test UI", "automate browser", or any request to test frontend pages/components.
---

# Web App Testing — Nail Salon Platform

## Stack
- **Framework**: Playwright (Python) via `frontend/tests/`
- **Dev server**: Vite on port 5173 (`npm run dev` in `frontend/`)
- **Helper**: Use `with_server.py` to start Vite before running tests

## Starting the dev server for tests

```bash
cd frontend && npm run dev &
# wait for "Local: http://localhost:5173"
```

Or use the helper wrapper:
```bash
python .claude/skills/webapp-testing/scripts/with_server.py \
  --server "npm run dev" --port 5173 --cwd frontend \
  -- python frontend/tests/test_booking.py
```

## Critical: wait for JS

Always call `page.wait_for_load_state('networkidle')` before querying the DOM in dynamic React pages.

```python
page.goto("http://localhost:5173/salons")
page.wait_for_load_state('networkidle')
# Now it's safe to query
```

## Key pages to test

| Route | What to test |
|-------|-------------|
| `/` | Redirects to `/login` when unauthenticated |
| `/salons` | Public salon list loads |
| `/book/:salonId` | Full booking form: service → master → date → time → client info → confirm |
| `/login` | Form validation, success redirect |
| `/dashboard` | Role-based redirect (owner vs master) |
| `/calendar` | Work slot grid renders |
| `/sessions` | Filter tabs work |

## Selector conventions

Prefer role/text selectors:
```python
page.get_by_role("button", name="Book Now")
page.get_by_label("Email")
page.get_by_text("Manicure")
```

Fall back to data-testid or CSS:
```python
page.locator('[data-testid="booking-form"]')
page.locator('.session-card')
```

## Test file locations

```
frontend/
  tests/
    conftest.py          # browser fixture
    test_booking.py      # public booking flow
    test_auth.py         # login / register
    test_dashboard.py    # owner & master dashboards
    test_calendar.py     # work slot management
```

## API mocking

Use `page.route()` to intercept API calls during tests so tests don't need a live backend:
```python
page.route("**/api/v1/services/salon/*", lambda r: r.fulfill(
    status=200,
    content_type="application/json",
    body='[{"id":1,"name":"Manicure","duration_minutes":60,"price":30}]'
))
```

## Running tests

```bash
cd frontend
npx playwright install chromium
npx playwright test            # all tests
npx playwright test test_booking  # single file
npx playwright test --headed   # visible browser
```
