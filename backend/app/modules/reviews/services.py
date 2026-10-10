"""Review visibility rules shared by every public read of reviews and rating aggregates."""
from typing import Dict, Iterable, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Query, Session

from app.modules.reviews.models import Review, ReviewReport, ReviewReportStatus

# A review with this many open reports is hidden from public endpoints and rating aggregates until an admin
# resolves the reports (App Store guideline 1.2).
HIDE_THRESHOLD = 3


def hidden_review_ids(db: Session):
    """Subquery of review ids that currently have HIDE_THRESHOLD or more open reports."""
    return (
        db.query(ReviewReport.review_id)
        .filter(ReviewReport.status == ReviewReportStatus.OPEN)
        .group_by(ReviewReport.review_id)
        .having(func.count(ReviewReport.id) >= HIDE_THRESHOLD)
        .subquery()
    )


def visible(db: Session, q: Query) -> Query:
    """Restrict a Review query to reviews the public may see: published and not hidden by open reports."""
    hidden = hidden_review_ids(db)
    return q.filter(Review.is_published == True, ~Review.id.in_(db.query(hidden.c.review_id)))  # noqa: E712


def provider_ratings(db: Session, provider_ids: Iterable[int]) -> Dict[int, Tuple[float, int]]:
    """{provider_id: (average rating, review count)} over visible reviews only."""
    ids = list({pid for pid in provider_ids if pid is not None})
    if not ids:
        return {}
    rows = visible(
        db,
        db.query(Review.provider_id, func.avg(Review.rating), func.count(Review.id)).filter(Review.provider_id.in_(ids)),
    ).group_by(Review.provider_id).all()
    return {pid: (round(float(avg), 2), int(cnt)) for pid, avg, cnt in rows}


def attach_ratings(db: Session, providers):
    """Set avg_rating / review_count on Provider objects (read by the ProviderPublic schema). Returns providers."""
    single = not isinstance(providers, (list, tuple))
    items = [providers] if single else list(providers)
    ratings = provider_ratings(db, [p.id for p in items])
    for p in items:
        avg, cnt = ratings.get(p.id, (None, 0))
        p.avg_rating = avg
        p.review_count = cnt
    return providers
