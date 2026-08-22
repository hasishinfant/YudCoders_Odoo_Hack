from typing import Any, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.services.reports_service import ReportsService

router = APIRouter()

@router.get("/employee", response_model=dict)
def get_employee_report(
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    report = ReportsService.get_employee_report(db)
    return {"success": True, "data": report}

@router.get("/attendance", response_model=dict)
def get_attendance_report(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    department_id: Optional[int] = Query(None),
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    report = ReportsService.get_attendance_report(db, start_date=start_date, end_date=end_date, department_id=department_id)
    return {"success": True, "data": report}

@router.get("/leave", response_model=dict)
def get_leave_report(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    department_id: Optional[int] = Query(None),
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    report = ReportsService.get_leave_report(db, start_date=start_date, end_date=end_date, department_id=department_id)
    return {"success": True, "data": report}

@router.get("/payroll", response_model=dict)
def get_payroll_report(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    department_id: Optional[int] = Query(None),
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    report = ReportsService.get_payroll_report(db, month=month, year=year, department_id=department_id)
    return {"success": True, "data": report}

@router.get("/export")
def export_report_csv(
    report_type: str = Query(..., alias="type", description="employee, attendance, leave, or payroll"),
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    t = report_type.lower().strip()
    if t == "employee":
        data = ReportsService.get_employee_report(db)
    elif t == "attendance":
        data = ReportsService.get_attendance_report(db)
    elif t == "leave":
        data = ReportsService.get_leave_report(db)
    elif t == "payroll":
        data = ReportsService.get_payroll_report(db)
    else:
        data = {}

    csv_content = ReportsService.export_report_csv(t, data)
    filename = f"dayflow_{t}_report_{date.today()}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
