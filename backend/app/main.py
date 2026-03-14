import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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
from app.modules.reviews.router import router as reviews_router
from app.modules.loyalty.router import router as loyalty_router
from app.modules.invoices.router import router as invoices_router
from app.modules.analytics.router import router as analytics_router
from app.modules.uploads.router import router as uploads_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    os.makedirs("uploads", exist_ok=True)
    yield
    # Shutdown


app = FastAPI(
    title="Beauty Platform API",
    description="Multi-tenant SaaS platform for beauty salon booking and management",
    version="2.0.0",
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
app.include_router(reviews_router, prefix=f"{API_PREFIX}/reviews", tags=["reviews"])
app.include_router(loyalty_router, prefix=f"{API_PREFIX}/loyalty", tags=["loyalty"])
app.include_router(invoices_router, prefix=f"{API_PREFIX}/invoices", tags=["invoices"])
app.include_router(analytics_router, prefix=f"{API_PREFIX}/analytics", tags=["analytics"])
app.include_router(uploads_router, prefix=f"{API_PREFIX}/upload", tags=["upload"])

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get(f"{API_PREFIX}/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}
