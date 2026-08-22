from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    
    employee_code = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    job_title = Column(String, nullable=True)
    joining_date = Column(Date, nullable=True)
    employment_status = Column(String, default="ACTIVE")
    company_name = Column(String, nullable=True, default="Dayflow")
    location = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    about = Column(String, nullable=True)
    skills = Column(String, nullable=True)
    certifications = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="employee")
    department = relationship("Department", back_populates="employees")
    
    attendances = relationship("Attendance", back_populates="employee")
    leave_requests = relationship("LeaveRequest", back_populates="employee", foreign_keys="[LeaveRequest.employee_id]")
    payrolls = relationship("Payroll", back_populates="employee")
    documents = relationship("Document", back_populates="employee")
