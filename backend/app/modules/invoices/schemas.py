from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from app.modules.invoices.models import InvoiceStatus


class EarningsSplitCreate(BaseModel):
    master_id: int
    master_percentage: float = 70.0
    effective_from: date


class EarningsSplitResponse(BaseModel):
    id: int
    salon_id: int
    master_id: int
    master_percentage: float
    effective_from: date
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceCreate(BaseModel):
    master_id: int
    period_start: date
    period_end: date
    notes: Optional[str] = None


class InvoiceResponse(BaseModel):
    id: int
    salon_id: int
    master_id: int
    period_start: date
    period_end: date
    total_sessions: int
    total_revenue: float
    master_earnings: float
    salon_earnings: float
    master_percentage: float
    status: InvoiceStatus
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceStatusUpdate(BaseModel):
    status: InvoiceStatus
