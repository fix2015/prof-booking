# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Figma Design System

**Rule:** Every screen element must come from the DS — no raw hex colors, no bare frames, no hardcoded font sizes. Before adding anything new, check `.claude/skills/probook-design-system.md` which documents every color token, text style, spacing token, and component (with variants). If something is missing, add it to the DS first, then use it on screen.

- **Figma file:** `1b7MQQDvlyjtMpAUVPo20M` — Design System page + Mobile App Screens page (`52:164`)
- **DS rules + full inventory:** `.claude/skills/probook-design-system.md`
- **Active migration plan + violation categories + spacing/status token reference:** `docs/redesign-plan.md`
- **Verified screens:** Main Discovery (`52:2`), Filter Sheet (`52:105`)

---

## Project Overview

Multi-tenant SaaS for nail salon booking & worker management. Monorepo with a FastAPI backend and React frontend.

**Stack:** React 18 + TypeScript + Vite + TailwindCSS + ShadCN + TanStack Query v5 / FastAPI + SQLAlchemy 2 + PostgreSQL + Redis + Celery

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

# Seed mock data (10 providers + 200 professionals, clears previous seed first)
cd backend && python scripts/seed_mock_data.py
```

### Frontend

```bash
cd frontend && yarn install   # yarn.lock is the tracked lock file

cd frontend
yarn dev             # Dev server on http://localhost:5174
yarn typecheck       # tsc --noEmit
yarn lint            # ESLint (zero warnings allowed)
yarn build           # TypeScript check + Vite build
yarn test            # Vitest unit tests
yarn test:e2e        # Playwright headless (auto-starts dev server)
yarn test:e2e:headed # With browser visible
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

**19 modules:** auth, users, salons, masters, clients, sessions, calendar, booking, payments, notifications, reports, invites, services, reviews, loyalty, invoices, analytics, uploads, admin.

**Naming migration in progress:** modules are named `salons`/`masters` internally, but the primary API prefixes are now `/api/v1/providers` and `/api/v1/professionals`. The old `/api/v1/salons` and `/api/v1/masters` prefixes remain as backward-compat aliases registered in `main.py`. The same dual-route pattern applies on the frontend (`/providers` primary, `/salons` redirects; `/professionals` primary, `/masters` redirects).

Key files:
- `config.py` — Pydantic Settings; `APP_SECRET_KEY` and `JWT_SECRET_KEY` are required (no defaults); Swagger UI only enabled when `APP_DEBUG=true`
- `database.py` — SQLAlchemy 2 engine; SQLite guards for `pool_size`/`max_overflow`
- `dependencies.py` — JWT auth guards: `get_current_user()`, `require_role()`, `get_current_owner()`

### Frontend (`frontend/src/`)

- `api/` — Typed Axios layer, one file per domain (mirrors backend modules)
- `pages/public/` — Consumer-facing route components (no auth required)
- `pages/private/` — Authenticated B2B dashboard route components
- `components/` — Shared UI; `components/ui/` contains ShadCN primitives; `components/mobile/` contains DS-compliant consumer-facing components (BookingCard, ProviderCard, FilterSheet, StatusBadge, DateSelect, etc.); `components/shared/` for cross-layout shared components (NotificationItem)
- `hooks/` — TanStack Query hooks wrapping the API layer
- `context/` — Auth context (JWT storage, user state) + ThemeContext
- `features/` — Feature-scoped modules (currently `auth/`); preferred location for new feature code
- `types/` — Shared TypeScript types

Vite dev server proxies `/api/*` to `http://localhost:8000`.

**i18n:** Custom zero-dependency utility in `src/i18n.ts`. Supported locales: `en`, `pl`, `ro`, `uk`, `es`. Add new keys to all locale objects in that file. Language is persisted in `localStorage` and switched via `<LanguageSwitcher>`.

**Notable frontend deps:**
- `yet-another-react-lightbox` — portfolio/photo gallery lightbox
- `@react-google-maps/api` — Google Maps integration
- `recharts` — analytics charts
- `react-hook-form` + `zod` — form validation

