from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import Base, engine
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.salons.router import router as salons_router
from app.modules.masters.router import router as masters_router
from app.modules.sessions.router import router as sessions_router
from app.modules.calendar.router import router as calendar_router
from app.modules.booking.router import router as booking_router
from app.modules.payments.router import router as payments_router
from app.modules.reports.router import router as reports_router
from app.modules.notifications.router import router as notifications_router
from app.modules.invites.router import router as invites_router
from app.modules.services.router import router as services_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown


app = FastAPI(
    title="NailSalon Platform API",
    description="Multi-tenant SaaS platform for nail salon booking and management",
    version="1.0.0",
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
app.include_router(salons_router, prefix=f"{API_PREFIX}/salons", tags=["salons"])
app.include_router(masters_router, prefix=f"{API_PREFIX}/masters", tags=["masters"])
app.include_router(services_router, prefix=f"{API_PREFIX}/services", tags=["services"])
app.include_router(sessions_router, prefix=f"{API_PREFIX}/sessions", tags=["sessions"])
app.include_router(calendar_router, prefix=f"{API_PREFIX}/calendar", tags=["calendar"])
app.include_router(booking_router, prefix=f"{API_PREFIX}/booking", tags=["booking"])
app.include_router(payments_router, prefix=f"{API_PREFIX}/payments", tags=["payments"])
app.include_router(reports_router, prefix=f"{API_PREFIX}/reports", tags=["reports"])
app.include_router(notifications_router, prefix=f"{API_PREFIX}/notifications", tags=["notifications"])
app.include_router(invites_router, prefix=f"{API_PREFIX}/invites", tags=["invites"])


@app.get(f"{API_PREFIX}/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}
