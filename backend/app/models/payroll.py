import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class PayrollStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    PROCESSED = "PROCESSED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"

class EmployeeSalary(Base):
    __tablename__ = "employee_salaries"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), unique=True, nullable=False, index=True)
    basic_salary = Column(Numeric(10, 2), nullable=False, default=0.00)
    allowances = Column(Numeric(10, 2), nullable=False, default=0.00)
    deductions = Column(Numeric(10, 2), nullable=False, default=0.00)
    effective_from = Column(Date, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", back_populates="salary_config")

class Payroll(Base):
    __tablename__ = "payrolls"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    
    basic_salary = Column(Numeric(10, 2), nullable=False)
    allowances = Column(Numeric(10, 2), nullable=False, default=0.00)
    gross_salary = Column(Numeric(10, 2), nullable=False)
    deductions = Column(Numeric(10, 2), nullable=False, default=0.00)
    net_salary = Column(Numeric(10, 2), nullable=False)
    
    status = Column(Enum(PayrollStatusEnum), default=PayrollStatusEnum.DRAFT, index=True)
    comment = Column(Text, nullable=True)
    
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    processed_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", back_populates="payrolls")
