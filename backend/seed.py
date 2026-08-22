import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models import User, Employee, Department, LeaveType, Announcement, Holiday
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
                phone="+91 98765 43210",
                address="Koramangala, Bengaluru, Karnataka - 560034",
                date_of_birth=datetime.strptime("2003-11-20", "%Y-%m-%d").date(),
                gender="Female",
                marital_status="Single",
                nationality="Indian",
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
                employee_code="EMP00123",
                first_name="Employee",
                last_name="User",
                job_title="Software Engineer",
                department_id=dept_eng.id,
                phone="+91 98765 43210",
                address="Koramangala, Bengaluru, Karnataka - 560034",
                date_of_birth=datetime.strptime("2003-11-20", "%Y-%m-%d").date(),
                gender="Female",
                marital_status="Single",
                nationality="Indian",
                joining_date=datetime.strptime("2023-08-15", "%Y-%m-%d").date(),
                employment_status="ACTIVE",
                company_name="Dayflow Inc.",
                location="Remote"
            )
            db.add(employee_record)
            db.commit()

            print("[SUCCESS] Employee created: employee@dayflow.com / EmployeePassword123!")
        else:
            print("[INFO] Employee user employee@dayflow.com already exists.")

        # 5. Seed Manav Nagpal Account
        manav_user = db.query(User).filter(User.email == "manav.nagpal@dayflow.com").first()
        if not manav_user:
            manav_user = User(
                email="manav.nagpal@dayflow.com",
                password_hash=get_password_hash("ManavPassword123!"),
                role="EMPLOYEE",
                must_change_password=False,
                active=True
            )
            db.add(manav_user)
            db.commit()
            db.refresh(manav_user)

            manav_record = Employee(
                user_id=manav_user.id,
                employee_code="EMP00124",
                first_name="Manav",
                last_name="Nagpal",
                job_title="Software Development Engineer",
                department_id=dept_eng.id,
                phone="+91 99999 88888",
                address="Saket, New Delhi, Delhi - 110017",
                date_of_birth=datetime.strptime("2002-05-12", "%Y-%m-%d").date(),
                gender="Male",
                marital_status="Single",
                nationality="Indian",
                joining_date=datetime.strptime("2025-01-10", "%Y-%m-%d").date(),
                employment_status="ACTIVE",
                company_name="Dayflow Inc.",
                location="Delhi Office"
            )
            db.add(manav_record)
            db.commit()
            print("[SUCCESS] Manav Nagpal created: manav.nagpal@dayflow.com / ManavPassword123!")
        # Seed Announcements
        if db.query(Announcement).count() == 0:
            announcements = [
                Announcement(
                    title="Quarterly Performance Cycle Review",
                    summary="The Q3 feedback cycle starts next week. Please complete your self-evaluation form in the performance portal by end of this week.",
                    date="Aug 20, 2026",
                    tag="HR Notice",
                    tag_color="bg-blue-50 text-[#0052FF] border-blue-100"
                ),
                Announcement(
                    title="Independence Day Holiday & Event",
                    summary="Office will remain closed on Saturday, August 15. Join us for a flag hoisting ceremony & high tea on Friday evening.",
                    date="Aug 12, 2026",
                    tag="Event",
                    tag_color="bg-emerald-50 text-emerald-700 border-emerald-100"
                ),
                Announcement(
                    title="New Office Location in Noida Sector 62",
                    summary="Our new development hub is now fully operational! Contact facilities team to schedule hot-desking options.",
                    date="Jul 28, 2026",
                    tag="Facility",
                    tag_color="bg-purple-50 text-purple-700 border-purple-100"
                )
            ]
            db.bulk_save_objects(announcements)
            db.commit()
            print("[SUCCESS] Seeded announcements.")

        # Seed Holidays
        if db.query(Holiday).count() == 0:
            holidays = [
                Holiday(name="Ganesh Chaturthi", date=datetime.strptime("2026-09-15", "%Y-%m-%d").date(), type="Gazetted"),
                Holiday(name="Gandhi Jayanti", date=datetime.strptime("2026-10-02", "%Y-%m-%d").date(), type="National"),
                Holiday(name="Diwali (Deepavali)", date=datetime.strptime("2026-11-08", "%Y-%m-%d").date(), type="Gazetted"),
                Holiday(name="Christmas Day", date=datetime.strptime("2026-12-25", "%Y-%m-%d").date(), type="Gazetted")
            ]
            db.bulk_save_objects(holidays)
            db.commit()
            print("[SUCCESS] Seeded holidays.")

        print("[SUCCESS] Database seeded successfully!")

    except Exception as e:
        print(f"[ERROR] Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
