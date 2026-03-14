import pytest
from fastapi.testclient import TestClient


def test_register_owner(client: TestClient):
    resp = client.post("/api/v1/auth/register/owner", json={
        "email": "owner@example.com",
        "phone": "+1234567890",
        "password": "securepass123",
        "salon_name": "My Nail Salon",
        "salon_address": "456 Oak Ave",
        "worker_payment_amount": 40.0,
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["role"] == "salon_owner"


def test_register_duplicate_email(client: TestClient):
    payload = {
        "email": "dup@example.com",
        "phone": "+1234567890",
        "password": "securepass123",
        "salon_name": "Salon A",
        "salon_address": "123 St",
        "worker_payment_amount": 0,
    }
    client.post("/api/v1/auth/register/owner", json=payload)
    resp = client.post("/api/v1/auth/register/owner", json=payload)
    assert resp.status_code == 409


def test_login_success(client: TestClient):
    client.post("/api/v1/auth/register/owner", json={
        "email": "login@example.com",
        "phone": "+1234567890",
        "password": "mypassword1",
        "salon_name": "Login Salon",
        "salon_address": "789 St",
        "worker_payment_amount": 0,
    })
    resp = client.post("/api/v1/auth/login", json={
        "email": "login@example.com",
        "password": "mypassword1",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_login_wrong_password(client: TestClient):
    client.post("/api/v1/auth/register/owner", json={
        "email": "wrong@example.com",
        "phone": "+1234567890",
        "password": "correctpass1",
        "salon_name": "W Salon",
        "salon_address": "1 St",
        "worker_payment_amount": 0,
    })
    resp = client.post("/api/v1/auth/login", json={
        "email": "wrong@example.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


def test_get_me(client: TestClient, owner_headers: dict):
    resp = client.get("/api/v1/users/me", headers=owner_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "owner@test.com"
    assert data["role"] == "salon_owner"


def test_refresh_token(client: TestClient):
    reg = client.post("/api/v1/auth/register/owner", json={
        "email": "refresh@example.com",
        "phone": "+1234567890",
        "password": "refreshpass1",
        "salon_name": "Refresh Salon",
        "salon_address": "1 St",
        "worker_payment_amount": 0,
    })
    refresh_token = reg.json()["refresh_token"]
    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_logout(client: TestClient, owner_headers: dict):
    resp = client.post("/api/v1/auth/logout", headers=owner_headers)
    assert resp.status_code == 204
