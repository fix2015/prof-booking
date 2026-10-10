from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_owner, get_current_user
from app.modules.reviews.models import Review, ReviewReport, ReviewReportReason
from app.modules.reviews.schemas import (
    ReviewCreate, ReviewResponse, ReviewStats, ReviewReportCreate, ReviewReportResponse,
)
from app.modules.reviews.services import visible
from app.modules.users.models import User
from app.modules.masters.models import ProfessionalProvider, ProfessionalStatus

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

    # Resolve provider_id from the professional's active provider if not supplied
    provider_id = data.provider_id
    if not provider_id:
        pp = db.query(ProfessionalProvider).filter(
            ProfessionalProvider.professional_id == data.professional_id,
            ProfessionalProvider.status == ProfessionalStatus.ACTIVE,
        ).first()
        if pp:
            provider_id = pp.provider_id
        else:
            raise HTTPException(status_code=400, detail="Cannot determine provider for this professional")

    review = Review(
        session_id=data.session_id,
        professional_id=data.professional_id,
        provider_id=provider_id,
        client_name=data.client_name,
        client_phone=data.client_phone,
        rating=data.rating,
        comment=data.comment,
        images=(data.images or [])[:3],  # cap at 3
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    # Create in-app notification for the professional and provider
    try:
        from app.modules.notifications.models import Notification, NotificationType, NotificationStatus
        stars = "★" * review.rating + "☆" * (5 - review.rating)
        body = f"{review.client_name} left a {review.rating}/5 review: {stars}"
        if review.comment:
            body += f' — "{review.comment[:100]}"'
        db.add(Notification(
            session_id=data.session_id,
            notification_type=NotificationType.SMS_CONFIRMATION,
            recipient=review.client_phone or "app",
            subject="New Review",
            body=body,
            status=NotificationStatus.SENT,
        ))
        db.commit()
    except Exception:
        pass  # Non-critical

    # Send instant review alert to professional via Telegram/Web Push
    try:
        from app.modules.notifications.scheduled_alerts import send_new_review_alert
        send_new_review_alert(db, review.professional_id, review.client_name, review.rating, review.comment)
    except Exception:
        pass  # Non-critical

    return review


@router.get("/", response_model=List[ReviewResponse])
def list_reviews(
    professional_id: Optional[int] = Query(None),
    provider_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    """Public endpoint — list published reviews (reviews hidden by open reports are left out)."""
    q = visible(db, db.query(Review))
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
    reviews = visible(db, db.query(Review).filter(Review.professional_id == professional_id)).all()

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


@router.post("/{review_id}/report", response_model=ReviewReportResponse, status_code=201)
def report_review(
    review_id: int,
    data: ReviewReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Any signed-in user reports an objectionable review (App Store guideline 1.2). One report per user and
    review (409 on a repeat). Platform admins handle reports within 24 hours; a review with 3+ open reports is
    hidden from public endpoints and rating aggregates until its reports are resolved."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    duplicate = HTTPException(status_code=409, detail="You have already reported this review")
    if db.query(ReviewReport.id).filter(
        ReviewReport.review_id == review_id, ReviewReport.reporter_user_id == current_user.id
    ).first():
        raise duplicate

    report = ReviewReport(
        review_id=review_id,
        reporter_user_id=current_user.id,
        reason=ReviewReportReason(data.reason),
        note=(data.note or "").strip() or None,
    )
    db.add(report)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise duplicate
    db.refresh(report)
    return report
