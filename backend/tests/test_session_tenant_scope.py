"""Session read/mutation endpoints are limited to admin, the provider's owner and the assigned professional."""


def _booking(client, owner_headers, professional_headers):
    provider_id = client.get("/api/v1/providers/public").json()[0]["id"]
    svc = client.post(f"/api/v1/services/provider/{provider_id}", headers=owner_headers,
                      json={"name": "Gel Manicure", "duration_minutes": 60, "price": 30}).json()
    pro_id = client.get("/api/v1/professionals/me", headers=professional_headers).json()["id"]
    r = client.post("/api/v1/booking/", json={
        "provider_id": provider_id, "service_id": svc["id"], "professional_id": pro_id,
        "client_name": "Client", "client_phone": "+447700900009", "starts_at": "2030-02-04T10:00:00",
    })
    assert r.status_code == 201, r.text
    return provider_id, r.json()["session_id"]


def _other_owner(client):
    r = client.post("/api/v1/auth/register/owner", json={
        "email": "intruder@test.com", "phone": "+15550007777", "password": "testpass123",
        "provider_name": "Intruder Salon", "provider_address": "1 Other St",
    })
    assert r.status_code == 201, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _other_professional(client, provider_id):
    r = client.post("/api/v1/auth/register/professional", json={
        "email": "pro2@test.com", "phone": "+15550008888", "password": "testpass123",
        "name": "Other Pro", "provider_ids": [provider_id],
    })
    assert r.status_code == 201, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_other_providers_owner_cannot_touch_session(client, owner_headers, professional_headers):
    _, sid = _booking(client, owner_headers, professional_headers)
    intruder = _other_owner(client)

    assert client.patch(f"/api/v1/sessions/{sid}", json={"price": 1},
                        headers=intruder).status_code == 403
    assert client.patch(f"/api/v1/sessions/{sid}", json={"status": "cancelled"},
                        headers=intruder).status_code == 403
    assert client.post(f"/api/v1/sessions/{sid}/earnings", json={"earnings_amount": 5},
                       headers=intruder).status_code == 403
    assert client.get(f"/api/v1/sessions/{sid}", headers=intruder).status_code == 403
    assert client.get(f"/api/v1/sessions/{sid}/confirmation.pdf", headers=intruder).status_code == 403
    assert client.patch(f"/api/v1/sessions/{sid}", json={"price": 1}).status_code == 401
    # unchanged
    assert client.get(f"/api/v1/sessions/{sid}", headers=owner_headers).json()["price"] == 30


def test_own_owner_can_update_session(client, owner_headers, professional_headers):
    _, sid = _booking(client, owner_headers, professional_headers)
    r = client.patch(f"/api/v1/sessions/{sid}", json={"price": 42, "status": "confirmed"}, headers=owner_headers)
    assert r.status_code == 200, r.text
    assert r.json()["price"] == 42
    r = client.post(f"/api/v1/sessions/{sid}/earnings", json={"earnings_amount": 20}, headers=owner_headers)
    assert r.status_code == 200 and r.json()["status"] == "completed"


def test_professional_limited_to_assigned_sessions(client, owner_headers, professional_headers):
    provider_id, sid = _booking(client, owner_headers, professional_headers)
    # the assigned professional may update
    r = client.patch(f"/api/v1/sessions/{sid}", json={"price": 35}, headers=professional_headers)
    assert r.status_code == 200, r.text
    # a professional of the same provider who is not assigned may not
    other_pro = _other_professional(client, provider_id)
    assert client.patch(f"/api/v1/sessions/{sid}", json={"price": 1},
                        headers=other_pro).status_code == 403
    assert client.get(f"/api/v1/sessions/{sid}", headers=other_pro).status_code == 403


def test_reassignment_must_stay_within_provider(client, owner_headers, professional_headers):
    _, sid = _booking(client, owner_headers, professional_headers)
    other_pro_id = client.post("/api/v1/auth/register/professional", json={
        "email": "pro3@test.com", "phone": "+15550009999", "password": "testpass123",
        "name": "Elsewhere Pro", "provider_ids": [],
    })
    assert other_pro_id.status_code == 201, other_pro_id.text
    hdrs = {"Authorization": f"Bearer {other_pro_id.json()['access_token']}"}
    foreign_id = client.get("/api/v1/professionals/me", headers=hdrs).json()["id"]
    assert client.patch(f"/api/v1/sessions/{sid}", json={"professional_id": foreign_id},
                        headers=owner_headers).status_code == 404
