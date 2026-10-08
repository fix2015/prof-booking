"""Report objectionable reviews (App Store guideline 1.2)."""


def _review(client, professional_headers, name="Angry Guest", phone="+447700900123"):
    pro = client.get("/api/v1/professionals/me", headers=professional_headers).json()
    resp = client.post("/api/v1/reviews/", json={
        "professional_id": pro["id"], "client_name": name, "client_phone": phone, "rating": 1, "comment": "rude text",
    })
    assert resp.status_code == 201
    return resp.json()


def test_review_exposes_author_key_not_phone(client, professional_headers):
    review = _review(client, professional_headers)
    assert len(review["author_key"]) == 16
    assert "client_phone" not in review
    again = _review(client, professional_headers, name="Other Name")   # same phone → same author
    assert again["author_key"] == review["author_key"]


def test_report_hides_review_after_three_different_reporters(client, professional_headers):
    review = _review(client, professional_headers)
    url = f"/api/v1/reviews/{review['id']}/report"

    for _ in range(3):  # the same reporter counts once
        assert client.post(url, json={"reason": "offensive"}, headers={"X-Forwarded-For": "10.0.0.1"}).status_code == 201
    assert client.post(url, json={"reason": "spam"}, headers={"X-Forwarded-For": "10.0.0.2"}).status_code == 201
    listed = client.get("/api/v1/reviews/", params={"provider_id": review["provider_id"]}).json()
    assert any(r["id"] == review["id"] for r in listed)

    assert client.post(url, json={"reason": "fake", "details": "not a client"},
                       headers={"X-Forwarded-For": "10.0.0.3"}).status_code == 201
    listed = client.get("/api/v1/reviews/", params={"provider_id": review["provider_id"]}).json()
    assert all(r["id"] != review["id"] for r in listed)


def test_report_validation(client, professional_headers):
    review = _review(client, professional_headers)
    assert client.post(f"/api/v1/reviews/{review['id']}/report", json={"reason": "nope"}).status_code == 422
    assert client.post("/api/v1/reviews/999999/report", json={"reason": "spam"}).status_code == 404
