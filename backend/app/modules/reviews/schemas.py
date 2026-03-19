from pydantic import BaseModel, Field
from typing import Optional, List
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
    client_phone: Optional[str]
    rating: int
    comment: Optional[str]
    images: Optional[List[str]] = None
    is_published: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewStats(BaseModel):
    professional_id: int
    total_reviews: int
    average_rating: float
    rating_distribution: dict  # {1: count, 2: count, ...}
