from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.department import Department
from app.models.audit_log import AuditLog
from app.repositories.core import user_repo, employee_repo
from app.schemas.core import EmployeeCreateAdmin, EmployeeUpdate, EmployeeUpdateSelf
from app.core.utils import generate_login_id, generate_initial_password
from app.core import security

class EmployeeService:
    @staticmethod
    def create_employee_by_admin(
        db: Session, 
        admin_user: User, 
        emp_in: EmployeeCreateAdmin
    ) -> Dict[str, Any]:
        # 1. Validate email uniqueness
        existing_user = user_repo.get_by_email(db, email=emp_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists."
            )

        # 2. Validate department if provided
        dept_name = None
        if emp_in.department_id:
            dept = db.query(Department).filter(Department.id == emp_in.department_id).first()
            if not dept:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Department not found."
                )
            dept_name = dept.name

        # 3. Determine company & joining year
        company_name = emp_in.company_name or "Dayflow"
        joining_date = emp_in.joining_date or datetime.now(timezone.utc).date()
        joining_year = joining_date.year

        # 4. Generate Login ID & Initial Password
        login_id = generate_login_id(
            db=db,
            company_name=company_name,
            first_name=emp_in.first_name,
            last_name=emp_in.last_name,
            join_year=joining_year
        )
        initial_password = generate_initial_password()
        hashed_password = security.get_password_hash(initial_password)

        # 5. Database transaction
        try:
            # Create User
            user = User(
                email=emp_in.email,
                password_hash=hashed_password,
                role=RoleEnum.EMPLOYEE,
                active=True,
                must_change_password=True
            )
            db.add(user)
            db.flush()

            # Create Employee
            employee = Employee(
                user_id=user.id,
                department_id=emp_in.department_id,
                employee_code=login_id,
                first_name=emp_in.first_name,
                last_name=emp_in.last_name,
                phone=emp_in.phone,
                address=emp_in.address,
                job_title=emp_in.job_title,
                joining_date=joining_date,
                employment_status="ACTIVE",
                company_name=company_name,
                location=emp_in.location,
                date_of_birth=emp_in.date_of_birth,
                gender=emp_in.gender,
                marital_status=emp_in.marital_status,
                nationality=emp_in.nationality,
                avatar_url=emp_in.avatar_url
            )
            db.add(employee)
            db.flush()

            # Create Audit Log
            audit_log = AuditLog(
                user_id=admin_user.id,
                action="CREATE_EMPLOYEE",
                entity="Employee",
                entity_id=employee.id,
                metadata_details=f"Created employee {login_id} for {emp_in.first_name} {emp_in.last_name} ({emp_in.email})"
            )
            db.add(audit_log)

            db.commit()
            db.refresh(employee)
            db.refresh(user)

        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create employee record: {str(e)}"
            )

        # Build response payload
        return {
            "id": employee.id,
            "user_id": user.id,
            "employee_code": login_id,
            "login_id": login_id,
            "initial_password": initial_password,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "email": user.email,
            "job_title": employee.job_title,
            "department_id": employee.department_id,
            "department_name": dept_name,
            "joining_date": employee.joining_date,
            "employment_status": employee.employment_status,
            "company_name": employee.company_name,
            "location": employee.location,
            "created_at": employee.created_at
        }

    @staticmethod
    def update_employee_by_admin(
        db: Session,
        admin_user: User,
        employee_id: int,
        emp_in: EmployeeUpdate
    ) -> Employee:
        employee = employee_repo.get(db, id=employee_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        update_data = emp_in.model_dump(exclude_unset=True)

        if "department_id" in update_data and update_data["department_id"] is not None:
            dept = db.query(Department).filter(Department.id == update_data["department_id"]).first()
            if not dept:
                raise HTTPException(status_code=404, detail="Department not found")

        if "employment_status" in update_data:
            new_status = update_data["employment_status"]
            if new_status.upper() in ["INACTIVE", "TERMINATED", "DEACTIVATED"]:
                employee.user.active = False
            elif new_status.upper() == "ACTIVE":
                employee.user.active = True

        employee_repo.update(db, db_obj=employee, obj_in=update_data)

        # Audit log
        audit = AuditLog(
            user_id=admin_user.id,
            action="UPDATE_EMPLOYEE",
            entity="Employee",
            entity_id=employee.id,
            metadata_details=f"Admin updated employee {employee.employee_code}"
        )
        db.add(audit)
        db.commit()
        db.refresh(employee)
        return employee

    @staticmethod
    def update_employee_self(
        db: Session,
        user: User,
        emp_in: EmployeeUpdateSelf
    ) -> Employee:
        employee = employee_repo.get_by_user_id(db, user_id=user.id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee profile not found for current user")

        update_data = emp_in.model_dump(exclude_unset=True)
        employee_repo.update(db, db_obj=employee, obj_in=update_data)

        audit = AuditLog(
            user_id=user.id,
            action="UPDATE_SELF_PROFILE",
            entity="Employee",
            entity_id=employee.id,
            metadata_details=f"User updated their own profile"
        )
        db.add(audit)
        db.commit()
        db.refresh(employee)
        return employee

    @staticmethod
    def set_employee_status(
        db: Session,
        admin_user: User,
        employee_id: int,
        active: bool
    ) -> Employee:
        employee = employee_repo.get(db, id=employee_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        employee.user.active = active
        employee.employment_status = "ACTIVE" if active else "INACTIVE"
        
        audit = AuditLog(
            user_id=admin_user.id,
            action="DEACTIVATE_EMPLOYEE" if not active else "ACTIVATE_EMPLOYEE",
            entity="Employee",
            entity_id=employee.id,
            metadata_details=f"Set employee {employee.employee_code} active={active}"
        )
        db.add(audit)
        db.commit()
        db.refresh(employee)
        return employee
