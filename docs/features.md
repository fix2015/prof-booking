# ProBook — Feature Documentation

## Overview

ProBook is a multi-tenant SaaS platform for nail salon booking & professional management. Monorepo with FastAPI backend and React frontend.

**Live:** https://probooking.app
**Repo:** https://github.com/fix2015/prof-booking

---

## User Roles

| Role | Description |
|---|---|
| **Platform Admin** | Full access — manage all providers, users, reviews |
| **Provider Owner** | Manages their salon, team, services, invoices, loyalty |
| **Professional** | Manages own schedule, views bookings & earnings |
| **Client** | Browses, books appointments, leaves reviews (no account needed for booking) |

---

## Core Features

### Public Booking (No Auth Required)
1. Client discovers providers via search, map, or category browsing
2. Selects provider → service → professional → date → time slot
3. Enters name, phone, email → confirms booking
4. Receives confirmation code via SMS + email
5. Session created with status `pending`

### Provider Discovery
- **Search**: by name, address, professional name (multi-word matching)
- **Filters**: category, price range, availability date, nationality, experience
- **Map view**: providers plotted on Google Maps with custom markers
- **Infinite scroll**: loads 24 providers at a time
- **Professional search**: matching professionals shown as clickable chips

### Calendar & Scheduling
- **Week/Day/5-Day views** with drag-to-create work slots
- **Click to edit** work slot start/end times
- **Copy schedule**: week → next week, month → next month, year → next year
- **Google Calendar sync**: OAuth 2.0, imports events as blocked slots
- **Session blocks** on calendar: click to view details, edit time, or reschedule

### Session Management
- **Status flow**: `pending` → `confirmed` → `in_progress` → `completed`
- **Auto-complete**: Celery task marks past sessions as completed every 15 min
- **Cancel**: available on all active sessions (including completed, for late cancellations)
- **Edit price**: completed sessions can have their price updated
- **Earnings recording**: mark completion + record actual earnings
- **Default filter**: "Today" view

### Services
- Professionals create services → auto-linked to their active providers
- Services linked via `service_providers` junction table (many-to-many)
- Each service has: name, duration, price, active status

### Reviews
- Clients leave star ratings + comments after sessions
- Professional receives instant Telegram + Web Push alert
- Reviews visible on professional profile page

### Analytics
- **Professional**: clients count, hours worked, sessions, revenue, monthly chart, per-location breakdown
- **Owner**: worker metrics, provider KPIs, revenue reports
- Only counts past, non-cancelled sessions (future bookings excluded)
- Provider breakdown shows provider name (not ID)

### Client Management
- View all clients who booked with you
- Client detail: booking history, notes, photos
- Add notes per client visit

---

## Payment Flow (Stripe)

```
POST /api/v1/payments/checkout → Stripe Checkout Session → checkout_url
Client redirects to Stripe hosted page → pays
POST /api/v1/payments/webhook ← Stripe callback → updates session to "confirmed"
SMS + email confirmation sent via Celery
```

---

## Authentication

- **JWT**: 15-min access tokens + 30-day refresh tokens (DB-backed, rotatable)
- **Login**: email/phone + password
- **Registration**: 3 flows — client, business owner, professional
- **Invite system**: owners send email invites to professionals with signed tokens
- **Guest booking**: clients can book without any account

---

## Notifications

### Channels

| Channel | Technology | Config |
|---|---|---|
| **SMS** | Twilio | TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER |
| **Email** | SMTP | SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD |
| **Telegram** | Bot API | TELEGRAM_BOT_TOKEN, deep-link signing with HMAC-SHA256 |
| **Web Push** | VAPID | VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY |

### Instant Notifications

| Event | Recipients | Channels |
|---|---|---|
| **New Booking** | Professional | Telegram, Web Push, In-app |
| **Booking Confirmation** | Client | SMS, Email |
| **Booking Cancelled** | Professional | Telegram, Web Push |
| **New Review** | Professional | Telegram, Web Push |

### Notification Preferences (per user)
- `daily_morning` — tomorrow's bookings summary
- `weekly_schedule` — next week's agenda
- `eod_recap` — end-of-day completed sessions + revenue
- `cancellation` — instant cancellation alerts
- `new_review` — instant new review alerts
- `appointment_reminder` — 1 hour before session

### Telegram Bot Commands
`/me` `/today` `/tomorrow` `/week` `/next` `/revenue` `/reviews` `/settings` `/help`

---

## Scheduled Tasks (Celery Beat)

| Task | Schedule | Description |
|---|---|---|
| **Morning Brief** | 8 AM UTC daily | Tomorrow's bookings summary to opted-in professionals |
| **Weekly Schedule** | Sunday 7 PM UTC | Next week's full agenda grouped by day |
| **End-of-Day Recap** | 9 PM UTC daily | Completed sessions count + revenue |
| **Appointment Reminder** | Every 15 min | "⏰ Upcoming in 1 hour" — client name, time, service |
| **Auto-Complete Sessions** | Every 15 min | Marks past sessions as `completed` (pending/confirmed/in_progress) |
| **Tomorrow Reminders** | 8 PM UTC daily | Queues SMS/email reminders for next-day bookings |

