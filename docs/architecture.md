# Architecture

## Overview

NailSalon Platform is a multi-tenant SaaS built on a clean monorepo with a React frontend and FastAPI backend.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│  Browser (PWA)   ·   Mobile Browser   ·   Embedded Booking      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│                     NGINX (port 80/443)                          │
│   Static files (React SPA)  |  Reverse proxy → :8000            │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│              FastAPI Backend  (:8000)                            │
│                                                                  │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐            │
│  │  auth   │ │ salons  │ │ masters  │ │ booking  │            │
│  ├─────────┤ ├─────────┤ ├──────────┤ ├──────────┤            │
│  │sessions │ │calendar │ │payments  │ │ reports  │            │
│  ├─────────┤ ├─────────┤ ├──────────┤ ├──────────┤            │
│  │ invites │ │services │ │notifs    │ │  users   │            │
│  └─────────┘ └─────────┘ └──────────┘ └──────────┘            │
│                                                                  │
│  JWT Auth   |   SQLAlchemy ORM   |   Pydantic Schemas           │
└─────────────────────┬────────────────────┬──────────────────────┘
                      │                    │
        ┌─────────────▼──┐      ┌──────────▼──────────┐
        │  PostgreSQL 16 │      │     Redis 7           │
        │  (primary DB)  │      │  Cache + Task Queue   │
        └────────────────┘      └──────────┬────────────┘
                                           │
                                ┌──────────▼────────────┐
                                │   Celery Workers       │
                                │   + Beat Scheduler     │
                                └───────────────────────┘
```

## Multi-Tenancy

Data isolation is enforced at the application layer:
- Every table with tenant data has a `salon_id` foreign key
- Services always query with `salon_id` filter
- Salon owners can only access their own salon's data
- Platform admins can access all data

## Authentication Flow

```
Client → POST /auth/login → {access_token (60min), refresh_token (30d)}
Client → API request with Bearer token
Client → POST /auth/refresh → rotate tokens
Client → POST /auth/logout → revoke all refresh tokens
```

Access tokens are short-lived JWTs. Refresh tokens are stored in the database and can be revoked server-side.

## Booking Flow

```
Client → GET /salons/public           → list salons
Client → GET /services/salon/:id      → list services (with prices/durations)
Client → GET /masters/salon/:id/public → list masters
Client → GET /calendar/availability   → available time slots
Client → POST /booking/               → create booking (no auth required)
Server → queue SMS + email notifications via Celery
Server → return confirmation code
```

## Module Structure

Each backend module follows the same pattern:
```
module/
  __init__.py
  models.py    - SQLAlchemy ORM models
  schemas.py   - Pydantic request/response schemas
  services.py  - Business logic (no HTTP knowledge)
  router.py    - FastAPI route handlers
```

## Background Jobs

Celery with Redis broker handles:
- **booking_confirmation**: Triggered immediately after booking
- **booking_reminder**: Sent ~24h before appointment
- **daily_reminders**: Beat-scheduled task runs nightly

## Payment Flow

```
Client → POST /payments/checkout (session_id, type)
Server → create Stripe Checkout Session
Server → return checkout_url
Client → redirect to Stripe hosted payment page
Stripe → POST /payments/webhook (on success/failure)
Server → update session status to confirmed
```

## Frontend Architecture

```
src/
  api/         - Typed API layer (axios + TypeScript)
  context/     - React Context for global state (Auth)
  hooks/       - TanStack Query hooks (data fetching + mutations)
  components/  - Reusable UI components
  pages/       - Route-level page components
  utils/       - Pure utility functions
  types/       - Shared TypeScript types
```

Data fetching uses TanStack Query v5 for caching, refetching, and optimistic updates.
