from typing import Any, Optional, List
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User, RoleEnum
from app.models.payroll import EmployeeSalary, Payroll, PayrollStatusEnum
from app.services.payroll_service import PayrollService
from app.schemas.hr import (
    EmployeeSalaryCreate,
    EmployeeSalaryUpdate,
    EmployeeSalaryResponse,
    PayrollGenerateRequest,
    PayrollResponse
)

router = APIRouter()

def format_salary_response(sal: EmployeeSalary) -> dict:
    basic = Decimal(str(sal.basic_salary))
    allowances = Decimal(str(sal.allowances))
    deductions = Decimal(str(sal.deductions))
    gross = basic + allowances
    net = max(Decimal('0.00'), gross - deductions)

    return {
        "id": sal.id,
        "employee_id": sal.employee_id,
        "basic_salary": basic,
        "allowances": allowances,
        "gross_salary": gross,
        "deductions": deductions,
        "net_salary": net,
        "effective_from": sal.effective_from,
        "created_at": sal.created_at,
        "updated_at": sal.updated_at
    }

def format_payroll_response(db: Session, p: Payroll) -> dict:
    summary = PayrollService.get_payroll_summary_details(db, p)
    return {
        "id": p.id,
        "employee_id": p.employee_id,
        "employee_name": f"{p.employee.first_name} {p.employee.last_name}" if p.employee else None,
        "employee_code": p.employee.employee_code if p.employee else None,
        "department_name": p.employee.department.name if (p.employee and p.employee.department) else None,
        "month": p.month,
        "year": p.year,
        "period_start": p.period_start,
        "period_end": p.period_end,
        "basic_salary": p.basic_salary,
        "allowances": p.allowances,
        "gross_salary": p.gross_salary,
        "deductions": p.deductions,
        "net_salary": p.net_salary,
        "status": p.status,
        "comment": p.comment,
        "worked_hours": summary["worked_hours"],
        "approved_leave_days": summary["approved_leave_days"],
        "generated_at": p.generated_at,
        "processed_at": p.processed_at,
        "paid_at": p.paid_at,
        "created_at": p.created_at,
        "updated_at": p.updated_at
    }

# Salary Configuration Endpoints
@router.get("/salary/me", response_model=dict)
def get_my_salary_config(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    emp = PayrollService.get_employee_for_user(db, current_user)
    sal = PayrollService.get_salary_config(db, emp.id)
    return {
        "success": True,
        "data": format_salary_response(sal)
    }

@router.get("/salary/{employee_id}", response_model=dict)
def get_employee_salary_config(
    employee_id: int,
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    sal = PayrollService.get_salary_config(db, employee_id)
    return {
        "success": True,
        "data": format_salary_response(sal)
    }

@router.post("/salary", response_model=dict)
def set_employee_salary(
    sal_in: EmployeeSalaryCreate,
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    sal = PayrollService.set_salary_config(db, admin_user, sal_in)
    return {
        "success": True,
        "message": "Salary configuration saved successfully.",
        "data": format_salary_response(sal)
    }

@router.patch("/salary/{employee_id}", response_model=dict)
def update_employee_salary(
    employee_id: int,
    sal_in: EmployeeSalaryUpdate,
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    sal = PayrollService.update_salary_config(db, admin_user, employee_id, sal_in)
    return {
        "success": True,
        "message": "Salary configuration updated successfully.",
        "data": format_salary_response(sal)
    }

# Payroll Management Endpoints
@router.get("/me", response_model=dict)
def get_my_payroll_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    items, total = PayrollService.get_my_payroll_history(db, current_user, skip=skip, limit=limit)
    return {
        "success": True,
        "data": [format_payroll_response(db, p) for p in items],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("", response_model=dict)
def list_payrolls_admin(
    q: Optional[str] = Query(None, description="Search employee name, code, department"),
    employee_id: Optional[int] = Query(None),
    department_id: Optional[int] = Query(None),
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    status_filter: Optional[PayrollStatusEnum] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    items, total = PayrollService.get_admin_payrolls(
        db,
        query_str=q,
        employee_id=employee_id,
        department_id=department_id,
        month=month,
        year=year,
        status_filter=status_filter,
        skip=skip,
        limit=limit
    )
    return {
        "success": True,
        "data": [format_payroll_response(db, p) for p in items],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{payroll_id}", response_model=dict)
def get_payroll_by_id(
    payroll_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    p = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll record not found.")

    # Authorization Check
    if current_user.role == RoleEnum.EMPLOYEE:
        if p.employee.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this payslip."
            )

    return {
        "success": True,
        "data": format_payroll_response(db, p)
    }

@router.post("/generate", response_model=dict)
def generate_payroll(
    gen_in: PayrollGenerateRequest,
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    generated = PayrollService.generate_payroll(db, admin_user, gen_in)
    return {
        "success": True,
        "message": f"Generated payroll for {len(generated)} employee(s).",
        "data": [format_payroll_response(db, p) for p in generated]
    }

@router.patch("/{payroll_id}/process", response_model=dict)
def process_payroll(
    payroll_id: int,
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    processed = PayrollService.process_payroll(db, admin_user, payroll_id)
    return {
        "success": True,
        "message": "Payroll processed successfully.",
        "data": format_payroll_response(db, processed)
    }

@router.patch("/{payroll_id}/pay", response_model=dict)
def pay_payroll(
    payroll_id: int,
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    paid = PayrollService.pay_payroll(db, admin_user, payroll_id)
    return {
        "success": True,
        "message": "Payroll marked as PAID successfully.",
        "data": format_payroll_response(db, paid)
    }

@router.patch("/{payroll_id}/cancel", response_model=dict)
def cancel_payroll(
    payroll_id: int,
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    cancelled = PayrollService.cancel_payroll(db, admin_user, payroll_id)
    return {
        "success": True,
        "message": "Payroll cancelled successfully.",
        "data": format_payroll_response(db, cancelled)
    }
