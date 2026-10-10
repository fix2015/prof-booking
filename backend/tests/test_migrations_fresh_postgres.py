"""A freshly migrated PostgreSQL database (``alembic upgrade head``) must accept bookings,
including the notification row they write (regression: 0014 created lower-case enum labels).

Needs a PostgreSQL server: uses MIGRATION_TEST_DATABASE_URL, or DATABASE_URL when it points at
PostgreSQL (as in CI). A throw-away database is created and dropped on that server.
"""
import os
import subprocess
import sys
import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

from app.database import get_db
from app.main import app

BACKEND_DIR = Path(__file__).resolve().parent.parent
_BASE_URL = os.environ.get("MIGRATION_TEST_DATABASE_URL") or os.environ.get("DATABASE_URL", "")

pytestmark = pytest.mark.skipif(
    not _BASE_URL.startswith("postgresql"), reason="needs a PostgreSQL server (MIGRATION_TEST_DATABASE_URL)"
)


@pytest.fixture(scope="module")
def fresh_db_url():
    base = make_url(_BASE_URL)
    name = f"probook_migtest_{uuid.uuid4().hex[:10]}"
    admin = create_engine(base.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        conn.execute(text(f'CREATE DATABASE "{name}"'))
    url = base.set(database=name).render_as_string(hide_password=False)
    try:
        env = {**os.environ, "DATABASE_URL": url}
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=BACKEND_DIR, env=env, capture_output=True, text=True,
        )
        assert result.returncode == 0, result.stdout + result.stderr
        yield url
    finally:
        with admin.connect() as conn:
            conn.execute(text(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = :n AND pid <> pg_backend_pid()"
            ), {"n": name})
            conn.execute(text(f'DROP DATABASE IF EXISTS "{name}"'))
        admin.dispose()


def test_fresh_upgrade_has_code_matching_enum_labels(fresh_db_url):
    engine = create_engine(fresh_db_url)
    try:
        with engine.connect() as conn:
            labels = dict(conn.execute(text(
                "SELECT t.typname, array_agg(e.enumlabel::text ORDER BY e.enumsortorder) FROM pg_type t "
                "JOIN pg_enum e ON e.enumtypid = t.oid "
                "WHERE t.typname IN ('notificationtype', 'notificationstatus') GROUP BY t.typname"
            )).all())
            head = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
    finally:
        engine.dispose()
    assert head == "0022"
    assert labels["notificationstatus"] == ["PENDING", "SENT", "FAILED"]
    assert set(labels["notificationtype"]) == {
        "SMS_CONFIRMATION", "SMS_REMINDER", "EMAIL_CONFIRMATION", "EMAIL_REMINDER", "TELEGRAM", "WEB_PUSH",
    }


def test_booking_with_notification_on_freshly_migrated_db(fresh_db_url):
    engine = create_engine(fresh_db_url)
    Local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = Local()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    try:
        client = TestClient(app)  # no lifespan: schema comes from migrations only
        owner = client.post("/api/v1/auth/register/owner", json={
            "email": "mig-owner@test.com", "phone": "+15550001212", "password": "testpass123",
            "provider_name": "Migrated Salon", "provider_address": "1 Fresh St",
        })
        assert owner.status_code == 201, owner.text
        owner_h = {"Authorization": f"Bearer {owner.json()['access_token']}"}
        provider_id = client.get("/api/v1/providers/public").json()[0]["id"]
        svc = client.post(f"/api/v1/services/provider/{provider_id}", headers=owner_h,
                          json={"name": "Gel", "duration_minutes": 60, "price": 30})
        assert svc.status_code in (200, 201), svc.text
        pro = client.post("/api/v1/auth/register/professional", json={
            "email": "mig-pro@test.com", "phone": "+15550001313", "password": "testpass123",
            "name": "Mig Pro", "provider_ids": [provider_id],
        })
        assert pro.status_code == 201, pro.text
        pro_h = {"Authorization": f"Bearer {pro.json()['access_token']}"}
        pro_id = client.get("/api/v1/professionals/me", headers=pro_h).json()["id"]

        r = client.post("/api/v1/booking/", json={
            "provider_id": provider_id, "service_id": svc.json()["id"], "professional_id": pro_id,
            "client_name": "Fresh Client", "client_phone": "+447700900123", "starts_at": "2030-03-04T10:00:00",
        })
        assert r.status_code == 201, r.text
        session_id = r.json()["session_id"]

        rows = db.execute(text(
            "SELECT notification_type::text, status::text FROM notifications WHERE session_id = :s"
        ), {"s": session_id}).all()
        assert ("SMS_CONFIRMATION", "PENDING") in rows
    finally:
        app.dependency_overrides.clear()
        db.close()
        engine.dispose()
