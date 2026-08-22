from typing import Any, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User, RoleEnum
from app.models.leave import LeaveRequest, LeaveStatusEnum
from app.services.leave_service import LeaveService
from app.schemas.hr import (
    LeaveRequestCreate, 
    LeaveRequestApprove, 
    LeaveRequestRefuse, 
    LeaveRequestResponse, 
    LeaveBalanceResponse
)

router = APIRouter()

def format_leave_request_response(req: LeaveRequest) -> dict:
    duration = (req.end_date - req.start_date).days + 1
    return {
        "id": req.id,
        "employee_id": req.employee_id,
        "employee_name": f"{req.employee.first_name} {req.employee.last_name}" if req.employee else None,
        "employee_code": req.employee.employee_code if req.employee else None,
        "department_name": req.employee.department.name if (req.employee and req.employee.department) else None,
        "leave_type_id": req.leave_type_id,
        "leave_type_name": req.leave_type.name if req.leave_type else None,
        "leave_type_paid": req.leave_type.paid if req.leave_type else True,
        "start_date": req.start_date,
        "end_date": req.end_date,
        "duration_days": max(1, duration),
        "reason": req.reason,
        "comment": req.comment,
        "status": req.status,
        "approver_id": req.approver_id,
        "approver_name": req.approver.email if req.approver else None,
        "created_at": req.created_at,
        "updated_at": req.updated_at
    }

@router.get("/me", response_model=dict)
def get_my_leave_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    items, total = LeaveService.get_my_leave_requests(db, user=current_user, skip=skip, limit=limit)
    return {
        "success": True,
        "data": [format_leave_request_response(req) for req in items],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/balances", response_model=dict)
def get_my_leave_balances(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    balances = LeaveService.get_my_leave_balances(db, user=current_user)
    return {
        "success": True,
        "data": balances
    }

@router.post("", response_model=dict)
def create_leave_request(
    req_in: LeaveRequestCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    leave_req = LeaveService.create_leave_request(db, user=current_user, req_in=req_in)
    return {
        "success": True,
        "message": "Leave request submitted successfully.",
        "data": format_leave_request_response(leave_req)
    }

@router.patch("/{request_id}/cancel", response_model=dict)
def cancel_leave_request(
    request_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    cancelled = LeaveService.cancel_leave_request(db, user=current_user, request_id=request_id)
    return {
        "success": True,
        "message": "Leave request cancelled successfully.",
        "data": format_leave_request_response(cancelled)
    }

@router.get("", response_model=dict)
def list_leave_requests_admin(
    q: Optional[str] = Query(None, description="Search employee name, code, department, or leave type"),
    employee_id: Optional[int] = Query(None),
    department_id: Optional[int] = Query(None),
    leave_type_id: Optional[int] = Query(None),
    status_filter: Optional[LeaveStatusEnum] = Query(None, alias="status"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    items, total = LeaveService.get_admin_leave_requests(
        db,
        query_str=q,
        employee_id=employee_id,
        department_id=department_id,
        leave_type_id=leave_type_id,
        status_filter=status_filter,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit
    )
    return {
        "success": True,
        "data": [format_leave_request_response(req) for req in items],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{request_id}", response_model=dict)
def get_leave_request_by_id(
    request_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    req = db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")

    # Authorization Check: Employee can only view own request
    if current_user.role == RoleEnum.EMPLOYEE:
        if req.employee.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this leave request."
            )

    return {
        "success": True,
        "data": format_leave_request_response(req)
    }

@router.patch("/{request_id}/approve", response_model=dict)
def approve_leave_request(
    request_id: int,
    approve_in: Optional[LeaveRequestApprove] = None,
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    comment = approve_in.comment if approve_in else None
    approved = LeaveService.approve_leave_request(db, admin_user, request_id, comment=comment)
    return {
        "success": True,
        "message": "Leave request approved successfully.",
        "data": format_leave_request_response(approved)
    }

@router.patch("/{request_id}/refuse", response_model=dict)
def refuse_leave_request(
    request_id: int,
    refuse_in: LeaveRequestRefuse,
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    refused = LeaveService.refuse_leave_request(db, admin_user, request_id, refusal_reason=refuse_in.comment)
    return {
        "success": True,
        "message": "Leave request refused.",
        "data": format_leave_request_response(refused)
    }
