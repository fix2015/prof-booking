from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


class ReviewCreate(BaseModel):
    professional_id: int
    provider_id: Optional[int] = None
    client_name: str
    client_phone: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    images: Optional[List[str]] = None  # up to 3 image URLs
    session_id: Optional[int] = None


class ReviewResponse(BaseModel):
    id: int
    session_id: Optional[int]
    professional_id: int
    provider_id: int
    client_name: str
    rating: int
    comment: Optional[str]
    images: Optional[List[str]] = None
    is_published: bool
    is_demo: bool = False
    author_key: str = ""
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewReportCreate(BaseModel):
    reason: Literal["spam", "inappropriate", "harassment", "other"]
    note: Optional[str] = Field(None, max_length=1000)


class ReviewReportResponse(BaseModel):
    id: int
    review_id: int
    reporter_user_id: Optional[int]
    reason: str
    note: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewReportUpdate(BaseModel):
    """Admin decision on a report. Resolving also resolves the other open reports of the same review;
    review_published optionally keeps (true) or hides (false) the review itself."""
    status: Literal["open", "resolved"]
    review_published: Optional[bool] = None


class ReviewStats(BaseModel):
    professional_id: int
    total_reviews: int
    average_rating: float
    rating_distribution: dict  # {1: count, 2: count, ...}
