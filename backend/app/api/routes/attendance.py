from typing import Any, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User, RoleEnum
from app.models.attendance import Attendance, AttendanceStatusEnum
from app.services.attendance_service import AttendanceService
from app.schemas.hr import AttendanceResponse

router = APIRouter()

def format_attendance_response(att: Attendance) -> dict:
    return {
        "id": att.id,
        "employee_id": att.employee_id,
        "date": att.date,
        "check_in": att.check_in,
        "check_out": att.check_out,
        "worked_hours": att.worked_hours,
        "extra_hours": att.extra_hours,
        "status": att.status,
        "created_at": att.created_at,
        "updated_at": att.updated_at,
        "employee_name": f"{att.employee.first_name} {att.employee.last_name}" if att.employee else None,
        "employee_code": att.employee.employee_code if att.employee else None,
        "department_name": att.employee.department.name if (att.employee and att.employee.department) else None
    }

@router.post("/check-in", response_model=dict)
def check_in(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    attendance = AttendanceService.check_in(db, current_user)
    return {
        "success": True,
        "message": "Checked in successfully",
        "data": format_attendance_response(attendance)
    }

@router.post("/check-out", response_model=dict)
def check_out(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    attendance = AttendanceService.check_out(db, current_user)
    return {
        "success": True,
        "message": "Checked out successfully",
        "data": format_attendance_response(attendance)
    }

@router.get("/today", response_model=dict)
def get_today_attendance(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    attendance = AttendanceService.get_today_attendance(db, current_user)
    return {
        "success": True,
        "data": format_attendance_response(attendance) if attendance else None
    }

@router.get("/me", response_model=dict)
def get_my_attendance_history(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    items, total = AttendanceService.get_my_attendance_history(
        db, 
        user=current_user, 
        start_date=start_date, 
        end_date=end_date, 
        skip=skip, 
        limit=limit
    )
    return {
        "success": True,
        "data": [format_attendance_response(a) for a in items],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("", response_model=dict)
def list_attendance_admin(
    q: Optional[str] = Query(None, description="Search employee name, code, email"),
    employee_id: Optional[int] = Query(None),
    department_id: Optional[int] = Query(None),
    date_filter: Optional[date] = Query(None, alias="date"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status_filter: Optional[AttendanceStatusEnum] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    items, total = AttendanceService.get_admin_attendance_records(
        db,
        query_str=q,
        employee_id=employee_id,
        department_id=department_id,
        target_date=date_filter,
        start_date=start_date,
        end_date=end_date,
        status_filter=status_filter,
        skip=skip,
        limit=limit
    )
    return {
        "success": True,
        "data": [format_attendance_response(a) for a in items],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{attendance_id}", response_model=dict)
def get_attendance_by_id(
    attendance_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    att = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    # Authorization Check
    if current_user.role == RoleEnum.EMPLOYEE:
        if att.employee.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this attendance record."
            )

    return {
        "success": True,
        "data": format_attendance_response(att)
    }
