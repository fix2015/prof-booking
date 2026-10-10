"""Add-to-Calendar (.ics) for bookings."""
from datetime import datetime

from app.modules.booking.ics import build_booking_ics


def test_build_ics_escapes_folds_and_adds_reminders():
    ics = build_booking_ics(
        uid="booking-1@probooking.app", title="Gel, Manicure; deluxe at Salon",
        starts_at=datetime(2030, 1, 7, 11, 0), ends_at=datetime(2030, 1, 7, 12, 0),
        location="1 High St, London", description="Line one\nLine two " + "x" * 120,
        now=datetime(2030, 1, 1, 9, 0),
    )
    assert ics.startswith("BEGIN:VCALENDAR\r\n") and ics.endswith("END:VCALENDAR\r\n")
    assert "DTSTART:20300107T110000\r\n" in ics and "DTEND:20300107T120000\r\n" in ics
    assert "DTSTAMP:20300101T090000Z" in ics
    assert "SUMMARY:Gel\\, Manicure\; deluxe at Salon" in ics
    assert "LOCATION:1 High St\\, London" in ics
    assert "Line one\\nLine two" in ics
    assert "TRIGGER:-P1D" in ics and "TRIGGER:-PT2H" in ics
    assert all(len(line.encode()) <= 75 for line in ics.split("\r\n"))
    assert "\r\n x" in ics  # folded continuation line


def test_calendar_endpoint_requires_confirmation_code(client, owner_headers, professional_headers):
    provider_id = client.get("/api/v1/providers/public").json()[0]["id"]
    svc = client.post(f"/api/v1/services/provider/{provider_id}", headers=owner_headers,
                      json={"name": "Gel Manicure", "duration_minutes": 60, "price": 30}).json()
    booking = client.post("/api/v1/booking/", json={
        "provider_id": provider_id, "service_id": svc["id"], "client_name": "Jane Private",
        "client_phone": "+447700900555", "starts_at": "2030-01-07T11:00:00",
    }).json()
    url = f"/api/v1/booking/{booking['session_id']}/calendar.ics"

    resp = client.get(url, params={"code": booking["confirmation_code"].lower()})
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/calendar")
    assert "probook-booking-" in resp.headers["content-disposition"]
    body = resp.text
    assert "SUMMARY:Gel Manicure at Test Salon" in body
    assert "DTSTART:20300107T110000" in body
    assert "Jane Private" not in body and "+447700900555" not in body

    assert client.get(url, params={"code": "WRONG123"}).status_code == 404
    assert client.get("/api/v1/booking/999999/calendar.ics", params={"code": "X"}).status_code == 404
