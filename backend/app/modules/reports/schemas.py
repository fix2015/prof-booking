from pydantic import BaseModel
from typing import List, Optional
from datetime import date


class MasterEarningsSummary(BaseModel):
    master_id: int
    master_name: str
    sessions_completed: int
    total_earnings: float
    period_start: date
    period_end: date


class SalonRevenueSummary(BaseModel):
    salon_id: int
    salon_name: str
    period_start: date
    period_end: date
    total_sessions: int
    completed_sessions: int
    cancelled_sessions: int
    total_revenue: float
    total_deposits: float


class ServicePopularity(BaseModel):
    service_id: int
    service_name: str
    booking_count: int
    total_revenue: float


class MasterPerformance(BaseModel):
    master_id: int
    master_name: str
    sessions_completed: int
    sessions_cancelled: int
    completion_rate: float
    total_earnings: float


class DailyRevenue(BaseModel):
    date: date
    revenue: float
    session_count: int


class SalonReportResponse(BaseModel):
    summary: SalonRevenueSummary
    service_popularity: List[ServicePopularity]
    master_performance: List[MasterPerformance]
    daily_revenue: List[DailyRevenue]


class MasterReportResponse(BaseModel):
    summary: MasterEarningsSummary
    daily_earnings: List[DailyRevenue]
