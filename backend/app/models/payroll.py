from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Date, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

class Payroll(Base):
    __tablename__ = "payrolls"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    effective_from = Column(Date, nullable=False)
    
    basic_salary = Column(Numeric(10, 2), nullable=False)
    allowances = Column(Numeric(10, 2), default=0)
    deductions = Column(Numeric(10, 2), default=0)
    net_salary = Column(Numeric(10, 2), nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", back_populates="payrolls")
