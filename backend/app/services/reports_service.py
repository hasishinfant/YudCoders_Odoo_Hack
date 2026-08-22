import csv
import io
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.employee import Employee
from app.models.department import Department
from app.models.attendance import Attendance, AttendanceStatusEnum
from app.models.leave import LeaveRequest, LeaveType, LeaveStatusEnum
from app.models.payroll import Payroll, PayrollStatusEnum

class ReportsService:
    @staticmethod
    def get_employee_report(db: Session) -> Dict[str, Any]:
        total = db.query(Employee).count()
        active = db.query(Employee).filter(Employee.employment_status == "ACTIVE").count()
        inactive = total - active

        # Department breakdown
        dept_counts = db.query(
            Department.name, func.count(Employee.id)
        ).join(Employee, Employee.department_id == Department.id, isouter=True).group_by(Department.name).all()

        dept_summary = [{"department": d[0] or "Unassigned", "count": d[1]} for d in dept_counts]

        # Recent hires
        recent = db.query(Employee).order_by(Employee.created_at.desc()).limit(5).all()
        recent_hires = [
            {
                "employee_code": e.employee_code,
                "name": f"{e.first_name} {e.last_name}",
                "job_title": e.job_title,
                "department": e.department.name if e.department else None,
                "joining_date": str(e.joining_date) if e.joining_date else None
            }
            for e in recent
        ]

        return {
            "total_employees": total,
            "active_employees": active,
            "inactive_employees": inactive,
            "department_breakdown": dept_summary,
            "recent_hires": recent_hires
        }

    @staticmethod
    def get_attendance_report(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        department_id: Optional[int] = None
    ) -> Dict[str, Any]:
        q = db.query(Attendance).join(Employee, Attendance.employee_id == Employee.id)
        if start_date:
            q = q.filter(Attendance.date >= start_date)
        if end_date:
            q = q.filter(Attendance.date <= end_date)
        if department_id:
            q = q.filter(Employee.department_id == department_id)

        records = q.all()
        total_records = len(records)
        present_count = sum(1 for r in records if r.status == AttendanceStatusEnum.PRESENT)
        leave_count = sum(1 for r in records if r.status == AttendanceStatusEnum.LEAVE)
        absent_count = sum(1 for r in records if r.status == AttendanceStatusEnum.ABSENT)
        total_worked_hours = round(sum(r.worked_hours or 0.0 for r in records), 2)
        total_extra_hours = round(sum(r.extra_hours or 0.0 for r in records), 2)

        return {
            "total_records": total_records,
            "present_count": present_count,
            "leave_count": leave_count,
            "absent_count": absent_count,
            "total_worked_hours": total_worked_hours,
            "total_extra_hours": total_extra_hours
        }

    @staticmethod
    def get_leave_report(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        department_id: Optional[int] = None
    ) -> Dict[str, Any]:
        q = db.query(LeaveRequest).join(Employee, LeaveRequest.employee_id == Employee.id)
        if start_date:
            q = q.filter(LeaveRequest.start_date >= start_date)
        if end_date:
            q = q.filter(LeaveRequest.end_date <= end_date)
        if department_id:
            q = q.filter(Employee.department_id == department_id)

        requests = q.all()
        total_requests = len(requests)
        pending = sum(1 for r in requests if r.status == LeaveStatusEnum.PENDING)
        approved = sum(1 for r in requests if r.status == LeaveStatusEnum.APPROVED)
        refused = sum(1 for r in requests if r.status == LeaveStatusEnum.REFUSED)
        cancelled = sum(1 for r in requests if r.status == LeaveStatusEnum.CANCELLED)

        # By type breakdown
        lt_counts = db.query(
            LeaveType.name, func.count(LeaveRequest.id)
        ).join(LeaveRequest, LeaveRequest.leave_type_id == LeaveType.id).group_by(LeaveType.name).all()

        type_breakdown = [{"leave_type": lt[0], "count": lt[1]} for lt in lt_counts]

        return {
            "total_requests": total_requests,
            "pending_count": pending,
            "approved_count": approved,
            "refused_count": refused,
            "cancelled_count": cancelled,
            "leave_type_breakdown": type_breakdown
        }

    @staticmethod
    def get_payroll_report(
        db: Session,
        month: Optional[int] = None,
        year: Optional[int] = None,
        department_id: Optional[int] = None
    ) -> Dict[str, Any]:
        q = db.query(Payroll).join(Employee, Payroll.employee_id == Employee.id)
        if month:
            q = q.filter(Payroll.month == month)
        if year:
            q = q.filter(Payroll.year == year)
        if department_id:
            q = q.filter(Employee.department_id == department_id)

        payrolls = q.all()
        total_records = len(payrolls)
        total_gross = sum(Decimal(str(p.gross_salary)) for p in payrolls) if payrolls else Decimal('0.00')
        total_deductions = sum(Decimal(str(p.deductions)) for p in payrolls) if payrolls else Decimal('0.00')
        total_net = sum(Decimal(str(p.net_salary)) for p in payrolls) if payrolls else Decimal('0.00')

        paid_count = sum(1 for p in payrolls if p.status == PayrollStatusEnum.PAID)
        processed_count = sum(1 for p in payrolls if p.status == PayrollStatusEnum.PROCESSED)
        draft_count = sum(1 for p in payrolls if p.status == PayrollStatusEnum.DRAFT)
        cancelled_count = sum(1 for p in payrolls if p.status == PayrollStatusEnum.CANCELLED)

        return {
            "total_payrolls": total_records,
            "total_gross_salary": float(total_gross),
            "total_deductions": float(total_deductions),
            "total_net_salary": float(total_net),
            "paid_count": paid_count,
            "processed_count": processed_count,
            "draft_count": draft_count,
            "cancelled_count": cancelled_count
        }

    @staticmethod
    def export_report_csv(report_type: str, data: Dict[str, Any]) -> str:
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow(["REPORT TYPE", report_type.upper()])
        writer.writerow(["GENERATED AT", datetime.now().isoformat()])
        writer.writerow([])

        if report_type == "employee":
            writer.writerow(["Metric", "Value"])
            writer.writerow(["Total Employees", data.get("total_employees", 0)])
            writer.writerow(["Active Employees", data.get("active_employees", 0)])
            writer.writerow(["Inactive Employees", data.get("inactive_employees", 0)])
            writer.writerow([])
            writer.writerow(["Department", "Count"])
            for d in data.get("department_breakdown", []):
                writer.writerow([d["department"], d["count"]])

        elif report_type == "attendance":
            writer.writerow(["Metric", "Value"])
            writer.writerow(["Total Records", data.get("total_records", 0)])
            writer.writerow(["Present Count", data.get("present_count", 0)])
            writer.writerow(["Leave Count", data.get("leave_count", 0)])
            writer.writerow(["Absent Count", data.get("absent_count", 0)])
            writer.writerow(["Total Worked Hours", data.get("total_worked_hours", 0)])
            writer.writerow(["Total Extra Hours", data.get("total_extra_hours", 0)])

        elif report_type == "leave":
            writer.writerow(["Metric", "Value"])
            writer.writerow(["Total Requests", data.get("total_requests", 0)])
            writer.writerow(["Pending Count", data.get("pending_count", 0)])
            writer.writerow(["Approved Count", data.get("approved_count", 0)])
            writer.writerow(["Refused Count", data.get("refused_count", 0)])
            writer.writerow(["Cancelled Count", data.get("cancelled_count", 0)])

        elif report_type == "payroll":
            writer.writerow(["Metric", "Value"])
            writer.writerow(["Total Payroll Records", data.get("total_payrolls", 0)])
            writer.writerow(["Total Gross Salary", data.get("total_gross_salary", 0)])
            writer.writerow(["Total Deductions", data.get("total_deductions", 0)])
            writer.writerow(["Total Net Salary", data.get("total_net_salary", 0)])
            writer.writerow(["Paid Count", data.get("paid_count", 0)])
            writer.writerow(["Processed Count", data.get("processed_count", 0)])
            writer.writerow(["Draft Count", data.get("draft_count", 0)])

        return output.getvalue()
