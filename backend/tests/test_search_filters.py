"""Discover search filters: price range (services), rating, open now, distance."""
from app.modules.salons.models import Provider

SEARCH = "/api/v1/providers/search"


def _owner(client, n, name, lat, lng):
    r = client.post("/api/v1/auth/register/owner", json={
        "email": f"o{n}@test.com", "phone": f"+1555777000{n}", "password": "testpass123",
        "provider_name": name, "provider_address": f"{n} High St",
    })
    assert r.status_code == 201, r.text
    headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
    pid = client.get("/api/v1/providers/my", headers=headers).json()["id"]
    client.patch(f"/api/v1/providers/{pid}", headers=headers, json={"latitude": lat, "longitude": lng})
    return pid, headers


def _ids(client, **params):
    r = client.get(SEARCH, params=params)
    assert r.status_code == 200, r.text
    return [p["id"] for p in r.json()]


def test_price_rating_distance_and_sorts(client, db):
    # Central London, ~3 km away (Camden), ~45 km away (Luton)
    a, ha = _owner(client, 1, "Alpha", 51.5074, -0.1278)
    b, hb = _owner(client, 2, "Bravo", 51.5390, -0.1426)
    c, hc = _owner(client, 3, "Charlie", 51.8787, -0.4200)
    for pid, h, price in [(a, ha, 20), (b, hb, 45), (c, hc, 80)]:
        assert client.post(f"/api/v1/services/provider/{pid}", headers=h,
                           json={"name": "Gel", "duration_minutes": 60, "price": price}).status_code == 201

    assert set(_ids(client, min_price=30, max_price=60)) == {b}
    assert set(_ids(client, max_price=25)) == {a}

    # distance + nearest ordering + distance_km
    near = client.get(SEARCH, params={"lat": 51.5074, "lng": -0.1278, "radius_km": 5}).json()
    assert [p["id"] for p in near] == [a, b]
    assert near[0]["distance_km"] == 0.0 and 3.0 < near[1]["distance_km"] < 4.5
    assert _ids(client, lat=51.5074, lng=-0.1278, sort="nearest") == [a, b, c]

    # rating: reviews need a professional; insert directly
    from app.modules.reviews.models import Review
    from app.modules.masters.models import Professional
    from app.modules.users.models import User, UserRole
    u = User(email="p@x.com", hashed_password="x", role=UserRole.PROFESSIONAL)
    db.add(u)
    db.flush()
    pro = Professional(user_id=u.id, name="P")
    db.add(pro)
    db.flush()
    for pid, rating in [(a, 5), (a, 4), (b, 3), (c, 5)]:
        db.add(Review(professional_id=pro.id, provider_id=pid, client_name="x", rating=rating))
    db.commit()
    assert set(_ids(client, min_rating=4.5)) == {a, c}
    assert set(_ids(client, min_rating=4)) == {a, c}
    assert _ids(client, sort="top_rated")[:2] == [c, a]
    rated = {p["id"]: p for p in client.get(SEARCH).json()}
    assert rated[a]["avg_rating"] == 4.5 and rated[a]["review_count"] == 2

    db.query(Provider).filter(Provider.id == c).update({Provider.latitude: None})
    db.commit()
    assert _ids(client, lat=51.5074, lng=-0.1278, radius_km=100) == [a, b]


def test_open_now(client, owner_headers, professional_headers):
    provider_id = client.get("/api/v1/providers/public").json()[0]["id"]
    client.post("/api/v1/calendar/slots", headers=professional_headers, json={
        "provider_id": provider_id, "slot_date": "2030-01-07", "start_time": "09:00:00", "end_time": "17:00:00",
    })
    assert _ids(client, open_now=True, now_date="2030-01-07", now_time="10:15") == [provider_id]
    assert _ids(client, open_now=True, now_date="2030-01-07", now_time="17:00") == []
    assert _ids(client, open_now=True, now_date="2030-01-08", now_time="10:15") == []
