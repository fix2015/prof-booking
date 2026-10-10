"""Book again (service/professional in booking history) and favourites lookup by id."""


def test_lookup_exposes_service_and_professional_for_book_again(client, owner_headers, professional_headers):
    provider_id = client.get("/api/v1/providers/public").json()[0]["id"]
    svc = client.post(f"/api/v1/services/provider/{provider_id}", headers=owner_headers,
                      json={"name": "Gel", "duration_minutes": 60, "price": 30}).json()
    pro_id = client.get("/api/v1/professionals/me", headers=professional_headers).json()["id"]
    resp = client.post("/api/v1/booking/", json={
        "provider_id": provider_id, "service_id": svc["id"], "professional_id": pro_id,
        "client_name": "Jane", "client_phone": "+447700900888", "starts_at": "2030-01-07T11:00:00",
    })
    assert resp.status_code == 201, resp.text
    history = client.get("/api/v1/booking/lookup", params={"phone": "+447700900888"}).json()
    assert history[0]["service_id"] == svc["id"]
    assert history[0]["professional_id"] == pro_id
    assert history[0]["provider_id"] == provider_id


def test_public_providers_by_ids_keeps_order_and_skips_missing(client, owner_headers):
    first = client.get("/api/v1/providers/public").json()[0]["id"]
    second = client.post("/api/v1/auth/register/owner", json={
        "email": "owner2@test.com", "phone": "+15550003333", "password": "testpass123",
        "provider_name": "Second Salon", "provider_address": "2 Main St",
    })
    assert second.status_code == 201
    ids = [p["id"] for p in client.get("/api/v1/providers/public").json()]
    other = next(i for i in ids if i != first)
    listed = client.get("/api/v1/providers/public", params={"ids": f"{other},999999,{first}"}).json()
    assert [p["id"] for p in listed] == [other, first]
    assert "review_count" in listed[0]
    assert client.get("/api/v1/providers/public", params={"ids": "x"}).status_code == 422
