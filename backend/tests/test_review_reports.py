"""Report objectionable reviews + admin moderation (App Store guideline 1.2)."""
from app.modules.users.models import User, UserRole


def _review(client, professional_headers, name="Angry Guest", phone="+447700900123", rating=1):
    pro = client.get("/api/v1/professionals/me", headers=professional_headers).json()
    resp = client.post("/api/v1/reviews/", json={
        "professional_id": pro["id"], "client_name": name, "client_phone": phone, "rating": rating,
        "comment": "rude text",
    })
    assert resp.status_code == 201
    return resp.json()


def _user(client, n):
    resp = client.post("/api/v1/auth/register/client", json={
        "email": f"reporter{n}@test.com", "phone": f"+15550020{n:02d}", "password": "testpass123", "name": f"R{n}",
    })
    assert resp.status_code == 201, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def _admin(client, db):
    headers = _user(client, 99)
    db.query(User).filter(User.email == "reporter99@test.com").update({User.role: UserRole.PLATFORM_ADMIN})
    db.commit()
    return headers


def _listed(client, review):
    listed = client.get("/api/v1/reviews/", params={"provider_id": review["provider_id"]}).json()
    return any(r["id"] == review["id"] for r in listed)


def _provider(client, review):
    return client.get(f"/api/v1/providers/public/{review['provider_id']}").json()


def test_review_exposes_author_key_not_phone(client, professional_headers):
    review = _review(client, professional_headers)
    assert len(review["author_key"]) == 16
    assert "client_phone" not in review
    again = _review(client, professional_headers, name="Other Name")   # same phone → same author
    assert again["author_key"] == review["author_key"]


def test_report_requires_auth_and_rejects_duplicates(client, professional_headers):
    review = _review(client, professional_headers)
    url = f"/api/v1/reviews/{review['id']}/report"
    assert client.post(url, json={"reason": "spam"}).status_code == 401

    reporter = _user(client, 1)
    resp = client.post(url, json={"reason": "harassment", "note": "  targets the stylist  "}, headers=reporter)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["reason"] == "harassment" and body["status"] == "open" and body["note"] == "targets the stylist"
    assert body["review_id"] == review["id"] and body["reporter_user_id"] is not None

    assert client.post(url, json={"reason": "spam"}, headers=reporter).status_code == 409
    assert client.post(url, json={"reason": "offensive"}, headers=reporter).status_code == 422
    assert client.post("/api/v1/reviews/999999/report", json={"reason": "spam"}, headers=reporter).status_code == 404


def test_three_open_reports_hide_review_and_its_rating_until_resolved(client, db, professional_headers):
    good = _review(client, professional_headers, name="Happy", phone="+447700900200", rating=5)
    bad = _review(client, professional_headers, rating=1)
    assert _provider(client, bad)["review_count"] == 2
    assert _provider(client, bad)["avg_rating"] == 3.0

    url = f"/api/v1/reviews/{bad['id']}/report"
    for n, reason in enumerate(["spam", "inappropriate"], start=1):
        assert client.post(url, json={"reason": reason}, headers=_user(client, n)).status_code == 201
    assert _listed(client, bad)

    assert client.post(url, json={"reason": "other"}, headers=_user(client, 3)).status_code == 201
    assert not _listed(client, bad) and _listed(client, good)
    provider = _provider(client, bad)
    assert provider["review_count"] == 1 and provider["avg_rating"] == 5.0
    pro_id = client.get("/api/v1/professionals/me", headers=professional_headers).json()["id"]
    stats = client.get(f"/api/v1/reviews/stats/professional/{pro_id}").json()
    assert stats["total_reviews"] == 1 and stats["average_rating"] == 5.0

    # Admin resolves one report → all open reports of that review are resolved → visible again
    admin = _admin(client, db)
    reports = client.get("/api/v1/admin/review-reports", headers=admin).json()
    assert len(reports) == 3 and reports[0]["review"]["hidden_by_reports"] is True
    resp = client.patch(f"/api/v1/admin/review-reports/{reports[0]['id']}", json={"status": "resolved"}, headers=admin)
    assert resp.status_code == 200 and resp.json()["status"] == "resolved"
    assert _listed(client, bad)
    assert _provider(client, bad)["review_count"] == 2
    assert client.get("/api/v1/admin/review-reports", headers=admin).json() == []
    assert len(client.get("/api/v1/admin/review-reports", params={"status": "resolved"}, headers=admin).json()) == 3


def test_admin_report_endpoints_are_admin_only(client, db, professional_headers):
    review = _review(client, professional_headers)
    reporter = _user(client, 1)
    rep = client.post(f"/api/v1/reviews/{review['id']}/report", json={"reason": "spam"}, headers=reporter).json()

    assert client.get("/api/v1/admin/review-reports").status_code == 401
    assert client.get("/api/v1/admin/review-reports", headers=reporter).status_code == 403
    assert client.patch(f"/api/v1/admin/review-reports/{rep['id']}", json={"status": "resolved"},
                        headers=reporter).status_code == 403

    admin = _admin(client, db)
    listed = client.get("/api/v1/admin/review-reports", headers=admin).json()
    assert [r["id"] for r in listed] == [rep["id"]]
    assert listed[0]["reporter_email"] == "reporter1@test.com" and listed[0]["review"]["open_reports"] == 1

    # Resolve and hide the review itself
    resp = client.patch(f"/api/v1/admin/review-reports/{rep['id']}",
                        json={"status": "resolved", "review_published": False}, headers=admin)
    assert resp.status_code == 200 and resp.json()["review_published"] is False
    assert not _listed(client, review)
    assert client.patch("/api/v1/admin/review-reports/999999", json={"status": "resolved"},
                        headers=admin).status_code == 404
    assert client.patch(f"/api/v1/admin/review-reports/{rep['id']}", json={"status": "bogus"},
                        headers=admin).status_code == 422
