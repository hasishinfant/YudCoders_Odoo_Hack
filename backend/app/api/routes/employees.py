from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.repositories.core import employee_repo
from app.services.employee_service import EmployeeService
from app.schemas.core import (
    EmployeeCreateAdmin, 
    EmployeeUpdate, 
    EmployeeUpdateSelf, 
    EmployeeResponse,
    EmployeeCreateAdminResponse
)

router = APIRouter()

def format_employee_response(emp: Employee) -> dict:
    return {
        "id": emp.id,
        "user_id": emp.user_id,
        "employee_code": emp.employee_code,
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "phone": emp.phone,
        "address": emp.address,
        "job_title": emp.job_title,
        "joining_date": emp.joining_date,
        "employment_status": emp.employment_status,
        "company_name": emp.company_name,
        "location": emp.location,
        "avatar_url": emp.avatar_url,
        "about": emp.about,
        "skills": emp.skills,
        "certifications": emp.certifications,
        "department_id": emp.department_id,
        "department_name": emp.department.name if emp.department else None,
        "email": emp.user.email if emp.user else None,
        "user_active": emp.user.active if emp.user else True,
        "user_role": emp.user.role if emp.user else "EMPLOYEE",
        "created_at": emp.created_at
    }

@router.get("", response_model=dict)
def list_employees(
    q: Optional[str] = Query(None, description="Search term for name, login ID, email, position"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    items, total = employee_repo.search(
        db, 
        query_str=q, 
        department_id=department_id, 
        skip=skip, 
        limit=limit
    )
    formatted = [format_employee_response(emp) for emp in items]
    return {
        "success": True,
        "data": formatted,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/me", response_model=dict)
def get_my_profile(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    employee = employee_repo.get_by_user_id(db, user_id=current_user.id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found for the current user."
        )
    return {
        "success": True,
        "data": format_employee_response(employee)
    }

@router.get("/{employee_id}", response_model=dict)
def get_employee_by_id(
    employee_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    employee = employee_repo.get(db, id=employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Authorization Check: EMPLOYEE role can ONLY access their own profile
    if current_user.role == RoleEnum.EMPLOYEE:
        if employee.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view other employee profiles."
            )

    return {
        "success": True,
        "data": format_employee_response(employee)
    }

@router.post("", response_model=dict)
def create_employee(
    emp_in: EmployeeCreateAdmin,
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    result = EmployeeService.create_employee_by_admin(
        db=db, 
        admin_user=admin_user, 
        emp_in=emp_in
    )
    return {
        "success": True,
        "message": "Employee created successfully.",
        "data": result
    }

@router.patch("/me", response_model=dict)
def update_my_profile(
    emp_in: EmployeeUpdateSelf,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    updated = EmployeeService.update_employee_self(
        db=db,
        user=current_user,
        emp_in=emp_in
    )
    return {
        "success": True,
        "message": "Profile updated successfully.",
        "data": format_employee_response(updated)
    }

@router.patch("/{employee_id}", response_model=dict)
def update_employee(
    employee_id: int,
    emp_in: EmployeeUpdate,
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    updated = EmployeeService.update_employee_by_admin(
        db=db,
        admin_user=admin_user,
        employee_id=employee_id,
        emp_in=emp_in
    )
    return {
        "success": True,
        "message": "Employee updated successfully.",
        "data": format_employee_response(updated)
    }

@router.patch("/{employee_id}/status", response_model=dict)
def set_employee_status(
    employee_id: int,
    status_payload: dict,
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    active = status_payload.get("active", True)
    updated = EmployeeService.set_employee_status(
        db=db,
        admin_user=admin_user,
        employee_id=employee_id,
        active=active
    )
    return {
        "success": True,
        "message": f"Employee status changed to {'Active' if active else 'Inactive'}.",
        "data": format_employee_response(updated)
    }
