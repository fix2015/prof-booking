from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from app.modules.invoices.models import InvoiceStatus


class EarningsSplitCreate(BaseModel):
    professional_id: int
    professional_percentage: float = 70.0
    effective_from: date


class EarningsSplitResponse(BaseModel):
    id: int
    provider_id: int
    professional_id: int
    professional_percentage: float
    effective_from: date
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceCreate(BaseModel):
    professional_id: int
    period_start: date
    period_end: date
    notes: Optional[str] = None


class InvoiceResponse(BaseModel):
    id: int
    provider_id: int
    professional_id: int
    period_start: date
    period_end: date
    total_sessions: int
    total_revenue: float
    professional_earnings: float
    provider_earnings: float
    professional_percentage: float
    status: InvoiceStatus
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceStatusUpdate(BaseModel):
    status: InvoiceStatus
