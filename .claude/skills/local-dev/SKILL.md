---
name: local-dev
description: Use this skill when the user asks to run the project locally, start the dev server, run frontend/backend, or anything related to local development setup. Triggers on: "run locally", "start server", "run project", "start dev", "run frontend", "run backend", "start app", "dev server".
---

# Local Development — Start Frontend & Backend

## Prerequisites
- PostgreSQL running locally (`nail_user` / `nail_password` on port 5432)
- Redis running locally (port 6379)
- Backend venv exists at `backend/.venv/`
- Frontend deps installed (`frontend/node_modules/`)

## Start Both Servers

Always start **both** frontend and backend together. Run them in parallel:

### Backend (FastAPI on port 8000)

```bash
cd /Users/vitaliisemianchuk/Projects/salon-nail-app/backend
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
```

Wait 2-3 seconds for startup, then verify:
```bash
curl -s http://localhost:8000/api/v1/health
```

Expected: `{"status":"ok","version":"3.0.0",...}`

### Frontend (Vite on port 5174)

```bash
cd /Users/vitaliisemianchuk/Projects/salon-nail-app/frontend
yarn dev &
```

The frontend proxies `/api/*` to `http://localhost:8000` automatically (configured in `vite.config.ts`).

## URLs When Running

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5174 |
| Backend API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs (only when `APP_DEBUG=true`) |

## Before Starting — Check for Port Conflicts

```bash
lsof -i :8000 | head -3   # Backend port
lsof -i :5174 | head -3   # Frontend port
```

If ports are already in use:
- Kill the existing process: `kill -9 <PID>`
- Or the server is already running — no need to start again

## Login Credentials (local dev with prod DB clone)

- Admin: `admin@localhost` / `admin123dev`
- Check `backend/.env` for current values

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Backend won't start | Check `backend/.env` exists with `DATABASE_URL`, `APP_SECRET_KEY`, `JWT_SECRET_KEY` |
| `Port 5174 already in use` | Frontend is already running, just open the URL |
| `Port 8000 already in use` | Backend is already running, verify with health check |
| DB connection refused | Start PostgreSQL: `brew services start postgresql` |
| Redis connection refused | Start Redis: `brew services start redis` |
| Import errors | Activate venv: `source backend/.venv/bin/activate` then `pip install -r requirements.txt` |
| Frontend deps missing | `cd frontend && yarn install` |

## Clone Production DB to Local (optional)

```bash
ssh -i ~/.ssh/service.pem ubuntu@3.90.215.126 \
  "sudo docker compose -f /opt/prof-booking/infra/docker-compose.prod.yml exec -T postgres pg_dump -U nail_user nail_salon_db --no-owner --no-acl" \
  > /tmp/prod_dump.sql

psql -U vitaliisemianchuk -h localhost -d template1 -c "DROP DATABASE IF EXISTS nail_salon_db;"
psql -U vitaliisemianchuk -h localhost -d template1 -c "CREATE DATABASE nail_salon_db OWNER nail_user;"
PGPASSWORD=nail_password psql -U nail_user -h localhost -d nail_salon_db < /tmp/prod_dump.sql
```
