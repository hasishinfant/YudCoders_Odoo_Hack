from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date, time
from typing import Optional
from app.models.user import RoleEnum
from app.models.attendance import AttendanceStatusEnum
from app.models.leave import LeaveStatusEnum

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    role: RoleEnum = RoleEnum.EMPLOYEE
    active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: int
    email_verified: bool
    must_change_password: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Employee Schemas
class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    job_title: Optional[str] = None
    joining_date: Optional[date] = None
    employment_status: str = "ACTIVE"
    department_id: Optional[int] = None
    company_name: Optional[str] = "Dayflow"
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    about: Optional[str] = None
    skills: Optional[str] = None
    certifications: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    user_id: int
    employee_code: str

class EmployeeCreateAdmin(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    job_title: Optional[str] = None
    joining_date: Optional[date] = None
    department_id: Optional[int] = None
    company_name: Optional[str] = "Dayflow"
    location: Optional[str] = None

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    job_title: Optional[str] = None
    department_id: Optional[int] = None
    joining_date: Optional[date] = None
    employment_status: Optional[str] = None
    company_name: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    about: Optional[str] = None
    skills: Optional[str] = None
    certifications: Optional[str] = None

class EmployeeUpdateSelf(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    avatar_url: Optional[str] = None
    about: Optional[str] = None
    skills: Optional[str] = None
    certifications: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: int
    user_id: int
    employee_code: str
    email: Optional[str] = None
    department_name: Optional[str] = None
    user_active: Optional[bool] = True
    user_role: Optional[str] = "EMPLOYEE"
    created_at: datetime

    class Config:
        from_attributes = True

class EmployeeCreateAdminResponse(BaseModel):
    success: bool = True
    message: str = "Employee created successfully"
    data: dict
