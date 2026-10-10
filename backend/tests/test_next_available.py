"""Next available slots on Discover provider cards."""
from app.modules.salons.models import Provider

DAY1, DAY2 = "2030-01-07", "2030-01-08"


def _setup(client, owner_headers, professional_headers):
    provider_id = client.get("/api/v1/providers/public").json()[0]["id"]
    for day, start, end in [(DAY1, "09:00:00", "12:00:00"), (DAY2, "09:00:00", "11:00:00")]:
        resp = client.post("/api/v1/calendar/slots", headers=professional_headers,
                           json={"provider_id": provider_id, "slot_date": day, "start_time": start, "end_time": end})
        assert resp.status_code == 201, resp.text
    svc = client.post(f"/api/v1/services/provider/{provider_id}", headers=owner_headers,
                      json={"name": "Gel", "duration_minutes": 60, "price": 30}).json()
    return provider_id, svc["id"]


def _next(client, provider_ids, **params):
    resp = client.get("/api/v1/calendar/next-available",
                      params={"provider_ids": ",".join(map(str, provider_ids)), "from_date": DAY1, **params})
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_first_three_free_slots_skip_past_and_booked(client, owner_headers, professional_headers):
    provider_id, service_id = _setup(client, owner_headers, professional_headers)

    slots = _next(client, [provider_id])[str(provider_id)]
    assert [(s["slot_date"], s["start_time"]) for s in slots] == [
        (DAY1, "09:00:00"), (DAY1, "09:30:00"), (DAY1, "10:00:00"),
    ]

    # It is 10:15 locally and 11:00–12:00 is booked: 10:30 would overlap, so nothing is left today → tomorrow
    pro_id = client.get("/api/v1/professionals/me", headers=professional_headers).json()["id"]
    booking = client.post("/api/v1/booking/", json={
        "provider_id": provider_id, "service_id": service_id, "professional_id": pro_id, "client_name": "Jane",
        "client_phone": "+447700900321", "starts_at": f"{DAY1}T11:00:00",
    })
    assert booking.status_code == 201, booking.text
    slots = _next(client, [provider_id], after="10:15")[str(provider_id)]
    assert [(s["slot_date"], s["start_time"]) for s in slots] == [
        (DAY2, "09:00:00"), (DAY2, "09:30:00"), (DAY2, "10:00:00"),
    ]
    assert all(s["professional_name"] == "Test Pro" for s in slots)


def test_sample_and_unknown_providers_get_no_slots(client, db, owner_headers, professional_headers):
    provider_id, _ = _setup(client, owner_headers, professional_headers)
    db.query(Provider).filter(Provider.id == provider_id).update({Provider.is_demo: True})
    db.commit()
    assert _next(client, [provider_id, 999]) == {str(provider_id): [], "999": []}


def test_validation(client):
    url = "/api/v1/calendar/next-available"
    assert client.get(url, params={"provider_ids": "a,b", "from_date": DAY1}).status_code == 422
    assert client.get(url, params={"provider_ids": "", "from_date": DAY1}).status_code == 422
    assert client.get(url, params={"provider_ids": "1"}).status_code == 422
