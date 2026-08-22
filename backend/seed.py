import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models import User, Employee, Department, LeaveType
from app.core.security import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("[INFO] Seeding Dayflow HRMS database...")

        # 1. Seed Departments
        dept_eng = db.query(Department).filter(Department.name == "Engineering").first()
        if not dept_eng:
            dept_eng = Department(name="Engineering", description="Software Development & Infrastructure")
            db.add(dept_eng)

        dept_hr = db.query(Department).filter(Department.name == "Human Resources").first()
        if not dept_hr:
            dept_hr = Department(name="Human Resources", description="People Operations & Talent")
            db.add(dept_hr)

        dept_fin = db.query(Department).filter(Department.name == "Finance").first()
        if not dept_fin:
            dept_fin = Department(name="Finance", description="Payroll & Accounting")
            db.add(dept_fin)

        db.commit()
        db.refresh(dept_eng)
        db.refresh(dept_hr)

        # 2. Seed Leave Types
        pto = db.query(LeaveType).filter(LeaveType.name == "Paid Time Off").first()
        if not pto:
            pto = LeaveType(name="Paid Time Off", max_days=20, paid=True, active=True)
            db.add(pto)

        sick = db.query(LeaveType).filter(LeaveType.name == "Sick Leave").first()
        if not sick:
            sick = LeaveType(name="Sick Leave", max_days=10, paid=True, active=True)
            db.add(sick)

        unpaid = db.query(LeaveType).filter(LeaveType.name == "Unpaid Leave").first()
        if not unpaid:
            unpaid = LeaveType(name="Unpaid Leave", max_days=15, paid=False, active=True)
            db.add(unpaid)

        db.commit()

        # 3. Seed Admin Account
        admin_user = db.query(User).filter(User.email == "admin@dayflow.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@dayflow.com",
                password_hash=get_password_hash("AdminPassword123!"),
                role="ADMIN",
                must_change_password=False,
                active=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

            admin_emp = Employee(
                user_id=admin_user.id,
                employee_code="OIJS0001",
                first_name="Admin",
                last_name="User",
                job_title="HR Director",
                department_id=dept_hr.id,
                joining_date=datetime.strptime("2024-01-01", "%Y-%m-%d").date(),
                employment_status="ACTIVE",
                company_name="Dayflow Inc.",
                location="Headquarters"
            )
            db.add(admin_emp)
            db.commit()
            print("[SUCCESS] Admin created: admin@dayflow.com / AdminPassword123!")
        else:
            print("[INFO] Admin user admin@dayflow.com already exists.")

        # 4. Seed Employee Account
        emp_user = db.query(User).filter(User.email == "employee@dayflow.com").first()
        if not emp_user:
            emp_user = User(
                email="employee@dayflow.com",
                password_hash=get_password_hash("EmployeePassword123!"),
                role="EMPLOYEE",
                must_change_password=False,
                active=True
            )
            db.add(emp_user)
            db.commit()
            db.refresh(emp_user)

            employee_record = Employee(
                user_id=emp_user.id,
                employee_code="OIJS0002",
                first_name="John",
                last_name="Doe",
                job_title="Senior Engineer",
                department_id=dept_eng.id,
                joining_date=datetime.strptime("2024-02-15", "%Y-%m-%d").date(),
                employment_status="ACTIVE",
                company_name="Dayflow Inc.",
                location="Remote"
            )
            db.add(employee_record)
            db.commit()

            print("[SUCCESS] Employee created: employee@dayflow.com / EmployeePassword123!")
        else:
            print("[INFO] Employee user employee@dayflow.com already exists.")

        print("[SUCCESS] Database seeded successfully!")

    except Exception as e:
        print(f"[ERROR] Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
