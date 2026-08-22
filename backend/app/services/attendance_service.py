from datetime import datetime, date, timezone
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status

from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.department import Department
from app.models.attendance import Attendance, AttendanceStatusEnum
from app.models.audit_log import AuditLog
from app.repositories.core import employee_repo
from app.core.config import STANDARD_WORKING_HOURS

class AttendanceService:
    @staticmethod
    def get_employee_for_user(db: Session, user: User) -> Employee:
        if not user.active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user account cannot perform attendance actions."
            )
        employee = employee_repo.get_by_user_id(db, user_id=user.id)
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No linked employee profile found for current user."
            )
        return employee

    @staticmethod
    def check_in(db: Session, user: User) -> Attendance:
        employee = AttendanceService.get_employee_for_user(db, user)
        today = datetime.now(timezone.utc).date()
        now = datetime.now(timezone.utc)

        existing = db.query(Attendance).filter(
            Attendance.employee_id == employee.id,
            Attendance.date == today
        ).first()

        if existing and existing.check_in:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already checked in for today."
            )

        if not existing:
            attendance = Attendance(
                employee_id=employee.id,
                date=today,
                check_in=now,
                status=AttendanceStatusEnum.PRESENT
            )
            db.add(attendance)
        else:
            existing.check_in = now
            existing.status = AttendanceStatusEnum.PRESENT
            attendance = existing

        audit = AuditLog(
            user_id=user.id,
            action="CHECK_IN",
            entity="Attendance",
            entity_id=employee.id,
            metadata_details=f"Employee {employee.employee_code} checked in at {now.isoformat()}"
        )
        db.add(audit)
        db.commit()
        db.refresh(attendance)
        return attendance

    @staticmethod
    def check_out(db: Session, user: User) -> Attendance:
        employee = AttendanceService.get_employee_for_user(db, user)
        today = datetime.now(timezone.utc).date()
        now = datetime.now(timezone.utc)

        attendance = db.query(Attendance).filter(
            Attendance.employee_id == employee.id,
            Attendance.date == today
        ).first()

        if not attendance or not attendance.check_in:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No check-in record found for today. Please check in first."
            )

        if attendance.check_out:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already checked out for today."
            )

        # Ensure offset-aware datetimes for subtraction
        check_in_dt = attendance.check_in
        if check_in_dt and check_in_dt.tzinfo is None:
            check_in_dt = check_in_dt.replace(tzinfo=timezone.utc)

        now_dt = now
        if now_dt.tzinfo is None:
            now_dt = now_dt.replace(tzinfo=timezone.utc)

        duration_seconds = (now_dt - check_in_dt).total_seconds()
        worked_hrs = round(max(0.0, duration_seconds / 3600.0), 2)
        extra_hrs = round(max(0.0, worked_hrs - STANDARD_WORKING_HOURS), 2)

        attendance.check_out = now
        attendance.worked_hours = worked_hrs
        attendance.extra_hours = extra_hrs

        audit = AuditLog(
            user_id=user.id,
            action="CHECK_OUT",
            entity="Attendance",
            entity_id=employee.id,
            metadata_details=f"Employee {employee.employee_code} checked out. Worked: {worked_hrs}h, Extra: {extra_hrs}h"
        )
        db.add(audit)
        db.commit()
        db.refresh(attendance)
        return attendance

    @staticmethod
    def get_today_attendance(db: Session, user: User) -> Optional[Attendance]:
        employee = AttendanceService.get_employee_for_user(db, user)
        today = datetime.now(timezone.utc).date()
        return db.query(Attendance).filter(
            Attendance.employee_id == employee.id,
            Attendance.date == today
        ).first()

    @staticmethod
    def get_my_attendance_history(
        db: Session,
        user: User,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Attendance], int]:
        employee = AttendanceService.get_employee_for_user(db, user)
        q = db.query(Attendance).filter(Attendance.employee_id == employee.id)

        if start_date:
            q = q.filter(Attendance.date >= start_date)
        if end_date:
            q = q.filter(Attendance.date <= end_date)

        q = q.order_by(Attendance.date.desc())
        total = q.count()
        items = q.offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_admin_attendance_records(
        db: Session,
        query_str: Optional[str] = None,
        employee_id: Optional[int] = None,
        department_id: Optional[int] = None,
        target_date: Optional[date] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        status_filter: Optional[AttendanceStatusEnum] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Attendance], int]:
        q = db.query(Attendance).join(Employee, Attendance.employee_id == Employee.id).join(User, Employee.user_id == User.id, isouter=True).join(Department, Employee.department_id == Department.id, isouter=True)

        if employee_id:
            q = q.filter(Attendance.employee_id == employee_id)
        if department_id:
            q = q.filter(Employee.department_id == department_id)
        if target_date:
            q = q.filter(Attendance.date == target_date)
        if start_date:
            q = q.filter(Attendance.date >= start_date)
        if end_date:
            q = q.filter(Attendance.date <= end_date)
        if status_filter:
            q = q.filter(Attendance.status == status_filter)

        if query_str:
            term = f"%{query_str}%"
            q = q.filter(
                or_(
                    Employee.first_name.ilike(term),
                    Employee.last_name.ilike(term),
                    Employee.employee_code.ilike(term),
                    User.email.ilike(term),
                    Department.name.ilike(term)
                )
            )

        q = q.order_by(Attendance.date.desc(), Attendance.id.desc())
        total = q.count()
        items = q.offset(skip).limit(limit).all()
        return items, total
