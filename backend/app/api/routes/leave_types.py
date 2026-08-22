from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.services.leave_service import LeaveService
from app.schemas.hr import LeaveTypeResponse, LeaveTypeCreate, LeaveTypeUpdate

router = APIRouter()

@router.get("", response_model=dict)
def list_leave_types(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    leave_types = LeaveService.get_leave_types(db, active_only=True)
    return {
        "success": True,
        "data": [LeaveTypeResponse.model_validate(lt) for lt in leave_types]
    }

@router.post("", response_model=dict)
def create_leave_type(
    lt_in: LeaveTypeCreate,
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    leave_type = LeaveService.create_leave_type(db, admin_user, lt_in)
    return {
        "success": True,
        "message": "Leave type created successfully.",
        "data": LeaveTypeResponse.model_validate(leave_type)
    }

@router.patch("/{leave_type_id}", response_model=dict)
def update_leave_type(
    leave_type_id: int,
    lt_in: LeaveTypeUpdate,
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    updated = LeaveService.update_leave_type(db, admin_user, leave_type_id, lt_in)
    return {
        "success": True,
        "message": "Leave type updated successfully.",
        "data": LeaveTypeResponse.model_validate(updated)
    }
