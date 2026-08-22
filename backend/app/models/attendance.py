from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Date, DateTime, Float, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class AttendanceStatusEnum(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    HALF_DAY = "HALF_DAY"
    LEAVE = "LEAVE"

class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    worked_hours = Column(Float, nullable=True)
    extra_hours = Column(Float, nullable=True)
    status = Column(Enum(AttendanceStatusEnum), default=AttendanceStatusEnum.PRESENT)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", back_populates="attendances")

    __table_args__ = (
        UniqueConstraint('employee_id', 'date', name='uq_attendance_employee_date'),
    )
