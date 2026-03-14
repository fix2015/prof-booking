import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient


def test_public_booking_flow(client: TestClient, owner_headers: dict):
    # Get salon
    salons_resp = client.get("/api/v1/salons/public")
    assert salons_resp.status_code == 200
    salons = salons_resp.json()
    assert len(salons) >= 1
    salon_id = salons[0]["id"]

    # Get services
    svc_resp = client.get(f"/api/v1/services/salon/{salon_id}")
    assert svc_resp.status_code == 200

    # Create a service first
    svc_create = client.post(
        f"/api/v1/services/salon/{salon_id}",
        headers=owner_headers,
        json={"name": "Gel Manicure", "duration_minutes": 60, "price": 45.0},
    )
    assert svc_create.status_code == 201
    service_id = svc_create.json()["id"]

    # Book appointment
    starts_at = (datetime.utcnow() + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
    booking_resp = client.post("/api/v1/booking/", json={
        "salon_id": salon_id,
        "service_id": service_id,
        "client_name": "Jane Doe",
        "client_phone": "+1987654321",
        "starts_at": starts_at.isoformat(),
    })
    assert booking_resp.status_code == 201
    data = booking_resp.json()
    assert data["client_name"] == "Jane Doe"
    assert "confirmation_code" in data
    assert data["session_id"] > 0


def test_booking_requires_name(client: TestClient):
    resp = client.post("/api/v1/booking/", json={
        "salon_id": 1,
        "service_id": 1,
        "client_name": "",
        "client_phone": "+1111111111",
        "starts_at": datetime.utcnow().isoformat(),
    })
    assert resp.status_code == 422


def test_get_services(client: TestClient, owner_headers: dict):
    salons = client.get("/api/v1/salons/public").json()
    salon_id = salons[0]["id"]

    client.post(
        f"/api/v1/services/salon/{salon_id}",
        headers=owner_headers,
        json={"name": "Manicure", "duration_minutes": 60, "price": 30.0},
    )
    resp = client.get(f"/api/v1/services/salon/{salon_id}")
    assert resp.status_code == 200
    services = resp.json()
    assert len(services) >= 1
