import sys
import os
from datetime import datetime, date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models import User, Employee, Department, LeaveType, LeaveRequest, Announcement, Holiday
from app.models.payroll import EmployeeSalary, Payroll, PayrollStatusEnum
from app.core.security import get_password_hash

def inject():
    db = SessionLocal()
    try:
        print("[INFO] Starting rich data injection...")

        # 1. Department
        dept = db.query(Department).filter(Department.name == "AI & Data Science").first()
        if not dept:
            dept = Department(name="AI & Data Science", description="Artificial Intelligence & Engineering")
            db.add(dept)
            db.commit()
            db.refresh(dept)
        else:
            print("[INFO] AI & Data Science department exists.")

        # 2. Update existing employee@dayflow.com user to Kaaysha Rao
        user = db.query(User).filter(User.email == "employee@dayflow.com").first()
        if user:
            emp = db.query(Employee).filter(Employee.user_id == user.id).first()
            if emp:
                emp.first_name = "Kaaysha"
                emp.last_name = "Rao"
                emp.job_title = "AI Engineer"
                emp.department_id = dept.id
                emp.joining_date = date(2023, 8, 1)
                emp.employee_code = "EMP00123"
                emp.company_name = "Dayflow"
                emp.location = "Noida Hub"
                db.commit()
                print("[SUCCESS] Updated employee@dayflow.com to Kaaysha Rao (AI Engineer).")
        else:
            print("[ERROR] employee@dayflow.com user not found to update.")
            return

        # 3. Get employee details
        emp = db.query(Employee).filter(Employee.employee_code == "EMP00123").first()
        
        # 4. Set Employee Salary Configuration
        sal_config = db.query(EmployeeSalary).filter(EmployeeSalary.employee_id == emp.id).first()
        if not sal_config:
            sal_config = EmployeeSalary(
                employee_id=emp.id,
                basic_salary=50000.00,
                allowances=65000.00,
                deductions=36550.00,
                effective_from=date(2023, 8, 1)
            )
            db.add(sal_config)
            db.commit()
            print("[SUCCESS] Created Salary Config for Kaaysha Rao.")
        else:
            sal_config.basic_salary = 50000.00
            sal_config.allowances = 65000.00
            sal_config.deductions = 36550.00
            db.commit()
            print("[SUCCESS] Updated Salary Config for Kaaysha Rao.")

        # 5. Clear old payrolls for Kaaysha Rao and insert exact wireframe records
        db.query(Payroll).filter(Payroll.employee_id == emp.id).delete()
        db.commit()

        # Nov 2024 to Apr 2025 payroll records
        payrolls_data = [
            # Apr 2025
            { "month": 4, "year": 2025, "basic": 50000.00, "allowances": 65000.00, "deductions": 36550.00, "net": 78450.00, "paid_at": datetime(2025, 4, 30, 16, 0) },
            # Mar 2025
            { "month": 3, "year": 2025, "basic": 50000.00, "allowances": 65000.00, "deductions": 36550.00, "net": 78450.00, "paid_at": datetime(2025, 3, 31, 16, 0) },
            # Feb 2025
            { "month": 2, "year": 2025, "basic": 50000.00, "allowances": 63500.00, "deductions": 36550.00, "net": 76950.00, "paid_at": datetime(2025, 2, 28, 16, 0) },
            # Jan 2025
            { "month": 1, "year": 2025, "basic": 50000.00, "allowances": 65000.00, "deductions": 36550.00, "net": 78450.00, "paid_at": datetime(2025, 1, 31, 16, 0) },
            # Dec 2024
            { "month": 12, "year": 2024, "basic": 50000.00, "allowances": 65000.00, "deductions": 36550.00, "net": 78450.00, "paid_at": datetime(2024, 12, 31, 16, 0) },
            # Nov 2024
            { "month": 11, "year": 2024, "basic": 50000.00, "allowances": 63500.00, "deductions": 36550.00, "net": 76950.00, "paid_at": datetime(2024, 11, 30, 16, 0) },
        ]

        for p_info in payrolls_data:
            p = Payroll(
                employee_id=emp.id,
                month=p_info["month"],
                year=p_info["year"],
                period_start=date(p_info["year"], p_info["month"], 1),
                period_end=date(p_info["year"], p_info["month"] + 1, 1) if p_info["month"] < 12 else date(p_info["year"] + 1, 1, 1),
                basic_salary=p_info["basic"],
                allowances=p_info["allowances"],
                gross_salary=p_info["basic"] + p_info["allowances"],
                deductions=p_info["deductions"],
                net_salary=p_info["net"],
                status=PayrollStatusEnum.PAID,
                paid_at=p_info["paid_at"],
                processed_at=p_info["paid_at"]
            )
            # Adjust date period_end for month end
            import calendar
            last_day = calendar.monthrange(p_info["year"], p_info["month"])[1]
            p.period_end = date(p_info["year"], p_info["month"], last_day)
            db.add(p)
        
        db.commit()
        print("[SUCCESS] Seeded exact payslip history for Kaaysha Rao.")

        # 6. Seed Leaves to render colors on calendar
        db.query(LeaveRequest).filter(LeaveRequest.employee_id == emp.id).delete()
        db.commit()

        pto_type = db.query(LeaveType).filter(LeaveType.name == "Paid Time Off").first()
        sick_type = db.query(LeaveType).filter(LeaveType.name == "Sick Leave").first()

        leaves_data = [
            { "type_id": pto_type.id, "start": date(2026, 8, 10), "end": date(2026, 8, 14), "status": "APPROVED", "reason": "Family vacation" },
            { "type_id": pto_type.id, "start": date(2026, 9, 2), "end": date(2026, 9, 4), "status": "PENDING", "reason": "Personal work" },
            { "type_id": sick_type.id, "start": date(2026, 5, 12), "end": date(2026, 5, 13), "status": "APPROVED", "reason": "Fever & rest" }
        ]

        for l_info in leaves_data:
            lr = LeaveRequest(
                employee_id=emp.id,
                leave_type_id=l_info["type_id"],
                start_date=l_info["start"],
                end_date=l_info["end"],
                status=l_info["status"],
                reason=l_info["reason"]
            )
            db.add(lr)
        
        db.commit()
        print("[SUCCESS] Seeded leave requests for calendar rendering.")

        # 7. Create another dummy account Aarav Sharma for testing
        aarav_user = db.query(User).filter(User.email == "aarav.sharma@dayflow.com").first()
        if not aarav_user:
            aarav_user = User(
                email="aarav.sharma@dayflow.com",
                password_hash=get_password_hash("AaravPassword123!"),
                role="EMPLOYEE",
                must_change_password=False,
                active=True
            )
            db.add(aarav_user)
            db.commit()
            db.refresh(aarav_user)

            aarav_emp = Employee(
                user_id=aarav_user.id,
                employee_code="EMP00125",
                first_name="Aarav",
                last_name="Sharma",
                job_title="Frontend Developer",
                department_id=dept.id,
                phone="+91 95555 44444",
                address="Indiranagar, Bengaluru, Karnataka - 560038",
                date_of_birth=date(2001, 8, 20),
                gender="Male",
                marital_status="Single",
                nationality="Indian",
                joining_date=date(2024, 6, 1),
                employment_status="ACTIVE",
                company_name="Dayflow",
                location="Bengaluru Hub"
            )
            db.add(aarav_emp)
            db.commit()
            print("[SUCCESS] Created Aarav Sharma employee account.")

        print("[SUCCESS] Rich test data injection complete!")
    except Exception as e:
        print(f"[ERROR] Injection failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    inject()
