"""Owner Today view + no-show / late-cancel toggle feeding analytics."""
DAY = "2030-01-07"


def _setup(client, owner_headers, professional_headers):
    provider_id = client.get("/api/v1/providers/public").json()[0]["id"]
    svc = client.post(f"/api/v1/services/provider/{provider_id}", headers=owner_headers,
                      json={"name": "Gel Manicure", "duration_minutes": 60, "price": 30}).json()
    pro_id = client.get("/api/v1/professionals/me", headers=professional_headers).json()["id"]
    ids = []
    for when, phone in [(f"{DAY}T11:00:00", "+447700900002"), (f"{DAY}T09:00:00", "+447700900001"),
                        ("2030-01-08T09:00:00", "+447700900003")]:
        r = client.post("/api/v1/booking/", json={
            "provider_id": provider_id, "service_id": svc["id"], "professional_id": pro_id,
            "client_name": f"Client {phone[-1]}", "client_phone": phone, "starts_at": when,
        })
        assert r.status_code == 201, r.text
        ids.append(r.json()["session_id"])
    return provider_id, pro_id, ids


def test_agenda_lists_the_day_in_order_with_contact_details(client, owner_headers, professional_headers):
    _, pro_id, _ = _setup(client, owner_headers, professional_headers)
    agenda = client.get("/api/v1/sessions/agenda", params={"date": DAY}, headers=owner_headers).json()
    assert [a["client_phone"] for a in agenda] == ["+447700900001", "+447700900002"]
    assert agenda[0]["service_name"] == "Gel Manicure" and agenda[0]["professional_id"] == pro_id
    assert agenda[0]["professional_name"] == "Test Pro" and agenda[0]["late_cancelled"] is False

    mine = client.get("/api/v1/sessions/agenda", params={"date": DAY}, headers=professional_headers).json()
    assert len(mine) == 2
    assert client.get("/api/v1/sessions/agenda", params={"date": DAY}).status_code == 401


def test_no_show_and_late_cancel_feed_analytics_and_can_be_undone(client, owner_headers, professional_headers):
    provider_id, _, (late_id, noshow_id, _) = _setup(client, owner_headers, professional_headers)

    r = client.post(f"/api/v1/sessions/{noshow_id}/attendance", json={"outcome": "no_show"}, headers=owner_headers)
    assert r.status_code == 200 and r.json()["status"] == "no_show"
    r = client.post(f"/api/v1/sessions/{late_id}/attendance", json={"outcome": "late_cancel"},
                    headers=professional_headers)
    assert r.status_code == 200 and r.json()["status"] == "cancelled" and r.json()["late_cancelled"] is True

    workers = client.get(f"/api/v1/analytics/owner/provider/{provider_id}/workers",
                         params={"date_from": "2030-01-01", "date_to": "2030-01-31"}, headers=owner_headers).json()
    assert workers[0]["no_show_count"] == 1 and workers[0]["late_cancel_count"] == 1
    assert workers[0]["missed_rate"] == 100.0

    report = client.get(f"/api/v1/reports/provider/{provider_id}",
                        params={"date_from": "2030-01-01", "date_to": "2030-01-31"}, headers=owner_headers).json()
    assert report["summary"]["no_show_sessions"] == 1 and report["summary"]["late_cancel_sessions"] == 1

    r = client.post(f"/api/v1/sessions/{late_id}/attendance", json={"outcome": "attended"}, headers=owner_headers)
    assert r.json()["status"] == "confirmed" and r.json()["late_cancelled"] is False
    workers = client.get(f"/api/v1/analytics/owner/provider/{provider_id}/workers",
                         params={"date_from": "2030-01-01", "date_to": "2030-01-31"}, headers=owner_headers).json()
    assert workers[0]["late_cancel_count"] == 0


def test_attendance_is_tenant_scoped(client, owner_headers, professional_headers):
    _, _, (sid, _, _) = _setup(client, owner_headers, professional_headers)
    other = client.post("/api/v1/auth/register/owner", json={
        "email": "other-owner@test.com", "phone": "+15550004444", "password": "testpass123",
        "provider_name": "Other Salon", "provider_address": "9 Elm St",
    })
    other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}
    assert client.post(f"/api/v1/sessions/{sid}/attendance", json={"outcome": "no_show"},
                       headers=other_headers).status_code == 403
    assert client.get("/api/v1/sessions/agenda", params={"date": DAY}, headers=other_headers).json() == []
    assert client.post(f"/api/v1/sessions/{sid}/attendance", json={"outcome": "maybe"},
                       headers=owner_headers).status_code == 422
