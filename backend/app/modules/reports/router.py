from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date, timedelta

from app.database import get_db
from app.dependencies import get_current_user, get_current_owner
from app.modules.reports.schemas import ProviderReportResponse, ProfessionalReportResponse
from app.modules.reports.services import (
    get_provider_report, get_professional_report,
    export_provider_report_xlsx, export_professional_report_xlsx,
)
from app.modules.salons.services import assert_owner_of_provider
from app.modules.masters.services import get_professional_by_user_id
from app.modules.users.models import User

router = APIRouter()


@router.get("/provider/{provider_id}", response_model=ProviderReportResponse)
def provider_report(
    provider_id: int,
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=30)),
    date_to: date = Query(default_factory=date.today),
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_provider(db, current_user, provider_id)
    return get_provider_report(db, provider_id, date_from, date_to)


@router.get("/professional/me", response_model=ProfessionalReportResponse)
def my_professional_report(
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=30)),
    date_to: date = Query(default_factory=date.today),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    professional = get_professional_by_user_id(db, current_user.id)
    if not professional:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Professional profile not found")
    return get_professional_report(db, professional.id, date_from, date_to)


@router.get("/professional/{professional_id}", response_model=ProfessionalReportResponse)
def professional_report(
    professional_id: int,
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=30)),
    date_to: date = Query(default_factory=date.today),
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    return get_professional_report(db, professional_id, date_from, date_to)


# ── Excel exports ─────────────────────────────────────────────────────────────

@router.get("/provider/{provider_id}/export")
def export_provider_report(
    provider_id: int,
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=30)),
    date_to: date = Query(default_factory=date.today),
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_provider(db, current_user, provider_id)
    report = get_provider_report(db, provider_id, date_from, date_to)
    buf = export_provider_report_xlsx(report)
    filename = f"provider-report-{provider_id}-{date_from}-{date_to}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/professional/me/export")
def export_my_professional_report(
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=30)),
    date_to: date = Query(default_factory=date.today),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    professional = get_professional_by_user_id(db, current_user.id)
    if not professional:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Professional profile not found")
    report = get_professional_report(db, professional.id, date_from, date_to)
    buf = export_professional_report_xlsx(report)
    filename = f"professional-report-{professional.id}-{date_from}-{date_to}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