**Routing:** Two layout contexts exist in `App.tsx`:
- `<MobileLayout>` — consumer-facing tab bar (bottom nav). Routes: `/` (SalonSelectorPage), `/map`, `/saved`, `/me` (UserProfilePage). No auth required.
- `<AppLayout>` — authenticated B2B dashboard shell. Routes: `/dashboard`, `/calendar`, `/sessions`, `/professionals`, `/services`, `/reports`, `/notifications`, `/reviews`, `/analytics/owner`, `/analytics/professional`, `/invoices`, `/clients`, `/clients/:clientId`, `/admin`, `/profile/professional`, `/profile/provider`.

Routes without a layout wrapper: `/login`, `/help`, `/providers/:providerId`, `/professionals/:professionalId`, `/book/:providerId`, `/profile/client`, `/reviews/client`, `/bookings/client`, `/discover`, `/find-providers`, `/find-professionals`, `/professionals/:professionalId/split`.

`DashboardRouter` dispatches based on role: `provider_owner` → `OwnerDashboardPage`, `platform_admin` → `AdminPanelPage`, else `MasterDashboardPage`.

### Auth & Multi-tenancy

- JWT: 60-min access tokens + 30-day refresh tokens (stored in DB, rotatable)
- Roles: `PLATFORM_ADMIN` > `PROVIDER_OWNER` > `PROFESSIONAL` > `CLIENT`
- Every data table has a `provider_id` FK; all service queries filter by it
- Route handlers call `assert_owner_of_provider()` to enforce tenant isolation

### Key Flows

**Public booking** (no auth required):
```
GET /api/v1/providers/public → list salons
GET /api/v1/services/salon/:id → services with prices/durations
GET /api/v1/calendar/availability → available slots
POST /api/v1/booking/ → create booking → triggers SMS + email via Celery → returns confirmation code
```

**Upload endpoints** (`/api/v1/upload/`) are **public** (no auth required) — image upload to S3/storage is open so clients and professionals can upload photos without a JWT.

**Stripe payments:**
```
POST /api/v1/payments/checkout → create Stripe Checkout Session → return checkout_url
Client redirects to Stripe hosted page
POST /api/v1/payments/webhook ← Stripe posts on success/failure → updates session status
```

### Async Jobs

Celery workers (backed by Redis) handle SMS (Twilio) and email notifications. Beat scheduler runs nightly reminders.

**Notification rules** (who gets what, when, implementation status): `docs/notification-rules.md`.

```bash
celery -A app.modules.notifications.tasks worker --loglevel=info
celery -A app.modules.notifications.tasks beat --loglevel=info
```

---

## Production Deployment

- **Server**: `3.90.215.126` (AWS EC2, Ubuntu)
- **SSH**: `ssh -i ~/.ssh/service.pem ubuntu@3.90.215.126`
- **App dir**: `/opt/prof-booking`
- **Live URL**: https://probooking.app
- **Repo**: https://github.com/fix2015/prof-booking
- **Deploy method**: GitHub Actions → SSH → `docker compose -f docker-compose.prod.yml up -d` (pulls pre-built GHCR images)
- **Backend startup** (inside container): `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000` — migrations run automatically on every container start

```bash
# SSH and check containers
ssh -i ~/.ssh/service.pem ubuntu@3.90.215.126
sudo docker compose -f /opt/prof-booking/infra/docker-compose.prod.yml ps
sudo docker compose -f /opt/prof-booking/infra/docker-compose.prod.yml logs --tail=50 backend
```

---

## Database Migrations (Alembic)

Versions live in `backend/alembic/versions/`. Files are numbered `0001_`, `0002_`, etc. (one exception: `ec54709d7c95` sits between `0001` and `0002`). Current head: `0013`. Run `alembic history` to see the full chain.

When creating a new migration: `cd backend && alembic revision --autogenerate -m "description"` — then rename the file to follow the `NNNN_description.py` convention and set `down_revision` to the previous head.

---

## Known Compatibility Constraints

- **`bcrypt==3.2.2` is pinned** — bcrypt 4.x breaks passlib 1.7.4 on Python 3.13
- **Pydantic email**: use `pydantic[email]`, not bare `pydantic`
- **SQLAlchemy 2**: import `declarative_base` from `sqlalchemy.orm`, not `sqlalchemy.ext.declarative`
- **SQLite tests**: `pool_size`/`max_overflow` are skipped via `_is_sqlite` check in `database.py`
- **Frontend dev port**: `5174` (not 5173) — Playwright config targets this port
