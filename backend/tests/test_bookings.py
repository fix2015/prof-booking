from datetime import datetime, timedelta
from fastapi.testclient import TestClient


def test_public_booking_flow(client: TestClient, owner_headers: dict, professional_headers: dict):
    # Get provider
    providers_resp = client.get("/api/v1/providers/public")
    assert providers_resp.status_code == 200
    providers = providers_resp.json()
    assert len(providers) >= 1
    provider_id = providers[0]["id"]

    # Get services
    svc_resp = client.get(f"/api/v1/services/provider/{provider_id}")
    assert svc_resp.status_code == 200

    # Create a service as professional (only professionals can manage services)
    svc_create = client.post(
        f"/api/v1/services/provider/{provider_id}",
        headers=professional_headers,
        json={"name": "Gel Manicure", "duration_minutes": 60, "price": 45.0},
    )
    assert svc_create.status_code == 201
    service_id = svc_create.json()["id"]

    # Book appointment
    starts_at = (datetime.utcnow() + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
    booking_resp = client.post("/api/v1/booking/", json={
        "provider_id": provider_id,
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
        "provider_id": 1,
        "service_id": 1,
        "client_name": "",
        "client_phone": "+1111111111",
        "starts_at": datetime.utcnow().isoformat(),
    })
    assert resp.status_code == 422


def test_get_services(client: TestClient, owner_headers: dict, professional_headers: dict):
    providers = client.get("/api/v1/providers/public").json()
    provider_id = providers[0]["id"]

    client.post(
        f"/api/v1/services/provider/{provider_id}",
        headers=professional_headers,
        json={"name": "Manicure", "duration_minutes": 60, "price": 30.0},
    )
    resp = client.get(f"/api/v1/services/provider/{provider_id}")
    assert resp.status_code == 200
    services = resp.json()
    assert len(services) >= 1
