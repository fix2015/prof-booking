def _register_client(client, email="client@test.com"):
    resp = client.post("/api/v1/auth/register/client", json={
        "email": email,
        "phone": "+1555000999",
        "password": "testpass123",
        "name": "Test Client",
    })
    assert resp.status_code == 201, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def test_delete_me_removes_account(client):
    headers = _register_client(client)
    assert client.get("/api/v1/users/me", headers=headers).status_code == 200

    resp = client.delete("/api/v1/users/me", headers=headers)
    assert resp.status_code == 204

    # token no longer resolves to a user
    assert client.get("/api/v1/users/me", headers=headers).status_code in (401, 404)
    # login with the old credentials fails
    login = client.post("/api/v1/auth/login", json={"email": "client@test.com", "password": "testpass123"})
    assert login.status_code in (401, 404)
    # email can be registered again
    assert client.post("/api/v1/auth/register/client", json={
        "email": "client@test.com", "phone": "+1555000999", "password": "testpass123", "name": "Again",
    }).status_code == 201


def test_delete_me_requires_auth(client):
    assert client.delete("/api/v1/users/me").status_code == 401
