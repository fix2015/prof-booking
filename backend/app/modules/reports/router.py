from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date, timedelta

from app.database import get_db
from app.dependencies import get_current_user, get_current_owner
from app.modules.reports.schemas import SalonReportResponse, MasterReportResponse
from app.modules.reports.services import (
    get_salon_report, get_master_report,
    export_salon_report_xlsx, export_master_report_xlsx,
)
from app.modules.salons.services import assert_owner_of_salon
from app.modules.masters.services import get_master_by_user_id
from app.modules.users.models import User

router = APIRouter()


@router.get("/salon/{salon_id}", response_model=SalonReportResponse)
def salon_report(
    salon_id: int,
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=30)),
    date_to: date = Query(default_factory=date.today),
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_salon(db, current_user, salon_id)
    return get_salon_report(db, salon_id, date_from, date_to)


@router.get("/master/me", response_model=MasterReportResponse)
def my_master_report(
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=30)),
    date_to: date = Query(default_factory=date.today),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    master = get_master_by_user_id(db, current_user.id)
    if not master:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Master profile not found")
    return get_master_report(db, master.id, date_from, date_to)


@router.get("/master/{master_id}", response_model=MasterReportResponse)
def master_report(
    master_id: int,
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=30)),
    date_to: date = Query(default_factory=date.today),
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    return get_master_report(db, master_id, date_from, date_to)


# ── Excel exports ─────────────────────────────────────────────────────────────

@router.get("/salon/{salon_id}/export")
def export_salon_report(
    salon_id: int,
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=30)),
    date_to: date = Query(default_factory=date.today),
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_salon(db, current_user, salon_id)
    report = get_salon_report(db, salon_id, date_from, date_to)
    buf = export_salon_report_xlsx(report)
    filename = f"salon-report-{salon_id}-{date_from}-{date_to}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/master/me/export")
def export_my_master_report(
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=30)),
    date_to: date = Query(default_factory=date.today),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    master = get_master_by_user_id(db, current_user.id)
    if not master:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Master profile not found")
    report = get_master_report(db, master.id, date_from, date_to)
    buf = export_master_report_xlsx(report)
    filename = f"master-report-{master.id}-{date_from}-{date_to}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