### GitHub Actions Cron

| Workflow | Schedule | Description |
|---|---|---|
| **Scrape UK Businesses** | Sunday 3 AM UTC | Scrapes UK nail/beauty businesses via Nominatim + imports to prod DB |

---

## Design System

**Figma file:** `1b7MQQDvlyjtMpAUVPo20M`

### Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `bg-primary` | #FFFFFF | Card backgrounds, inputs |
| `bg-secondary` | #F9FAFC | Page background |
| `bg-tertiary` | #F3F5F8 | Subtle hover states |
| `bg-inverse` | #111827 | Dark backgrounds |
| `text-primary` | #111827 | Main text |
| `text-secondary` | #6B7280 | Secondary text |
| `text-muted` | #4B5563 | Placeholder text |
| `text-disabled` | #D0D5DB | Disabled states |
| `text-inverse` | #FFFFFF | Text on dark bg |
| `border-default` | #E5E9EE | Input borders, dividers |
| `interactive` | #111827 | Primary buttons, links |
| `interactive-hover` | #1F2939 | Hover states |
| `feedback-saved` | #EF4444 | Heart/saved icon |
| `feedback-rating` | #FBBF24 | Star rating |
| `feedback-success` | #16A34A | Success states |
| `feedback-warning` | #F59E0B | Warning states |
| `feedback-error` | #EF4444 | Error states |
| `feedback-info` | #3B82F6 | Info states |

### Session Status Colors

| Status | Color | Background |
|---|---|---|
| pending | Yellow/Warning | bg-yellow-200 |
| confirmed | Blue/Info | bg-blue-200 |
| in_progress | Purple | bg-purple-200 |
| completed | Green/Success | bg-green-200 |
| cancelled | Gray | bg-gray-200 |

### Typography Scale
- Display: 28px Bold
- H1: 22px Bold
- H2: 20px Bold
- H3: 18px Bold
- H4: 16px SemiBold
- Body: 14px Regular
- Body Strong: 14px SemiBold
- Caption: 12px Regular
- Badge: 11px Medium

### Spacing: 4px increments (4, 8, 12, 16, 20, 24, 32, 40, 48, 56px)
### Border Radius: none(0), xs(4), sm(6), md(8), lg(10), xl(12), 2xl(16), full(9999)

---

## Internationalization (i18n)

**Locales:** English, Polish, Romanian, Ukrainian, Spanish

**Implementation:** Custom zero-dependency utility in `src/i18n.ts`. Language persisted in localStorage, switched via `<LanguageSwitcher>`.

**Currency:** GBP (£) — all prices in pounds sterling.

---

## PWA

- **Installable**: manifest with icons, standalone display mode
- **Offline caching**: Workbox with runtime caching for API calls (NetworkFirst, 10s timeout)
- **Push notifications**: Custom service worker (`sw-push.js`) for background push handling
- **Auto-update**: new versions applied on page reload

---

## Integrations

| Integration | Purpose | Config |
|---|---|---|
| **Stripe** | Payments | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET |
| **Twilio** | SMS | TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER |
| **Google Maps** | Map view | VITE_GOOGLE_MAPS_API_KEY |
| **Google Calendar** | Schedule sync | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET |
| **AWS S3** | Image storage | AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET |
| **Telegram Bot** | Notifications | TELEGRAM_BOT_TOKEN |
| **OpenStreetMap** | Business scraping | Free, no API key |

---

## Data Scraper

Scrapes UK nail/beauty businesses from OpenStreetMap Nominatim API (free).

- **2,206 businesses** across 51 UK cities
- **Categories**: Barber (713), Nails (701), Hair & Beauty (233), Spa (225), Massage (183), Beauty (129), Tanning (16), Lashes (6)
- **Multi-word search**: "NS nail" finds "NS-Nail-Salon"
- **Professional search**: searching by professional name returns their providers
- **Rate limit handling**: exponential backoff on 429 errors

---

## Infrastructure

| Component | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite + TailwindCSS + ShadCN |
| **Backend** | FastAPI + SQLAlchemy 2 + Alembic |
| **Database** | PostgreSQL 16 |
| **Cache/Queue** | Redis 7 |
| **Task Queue** | Celery |
| **Server** | AWS EC2 (Ubuntu) |
| **Containers** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions → SSH → Docker Compose |
| **Domain** | probooking.app |

### Deployment Flow
```
Push to main → CI builds Docker images → pushes to GHCR
→ Deploy workflow SSHs to EC2 → pulls images → docker compose up
→ Backend runs alembic upgrade head on startup
```
