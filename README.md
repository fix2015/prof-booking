# NailSalon Platform

A multi-tenant SaaS platform for nail salon booking and worker management.

## Features

- **Multi-tenant**: Each salon's data is fully isolated
- **Online booking**: Clients can book without registration
- **Master management**: Workers managed per-salon with approval workflow
- **Calendar**: Full week/day view with availability blocks
- **Analytics**: Revenue, session, and performance reports
- **Payments**: Stripe integration for deposits and full payments
- **Notifications**: SMS via Twilio + email confirmations
- **PWA**: Installable, offline-capable frontend

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, ShadCN, TanStack Query |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2, Alembic, Redis |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh tokens) |
| Payments | Stripe |
| SMS | Twilio |
| DevOps | Docker, docker-compose, GitHub Actions |

## Monorepo Structure

```
nail-salon-platform/
├── backend/          # FastAPI application
├── frontend/         # React + Vite application
├── infra/            # docker-compose and infra config
├── docs/             # Architecture and API docs
└── .github/workflows # CI/CD pipelines
```

## Quick Start

```bash
# Clone
git clone https://github.com/your-org/nail-salon-platform
cd nail-salon-platform

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start all services
cd infra
docker compose up -d

# Run migrations
docker compose exec backend alembic upgrade head
```

Backend API: http://localhost:8000/docs
Frontend: http://localhost:5173

## User Roles

| Role | Description |
|---|---|
| Platform Admin | Full access to all salons and users |
| Salon Owner | Manages their salon, approves masters |
| Master | Manages own calendar, views sessions |
| Client | Books appointments (no account needed) |

## Development

See [docs/deployment.md](docs/deployment.md) for full setup instructions.

## License

MIT
