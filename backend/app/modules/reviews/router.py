from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_owner
from app.modules.reviews.models import Review
from app.modules.reviews.schemas import ReviewCreate, ReviewResponse, ReviewStats
from app.modules.users.models import User

router = APIRouter()


@router.post("/", response_model=ReviewResponse, status_code=201)
def create_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
):
    """Public endpoint — client submits a review after their session."""
    # Avoid duplicate reviews for the same session
    if data.session_id:
        existing = db.query(Review).filter(Review.session_id == data.session_id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Review already submitted for this session")

    review = Review(
        session_id=data.session_id,
        professional_id=data.professional_id,
        provider_id=data.provider_id,
        client_name=data.client_name,
        client_phone=data.client_phone,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("/", response_model=List[ReviewResponse])
def list_reviews(
    professional_id: Optional[int] = Query(None),
    provider_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    """Public endpoint — list published reviews."""
    q = db.query(Review).filter(Review.is_published == True)
    if professional_id:
        q = q.filter(Review.professional_id == professional_id)
    if provider_id:
        q = q.filter(Review.provider_id == provider_id)
    return q.order_by(Review.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/stats/professional/{professional_id}", response_model=ReviewStats)
def professional_review_stats(
    professional_id: int,
    db: Session = Depends(get_db),
):
    reviews = db.query(Review).filter(
        Review.professional_id == professional_id,
        Review.is_published == True,
    ).all()

    if not reviews:
        return ReviewStats(
            professional_id=professional_id,
            total_reviews=0,
            average_rating=0.0,
            rating_distribution={str(i): 0 for i in range(1, 6)},
        )

    total = len(reviews)
    avg = sum(r.rating for r in reviews) / total
    dist = {str(i): 0 for i in range(1, 6)}
    for r in reviews:
        dist[str(r.rating)] += 1

    return ReviewStats(
        professional_id=professional_id,
        total_reviews=total,
        average_rating=round(avg, 2),
        rating_distribution=dist,
    )


@router.patch("/{review_id}/publish")
def toggle_review_publish(
    review_id: int,
    published: bool = Query(...),
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.is_published = published
    db.commit()
    return {"ok": True}
