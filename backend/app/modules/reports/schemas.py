from pydantic import BaseModel
from typing import List
from datetime import date


class ProfessionalEarningsSummary(BaseModel):
    professional_id: int
    professional_name: str
    sessions_completed: int
    total_earnings: float
    period_start: date
    period_end: date


class ProviderRevenueSummary(BaseModel):
    provider_id: int
    provider_name: str
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


class ProfessionalPerformance(BaseModel):
    professional_id: int
    professional_name: str
    sessions_completed: int
    sessions_cancelled: int
    completion_rate: float
    total_earnings: float


class DailyRevenue(BaseModel):
    date: date
    revenue: float
    session_count: int


class ProviderReportResponse(BaseModel):
    summary: ProviderRevenueSummary
    service_popularity: List[ServicePopularity]
    professional_performance: List[ProfessionalPerformance]
    daily_revenue: List[DailyRevenue]


class ProfessionalReportResponse(BaseModel):
    summary: ProfessionalEarningsSummary
    daily_earnings: List[DailyRevenue]


# Backward-compat aliases
MasterEarningsSummary = ProfessionalEarningsSummary
SalonRevenueSummary = ProviderRevenueSummary
MasterPerformance = ProfessionalPerformance
SalonReportResponse = ProviderReportResponse
MasterReportResponse = ProfessionalReportResponse
