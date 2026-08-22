from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from app.models.attendance import AttendanceStatusEnum
from app.models.leave import LeaveStatusEnum

# Attendance Schemas
class AttendanceBase(BaseModel):
    date: date
    status: AttendanceStatusEnum = AttendanceStatusEnum.PRESENT
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    worked_hours: Optional[float] = None
    extra_hours: Optional[float] = None

class AttendanceCreate(AttendanceBase):
    employee_id: int

class AttendanceResponse(AttendanceBase):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Leave Type Schemas
class LeaveTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    paid: bool = True
    max_days: int = 15
    active: bool = True

class LeaveTypeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    paid: bool = True
    max_days: int = 15

class LeaveTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    paid: Optional[bool] = None
    max_days: Optional[int] = None
    active: Optional[bool] = None

class LeaveTypeResponse(LeaveTypeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Leave Request Schemas
class LeaveRequestCreate(BaseModel):
    leave_type_id: int
    start_date: date
    end_date: date
    reason: Optional[str] = None

class LeaveRequestApprove(BaseModel):
    comment: Optional[str] = None

class LeaveRequestRefuse(BaseModel):
    comment: str = Field(..., min_length=1, description="Refusal reason is required")

class LeaveRequestResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department_name: Optional[str] = None
    leave_type_id: int
    leave_type_name: Optional[str] = None
    leave_type_paid: Optional[bool] = None
    start_date: date
    end_date: date
    duration_days: int
    reason: Optional[str] = None
    comment: Optional[str] = None
    status: LeaveStatusEnum
    approver_id: Optional[int] = None
    approver_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LeaveBalanceResponse(BaseModel):
    leave_type_id: int
    leave_type_name: str
    paid: bool
    max_days: int
    used_days: int
    remaining_days: int

# Payroll Schemas
class PayrollBase(BaseModel):
    effective_from: date
    basic_salary: Decimal
    allowances: Decimal = Decimal('0.00')
    deductions: Decimal = Decimal('0.00')

class PayrollCreate(PayrollBase):
    employee_id: int

class PayrollResponse(PayrollBase):
    id: int
    employee_id: int
    net_salary: Decimal
    created_at: datetime

    class Config:
        from_attributes = True
