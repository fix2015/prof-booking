def test_owner_can_add_update_and_delete_a_service_of_their_provider(client, owner_headers):
    provider_id = client.get("/api/v1/providers/my", headers=owner_headers).json()["id"]

    created = client.post(f"/api/v1/services/provider/{provider_id}",
                          json={"name": "Gel Manicure", "duration_minutes": 60, "price": 30}, headers=owner_headers)
    assert created.status_code == 201, created.text
    service_id = created.json()["id"]
    assert any(s["id"] == service_id for s in client.get(f"/api/v1/services/provider/{provider_id}").json())

    assert client.patch(f"/api/v1/services/{service_id}", json={"price": 35}, headers=owner_headers).status_code == 200


def test_owner_cannot_add_a_service_to_someone_elses_provider(client, owner_headers):
    other = client.post("/api/v1/auth/register/owner", json={
        "email": "other@test.com", "phone": "+1999000111", "password": "testpass123",
        "provider_name": "Other Salon", "provider_address": "1 Other St", "worker_payment_amount": 0,
    }).json()
    other_provider = client.get("/api/v1/providers/my", headers={"Authorization": f"Bearer {other['access_token']}"}).json()["id"]
    resp = client.post(f"/api/v1/services/provider/{other_provider}",
                       json={"name": "X", "duration_minutes": 30, "price": 1}, headers=owner_headers)
    assert resp.status_code == 403
