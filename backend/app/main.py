from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import Base, engine
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.salons.router import router as providers_router
from app.modules.masters.router import router as professionals_router
from app.modules.sessions.router import router as sessions_router
from app.modules.calendar.router import router as calendar_router
from app.modules.booking.router import router as booking_router
from app.modules.payments.router import router as payments_router
from app.modules.reports.router import router as reports_router
from app.modules.notifications.router import router as notifications_router
from app.modules.invites.router import router as invites_router
from app.modules.services.router import router as services_router
from app.modules.reviews.router import router as reviews_router
from app.modules.loyalty.router import router as loyalty_router
from app.modules.invoices.router import router as invoices_router
from app.modules.analytics.router import router as analytics_router
from app.modules.uploads.router import router as uploads_router
from app.modules.admin.router import router as admin_router
from app.modules.clients.router import router as clients_router
from app.modules.notifications.telegram_router import router as telegram_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    # Auto-create platform admin account on first boot
    from app.database import SessionLocal
    from app.modules.users.models import User, UserRole
    from app.modules.users.services import get_user_by_email, hash_password
    db = SessionLocal()
    try:
        if not get_user_by_email(db, settings.FIRST_ADMIN_EMAIL):
            db.add(User(
                email=settings.FIRST_ADMIN_EMAIL.lower(),
                hashed_password=hash_password(settings.FIRST_ADMIN_PASSWORD),
                role=UserRole.PLATFORM_ADMIN,
                is_active=True,
                is_verified=True,
            ))
            db.commit()
    finally:
        db.close()
    yield


app = FastAPI(
    title="Global Service Marketplace API",
    description="Multi-tenant SaaS platform for service provider booking and professional management",
    version="3.0.0",
    docs_url="/docs" if settings.APP_DEBUG else None,
    redoc_url="/redoc" if settings.APP_DEBUG else None,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
API_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=f"{API_PREFIX}/auth", tags=["auth"])
app.include_router(users_router, prefix=f"{API_PREFIX}/users", tags=["users"])
# Primary routes (new names)
app.include_router(providers_router, prefix=f"{API_PREFIX}/providers", tags=["providers"])
app.include_router(professionals_router, prefix=f"{API_PREFIX}/professionals", tags=["professionals"])
# Backward-compat aliases so existing frontend calls still work during migration
app.include_router(providers_router, prefix=f"{API_PREFIX}/salons", tags=["salons-compat"])
app.include_router(professionals_router, prefix=f"{API_PREFIX}/masters", tags=["masters-compat"])
app.include_router(services_router, prefix=f"{API_PREFIX}/services", tags=["services"])
app.include_router(sessions_router, prefix=f"{API_PREFIX}/sessions", tags=["sessions"])
app.include_router(calendar_router, prefix=f"{API_PREFIX}/calendar", tags=["calendar"])
app.include_router(booking_router, prefix=f"{API_PREFIX}/booking", tags=["booking"])
app.include_router(payments_router, prefix=f"{API_PREFIX}/payments", tags=["payments"])
app.include_router(reports_router, prefix=f"{API_PREFIX}/reports", tags=["reports"])
app.include_router(notifications_router, prefix=f"{API_PREFIX}/notifications", tags=["notifications"])
app.include_router(invites_router, prefix=f"{API_PREFIX}/invites", tags=["invites"])
app.include_router(reviews_router, prefix=f"{API_PREFIX}/reviews", tags=["reviews"])
app.include_router(loyalty_router, prefix=f"{API_PREFIX}/loyalty", tags=["loyalty"])
app.include_router(invoices_router, prefix=f"{API_PREFIX}/invoices", tags=["invoices"])
app.include_router(analytics_router, prefix=f"{API_PREFIX}/analytics", tags=["analytics"])
app.include_router(uploads_router, prefix=f"{API_PREFIX}/upload", tags=["upload"])
app.include_router(admin_router, prefix=f"{API_PREFIX}/admin", tags=["admin"])
app.include_router(clients_router, prefix=f"{API_PREFIX}/clients", tags=["clients"])
app.include_router(telegram_router, prefix=f"{API_PREFIX}/telegram", tags=["telegram"])


@app.get(f"{API_PREFIX}/health")
def health_check():
    return {"status": "ok", "version": "3.0.0", "platform": "Global Service Marketplace"}
