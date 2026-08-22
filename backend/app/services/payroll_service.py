import calendar
from datetime import datetime, date, timezone, timedelta
from decimal import Decimal
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from fastapi import HTTPException, status

from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.department import Department
from app.models.payroll import EmployeeSalary, Payroll, PayrollStatusEnum
from app.models.attendance import Attendance
from app.models.leave import LeaveRequest, LeaveStatusEnum
from app.models.audit_log import AuditLog
from app.repositories.core import employee_repo
from app.schemas.hr import EmployeeSalaryCreate, EmployeeSalaryUpdate, PayrollGenerateRequest

class PayrollService:
    @staticmethod
    def get_employee_for_user(db: Session, user: User) -> Employee:
        if not user.active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user account cannot perform payroll actions."
            )
        employee = employee_repo.get_by_user_id(db, user_id=user.id)
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No linked employee profile found for current user."
            )
        return employee

    @staticmethod
    def get_salary_config(db: Session, employee_id: int) -> EmployeeSalary:
        sal = db.query(EmployeeSalary).filter(EmployeeSalary.employee_id == employee_id).first()
        if not sal:
            # Fallback default salary config if not explicitly initialized
            today = date.today()
            sal = EmployeeSalary(
                employee_id=employee_id,
                basic_salary=Decimal('50000.00'),
                allowances=Decimal('5000.00'),
                deductions=Decimal('2000.00'),
                effective_from=today
            )
            db.add(sal)
            db.commit()
            db.refresh(sal)
        return sal

    @staticmethod
    def set_salary_config(db: Session, admin_user: User, sal_in: EmployeeSalaryCreate) -> EmployeeSalary:
        emp = db.query(Employee).filter(Employee.id == sal_in.employee_id).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")

        sal = db.query(EmployeeSalary).filter(EmployeeSalary.employee_id == sal_in.employee_id).first()
        eff_date = sal_in.effective_from or date.today()

        if not sal:
            sal = EmployeeSalary(
                employee_id=sal_in.employee_id,
                basic_salary=sal_in.basic_salary,
                allowances=sal_in.allowances,
                deductions=sal_in.deductions,
                effective_from=eff_date
            )
            db.add(sal)
            action = "CREATE_SALARY"
        else:
            sal.basic_salary = sal_in.basic_salary
            sal.allowances = sal_in.allowances
            sal.deductions = sal_in.deductions
            sal.effective_from = eff_date
            action = "UPDATE_SALARY"

        db.flush()
        audit = AuditLog(
            user_id=admin_user.id,
            action=action,
            entity="EmployeeSalary",
            entity_id=sal.id,
            metadata_details=f"Set salary for employee {emp.employee_code}: Basic={sal.basic_salary}, Allowances={sal.allowances}, Deductions={sal.deductions}"
        )
        db.add(audit)
        db.commit()
        db.refresh(sal)
        return sal

    @staticmethod
    def update_salary_config(db: Session, admin_user: User, employee_id: int, sal_in: EmployeeSalaryUpdate) -> EmployeeSalary:
        sal = PayrollService.get_salary_config(db, employee_id)
        if sal_in.basic_salary is not None:
            sal.basic_salary = sal_in.basic_salary
        if sal_in.allowances is not None:
            sal.allowances = sal_in.allowances
        if sal_in.deductions is not None:
            sal.deductions = sal_in.deductions
        if sal_in.effective_from is not None:
            sal.effective_from = sal_in.effective_from

        audit = AuditLog(
            user_id=admin_user.id,
            action="UPDATE_SALARY",
            entity="EmployeeSalary",
            entity_id=sal.id,
            metadata_details=f"Updated salary for employee #{employee_id}"
        )
        db.add(audit)
        db.commit()
        db.refresh(sal)
        return sal

    @staticmethod
    def generate_payroll(db: Session, admin_user: User, gen_in: PayrollGenerateRequest) -> List[Payroll]:
        month = gen_in.month
        year = gen_in.year
        _, last_day = calendar.monthrange(year, month)
        period_start = date(year, month, 1)
        period_end = date(year, month, last_day)

        if gen_in.employee_id:
            employees = db.query(Employee).filter(Employee.id == gen_in.employee_id).all()
            if not employees:
                raise HTTPException(status_code=404, detail="Employee not found.")
        else:
            employees = db.query(Employee).filter(Employee.employment_status == "ACTIVE").all()

        generated = []
        now = datetime.now(timezone.utc)

        for emp in employees:
            existing = db.query(Payroll).filter(
                Payroll.employee_id == emp.id,
                Payroll.month == month,
                Payroll.year == year
            ).first()

            if existing:
                if gen_in.employee_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Payroll for {emp.first_name} {emp.last_name} for period {month}/{year} already exists."
                    )
                continue

            sal = PayrollService.get_salary_config(db, emp.id)
            basic = Decimal(str(sal.basic_salary))
            allowances = Decimal(str(sal.allowances))
            deductions = Decimal(str(sal.deductions))

            gross = basic + allowances
            net = max(Decimal('0.00'), gross - deductions)

            payroll = Payroll(
                employee_id=emp.id,
                month=month,
                year=year,
                period_start=period_start,
                period_end=period_end,
                basic_salary=basic,
                allowances=allowances,
                gross_salary=gross,
                deductions=deductions,
                net_salary=net,
                status=PayrollStatusEnum.DRAFT,
                generated_at=now
            )
            db.add(payroll)
            db.flush()

            audit = AuditLog(
                user_id=admin_user.id,
                action="GENERATE_PAYROLL",
                entity="Payroll",
                entity_id=payroll.id,
                metadata_details=f"Generated payroll #{payroll.id} for employee {emp.employee_code} ({month}/{year}): Gross={gross}, Net={net}"
            )
            db.add(audit)
            generated.append(payroll)

        db.commit()
        for p in generated:
            db.refresh(p)
        return generated

    @staticmethod
    def process_payroll(db: Session, admin_user: User, payroll_id: int) -> Payroll:
        payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
        if not payroll:
            raise HTTPException(status_code=404, detail="Payroll record not found.")

        if payroll.status != PayrollStatusEnum.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only DRAFT payroll records can be processed."
            )

        now = datetime.now(timezone.utc)
        payroll.status = PayrollStatusEnum.PROCESSED
        payroll.processed_at = now

        audit = AuditLog(
            user_id=admin_user.id,
            action="PROCESS_PAYROLL",
            entity="Payroll",
            entity_id=payroll.id,
            metadata_details=f"Processed payroll #{payroll.id} for period {payroll.month}/{payroll.year}"
        )
        db.add(audit)
        db.commit()
        db.refresh(payroll)
        return payroll

    @staticmethod
    def pay_payroll(db: Session, admin_user: User, payroll_id: int) -> Payroll:
        payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
        if not payroll:
            raise HTTPException(status_code=404, detail="Payroll record not found.")

        if payroll.status != PayrollStatusEnum.PROCESSED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PROCESSED payroll records can be marked as PAID."
            )

        now = datetime.now(timezone.utc)
        payroll.status = PayrollStatusEnum.PAID
        payroll.paid_at = now

        audit = AuditLog(
            user_id=admin_user.id,
            action="MARK_PAYROLL_PAID",
            entity="Payroll",
            entity_id=payroll.id,
            metadata_details=f"Marked payroll #{payroll.id} as PAID"
        )
        db.add(audit)
        db.commit()
        db.refresh(payroll)
        return payroll

    @staticmethod
    def cancel_payroll(db: Session, admin_user: User, payroll_id: int) -> Payroll:
        payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
        if not payroll:
            raise HTTPException(status_code=404, detail="Payroll record not found.")

        if payroll.status in [PayrollStatusEnum.PAID, PayrollStatusEnum.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel a payroll record in {payroll.status.value} status."
            )

        payroll.status = PayrollStatusEnum.CANCELLED

        audit = AuditLog(
            user_id=admin_user.id,
            action="CANCEL_PAYROLL",
            entity="Payroll",
            entity_id=payroll.id,
            metadata_details=f"Cancelled payroll #{payroll.id}"
        )
        db.add(audit)
        db.commit()
        db.refresh(payroll)
        return payroll

    @staticmethod
    def get_my_payroll_history(db: Session, user: User, skip: int = 0, limit: int = 20) -> Tuple[List[Payroll], int]:
        employee = PayrollService.get_employee_for_user(db, user)
        q = db.query(Payroll).filter(Payroll.employee_id == employee.id).order_by(Payroll.year.desc(), Payroll.month.desc())
        total = q.count()
        items = q.offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_admin_payrolls(
        db: Session,
        query_str: Optional[str] = None,
        employee_id: Optional[int] = None,
        department_id: Optional[int] = None,
        month: Optional[int] = None,
        year: Optional[int] = None,
        status_filter: Optional[PayrollStatusEnum] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Payroll], int]:
        q = db.query(Payroll).join(Employee, Payroll.employee_id == Employee.id).join(User, Employee.user_id == User.id, isouter=True).join(Department, Employee.department_id == Department.id, isouter=True)

        if employee_id:
            q = q.filter(Payroll.employee_id == employee_id)
        if department_id:
            q = q.filter(Employee.department_id == department_id)
        if month:
            q = q.filter(Payroll.month == month)
        if year:
            q = q.filter(Payroll.year == year)
        if status_filter:
            q = q.filter(Payroll.status == status_filter)

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

        q = q.order_by(Payroll.year.desc(), Payroll.month.desc(), Payroll.id.desc())
        total = q.count()
        items = q.offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_payroll_summary_details(db: Session, payroll: Payroll) -> Dict[str, Any]:
        # Worked hours summary for period
        attendances = db.query(Attendance).filter(
            Attendance.employee_id == payroll.employee_id,
            Attendance.date >= payroll.period_start,
            Attendance.date <= payroll.period_end
        ).all()
        total_worked_hrs = sum(a.worked_hours or 0.0 for a in attendances)

        # Approved paid leave days summary for period
        approved_leaves = db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == payroll.employee_id,
            LeaveRequest.status == LeaveStatusEnum.APPROVED,
            LeaveRequest.start_date <= payroll.period_end,
            LeaveRequest.end_date >= payroll.period_start
        ).all()
        total_leave_days = sum((req.end_date - req.start_date).days + 1 for req in approved_leaves)

        return {
            "worked_hours": round(total_worked_hrs, 2),
            "approved_leave_days": total_leave_days
        }
