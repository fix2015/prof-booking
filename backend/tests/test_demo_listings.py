from datetime import datetime, timedelta

from app.modules.salons.models import Provider


def test_sample_listing_is_flagged_and_not_bookable(client, db, owner_headers):
    providers = client.get("/api/v1/providers/public").json()
    provider_id = providers[0]["id"]

    # mark it as a sample listing (what scripts/seed_demo.py does)
    prov = db.query(Provider).filter(Provider.id == provider_id).first()
    prov.is_demo = True
    db.commit()

    public = client.get("/api/v1/providers/public").json()
    assert any(p["id"] == provider_id and p["is_demo"] is True for p in public)

    resp = client.post("/api/v1/booking/", json={
        "provider_id": provider_id,
        "service_id": 1,
        "client_name": "Test Client",
        "client_phone": "+447700900000",
        "starts_at": (datetime.utcnow() + timedelta(days=2)).replace(hour=10, minute=0, second=0, microsecond=0).isoformat(),
    })
    assert resp.status_code == 403
    assert "sample" in resp.json()["detail"].lower()
