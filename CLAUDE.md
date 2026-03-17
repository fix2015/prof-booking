# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant SaaS for nail salon booking & worker management. Monorepo with a FastAPI backend and React frontend.

**Stack:** React 18 + TypeScript + Vite + TanStack Query v5 / FastAPI + SQLAlchemy 2 + PostgreSQL + Redis + Celery

---

## Commands

### Backend

```bash
# Setup (first time)
cd backend && python3.12 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt

# Run dev server (requires postgres + redis running)
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Run migrations
cd backend && alembic upgrade head

# Run all tests (uses SQLite, no external services needed)
cd backend
APP_SECRET_KEY=test-secret-key-for-ci \
JWT_SECRET_KEY=test-jwt-secret-for-ci \
DATABASE_URL=sqlite:///./test.db \
REDIS_URL=redis://localhost:6379/0 \
.venv/bin/pytest tests/ -v

# Run a single test file
APP_SECRET_KEY=test-secret-key-for-ci \
JWT_SECRET_KEY=test-jwt-secret-for-ci \
DATABASE_URL=sqlite:///./test.db \
REDIS_URL=redis://localhost:6379/0 \
.venv/bin/pytest tests/test_auth.py -v

# Lint
cd backend && ruff check .
```

### Frontend

```bash
cd frontend && npm install

npm run dev          # Dev server on http://localhost:5174
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint (zero warnings allowed)
npm run build        # TypeScript check + Vite build
npm run test:e2e     # Playwright headless (auto-starts dev server)
npm run test:e2e:headed  # With browser visible
```

### Full stack via Docker

```bash
cd infra && docker compose up -d        # Starts postgres, redis, backend, celery, frontend
docker compose logs -f backend
docker compose down
```

---

## Architecture

### Backend (`backend/app/`)

All routers registered in `main.py` under `/api/v1/`. Each feature module lives in `modules/<name>/` and follows the pattern: `models.py` → `schemas.py` → `services.py` → `router.py`.

**17 modules:** auth, users, salons, masters, sessions, calendar, booking, payments, notifications, reports, invites, services, reviews, loyalty, invoices, analytics, uploads.

**Naming migration in progress:** modules are named `salons`/`masters` internally, but the primary API prefixes are now `/api/v1/providers` and `/api/v1/professionals`. The old `/api/v1/salons` and `/api/v1/masters` prefixes remain as backward-compat aliases. The same dual-route pattern applies on the frontend (`/providers` primary, `/salons` redirects; `/professionals` primary, `/masters` redirects).

Key files:
- `config.py` — Pydantic Settings; `APP_SECRET_KEY` and `JWT_SECRET_KEY` are required (no defaults); Swagger UI only enabled when `APP_DEBUG=true`
- `database.py` — SQLAlchemy 2 engine; SQLite guards for `pool_size`/`max_overflow`
- `dependencies.py` — JWT auth guards: `get_current_user()`, `require_role()`, `get_current_owner()`

### Frontend (`frontend/src/`)

- `api/` — Typed Axios layer, one file per domain (mirrors backend modules)
- `pages/` — Route-level components
- `components/` — Shared UI; `components/ui/` contains ShadCN primitives
- `hooks/` — TanStack Query hooks wrapping the API layer
- `context/` — Auth context (JWT storage, user state) + ThemeContext
- `features/` — Feature-scoped modules (currently `auth/`); preferred location for new feature code
- `types/` — Shared TypeScript types

Vite dev server proxies `/api/*` to `http://localhost:8000`.

**Routing:** Public routes (no auth) render standalone. Authenticated routes are wrapped in `<AppLayout>`. `DashboardRouter` dispatches to the correct dashboard page based on role (`provider_owner` → `OwnerDashboardPage`, `platform_admin` → `AdminPanelPage`, else `MasterDashboardPage`).

### Auth & Multi-tenancy

- JWT: 60-min access tokens + 30-day refresh tokens (stored in DB, rotatable)
- Roles: `PLATFORM_ADMIN` > `PROVIDER_OWNER` > `PROFESSIONAL` > `CLIENT`
- Every data table has a `provider_id` FK; all service queries filter by it
- Route handlers call `assert_owner_of_salon()` to enforce tenant isolation

### Key Flows

**Public booking** (no auth required):
```
GET /api/v1/providers/public → list salons
GET /api/v1/services/salon/:id → services with prices/durations
GET /api/v1/calendar/availability → available slots
POST /api/v1/booking/ → create booking → triggers SMS + email via Celery → returns confirmation code
```

**Stripe payments:**
```
POST /api/v1/payments/checkout → create Stripe Checkout Session → return checkout_url
Client redirects to Stripe hosted page
POST /api/v1/payments/webhook ← Stripe posts on success/failure → updates session status
```

### Async Jobs

Celery workers (backed by Redis) handle SMS (Twilio) and email notifications. Beat scheduler runs nightly reminders.

```bash
celery -A app.modules.notifications.tasks worker --loglevel=info
celery -A app.modules.notifications.tasks beat --loglevel=info
```

---

## Known Compatibility Constraints

- **`bcrypt==3.2.2` is pinned** — bcrypt 4.x breaks passlib 1.7.4 on Python 3.13
- **Pydantic email**: use `pydantic[email]`, not bare `pydantic`
- **SQLAlchemy 2**: import `declarative_base` from `sqlalchemy.orm`, not `sqlalchemy.ext.declarative`
- **SQLite tests**: `pool_size`/`max_overflow` are skipped via `_is_sqlite` check in `database.py`
- **Frontend dev port**: `5174` (not 5173) — Playwright config targets this port
