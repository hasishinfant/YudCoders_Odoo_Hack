from pydantic import BaseModel, Field
from datetime import datetime, date, time
from typing import Optional
from decimal import Decimal
from app.models.attendance import AttendanceStatusEnum
from app.models.leave import LeaveStatusEnum

# Attendance Schemas
class AttendanceBase(BaseModel):
    date: date
    status: AttendanceStatusEnum = AttendanceStatusEnum.PRESENT
    check_in: Optional[time] = None
    check_out: Optional[time] = None

class AttendanceCreate(AttendanceBase):
    employee_id: int

class AttendanceResponse(AttendanceBase):
    id: int
    employee_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Leave Schemas
class LeaveTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    paid: bool = True
    active: bool = True

class LeaveTypeResponse(LeaveTypeBase):
    id: int

    class Config:
        from_attributes = True

class LeaveRequestBase(BaseModel):
    start_date: date
    end_date: date
    reason: Optional[str] = None

class LeaveRequestCreate(LeaveRequestBase):
    leave_type_id: int

class LeaveRequestUpdate(BaseModel):
    status: LeaveStatusEnum
    comment: Optional[str] = None

class LeaveRequestResponse(LeaveRequestBase):
    id: int
    employee_id: int
    leave_type_id: int
    status: LeaveStatusEnum
    comment: Optional[str] = None
    approver_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

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
