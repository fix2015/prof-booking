import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

SQLALCHEMY_TEST_URL = "sqlite:///./test.db"

engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def owner_token(client):
    """Create a salon owner and return auth token."""
    resp = client.post("/api/v1/auth/register/owner", json={
        "email": "owner@test.com",
        "phone": "+1234567890",
        "password": "testpass123",
        "provider_name": "Test Salon",
        "provider_address": "123 Main St",
        "worker_payment_amount": 50.0,
    })
    assert resp.status_code == 201
    return resp.json()["access_token"]


@pytest.fixture
def owner_headers(owner_token):
    return {"Authorization": f"Bearer {owner_token}"}


@pytest.fixture
def professional_headers(client, owner_headers):
    """Create a professional, attach them to the first provider as ACTIVE, return auth headers."""
    # Get the provider created by owner
    providers = client.get("/api/v1/providers/public").json()
    provider_id = providers[0]["id"]

    # Register professional and attach to provider
    resp = client.post("/api/v1/auth/register/professional", json={
        "email": "pro@test.com",
        "phone": "+1555000111",
        "password": "testpass123",
        "name": "Test Pro",
        "provider_ids": [provider_id],
    })
    assert resp.status_code == 201
    pro_token = resp.json()["access_token"]
    pro_headers = {"Authorization": f"Bearer {pro_token}"}

    # Get professional id
    me_resp = client.get("/api/v1/professionals/me", headers=pro_headers)
    assert me_resp.status_code == 200
    professional_id = me_resp.json()["id"]

    # Owner approves the professional
    approve_resp = client.patch(
        f"/api/v1/professionals/provider/{provider_id}/{professional_id}/approval",
        headers=owner_headers,
        json={"status": "active"},
    )
    assert approve_resp.status_code == 200

    return pro_headers
