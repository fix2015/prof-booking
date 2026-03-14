# Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose v2
- A Linux VPS (Ubuntu 22.04 LTS recommended), 2+ vCPU, 4 GB RAM
- Domain name with DNS A-records pointing to the server
- Accounts: Stripe, Twilio, SMTP provider (SendGrid, Mailgun, etc.)

---

## Environment Setup

### 1. Clone and configure

```bash
git clone https://github.com/your-org/nail-salon-platform.git
cd nail-salon-platform/infra
cp .env.example .env
```

Edit `.env` with production values:

```env
# Database
POSTGRES_USER=nail_user
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=nail_salon_db

# Backend — copy these to backend/.env as well
APP_SECRET_KEY=<64-char-hex>
JWT_SECRET_KEY=<64-char-hex>
DATABASE_URL=postgresql://nail_user:<password>@postgres:5432/nail_salon_db
REDIS_URL=redis://redis:6379/0

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_PHONE=+1...

# SMTP
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG....
EMAIL_FROM=noreply@yourdomain.com

# Frontend
VITE_API_URL=https://api.yourdomain.com
```

Generate secrets:
```bash
openssl rand -hex 32   # use twice: APP_SECRET_KEY, JWT_SECRET_KEY
```

### 2. Backend env file

```bash
cp backend/.env.example backend/.env
# populate with same values as above
```

---

## Docker Compose (Production)

The `infra/docker-compose.yml` defines all services. Start everything:

```bash
cd infra
docker compose up -d
```

**Services:**

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 (internal) | PostgreSQL 16 |
| `redis` | 6379 (internal) | Redis 7 |
| `backend` | 8000 | FastAPI (uvicorn 4 workers) |
| `celery_worker` | — | Async notification tasks |
| `celery_beat` | — | Scheduled daily reminders |
| `frontend` | 80 | React app via nginx |

### Apply database migrations

Migrations run automatically on backend container startup via the entrypoint. To run manually:

```bash
docker compose exec backend alembic upgrade head
```

### Seed default data (optional)

```bash
docker compose exec backend python -m app.seed
```

---

## Reverse Proxy (Nginx + SSL)

Install nginx and certbot on the host:

```bash
apt install nginx certbot python3-certbot-nginx
```

### `/etc/nginx/sites-available/nail-salon`

```nginx
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
ln -s /etc/nginx/sites-available/nail-salon /etc/nginx/sites-enabled/
certbot --nginx -d yourdomain.com -d api.yourdomain.com
nginx -t && systemctl reload nginx
```

---

## CI/CD via GitHub Actions

The `.github/workflows/ci.yml` pipeline runs on every push to `main` or `develop`.

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | Server IP or hostname |
| `DEPLOY_USER` | SSH user (e.g. `deploy`) |
| `DEPLOY_SSH_KEY` | Private SSH key (PEM) |

### Pipeline stages

1. **backend-test** — pytest with PostgreSQL service container
2. **backend-lint** — ruff linter
3. **frontend-build** — typecheck + ESLint + Vite build
4. **docker-build** — builds and pushes images to GHCR (main branch only)
5. **deploy** — SSH into server, `docker compose pull && up -d`, run migrations, prune old images

### Setting up the deploy user

```bash
# On the server
useradd -m -s /bin/bash deploy
usermod -aG docker deploy
mkdir -p /srv/nail-salon-platform
chown deploy:deploy /srv/nail-salon-platform

# Copy docker-compose.yml and .env to /srv/nail-salon-platform
```

Add the deploy user's public key to `~/.ssh/authorized_keys` and put the matching private key in the `DEPLOY_SSH_KEY` GitHub secret.

### GHCR authentication

The pipeline uses `GITHUB_TOKEN` (automatically provided) to push images to `ghcr.io/<org>/<repo>`. No extra setup needed.

---

## Stripe Webhook Setup

1. In the Stripe dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://api.yourdomain.com/api/v1/payments/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
4. Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET` in `.env`

---

## Backups

### Automated daily PostgreSQL dump

```bash
# /etc/cron.d/nail-salon-backup
0 3 * * * deploy docker exec infra-postgres-1 pg_dump -U nail_user nail_salon_db | gzip > /backups/nail_$(date +\%Y\%m\%d).sql.gz
```

Retain 30 days:
```bash
find /backups -name "nail_*.sql.gz" -mtime +30 -delete
```

### Restore from backup

```bash
gunzip -c /backups/nail_20260101.sql.gz | docker exec -i infra-postgres-1 psql -U nail_user nail_salon_db
```

---

## Monitoring

### Health check endpoint

```
GET /api/v1/health
→ { "status": "ok", "db": "ok", "redis": "ok" }
```

### Log tailing

```bash
docker compose logs -f backend
docker compose logs -f celery_worker
```

### Uptime monitoring

Use [UptimeRobot](https://uptimerobot.com) or similar — monitor `https://api.yourdomain.com/api/v1/health` every 5 minutes.

---

## Scaling

| Bottleneck | Solution |
|------------|----------|
| High API traffic | Increase `--workers` in uvicorn CMD, or run multiple backend replicas behind a load balancer |
| Slow notifications | Add more Celery workers: `docker compose up -d --scale celery_worker=3` |
| Database load | Add `pgbouncer` connection pooler, or migrate to managed RDS/Cloud SQL |
| File storage | Replace local uploads with S3-compatible storage (MinIO or AWS S3) |

---

## Updating

```bash
cd /srv/nail-salon-platform
docker compose pull
docker compose up -d --no-build
docker compose exec -T backend alembic upgrade head
docker system prune -f
```

Or push to `main` and let the GitHub Actions deploy job handle it automatically.
