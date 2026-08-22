from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from app.models.attendance import AttendanceStatusEnum
from app.models.leave import LeaveStatusEnum
from app.models.payroll import PayrollStatusEnum

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

# Salary Schemas
class EmployeeSalaryBase(BaseModel):
    basic_salary: Decimal = Field(..., ge=0)
    allowances: Decimal = Field(Decimal('0.00'), ge=0)
    deductions: Decimal = Field(Decimal('0.00'), ge=0)
    effective_from: date

class EmployeeSalaryCreate(BaseModel):
    employee_id: int
    basic_salary: Decimal = Field(..., ge=0)
    allowances: Decimal = Field(Decimal('0.00'), ge=0)
    deductions: Decimal = Field(Decimal('0.00'), ge=0)
    effective_from: Optional[date] = None

class EmployeeSalaryUpdate(BaseModel):
    basic_salary: Optional[Decimal] = Field(None, ge=0)
    allowances: Optional[Decimal] = Field(None, ge=0)
    deductions: Optional[Decimal] = Field(None, ge=0)
    effective_from: Optional[date] = None

class EmployeeSalaryResponse(BaseModel):
    id: int
    employee_id: int
    basic_salary: Decimal
    allowances: Decimal
    gross_salary: Decimal
    deductions: Decimal
    net_salary: Decimal
    effective_from: date
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Payroll Schemas
class PayrollGenerateRequest(BaseModel):
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2100)
    employee_id: Optional[int] = None

class PayrollResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department_name: Optional[str] = None
    month: int
    year: int
    period_start: date
    period_end: date
    basic_salary: Decimal
    allowances: Decimal
    gross_salary: Decimal
    deductions: Decimal
    net_salary: Decimal
    status: PayrollStatusEnum
    comment: Optional[str] = None
    worked_hours: Optional[float] = None
    approved_leave_days: Optional[int] = None
    generated_at: datetime
    processed_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
