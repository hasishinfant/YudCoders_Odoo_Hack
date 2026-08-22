from typing import Optional, List, Tuple
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.repositories.base import CRUDBase
from app.models.user import User
from app.models.employee import Employee
from app.models.department import Department
from app.schemas.core import UserCreate, EmployeeCreate, EmployeeUpdate

class CRUDUser(CRUDBase[User, UserCreate, UserCreate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()
        
    def get_by_identifier(self, db: Session, *, identifier: str) -> Optional[User]:
        if "@" in identifier:
            return self.get_by_email(db, email=identifier)
        employee = db.query(Employee).filter(Employee.employee_code == identifier).first()
        if employee:
            return employee.user
        return None

class CRUDEmployee(CRUDBase[Employee, EmployeeCreate, EmployeeUpdate]):
    def get_by_employee_code(self, db: Session, *, employee_code: str) -> Optional[Employee]:
        return db.query(Employee).filter(Employee.employee_code == employee_code).first()

    def get_by_user_id(self, db: Session, *, user_id: int) -> Optional[Employee]:
        return db.query(Employee).filter(Employee.user_id == user_id).first()

    def search(
        self, 
        db: Session, 
        *, 
        query_str: Optional[str] = None, 
        department_id: Optional[int] = None, 
        skip: int = 0, 
        limit: int = 20
    ) -> Tuple[List[Employee], int]:
        q = db.query(Employee).join(User, Employee.user_id == User.id, isouter=True).join(Department, Employee.department_id == Department.id, isouter=True)
        
        if department_id:
            q = q.filter(Employee.department_id == department_id)
            
        if query_str:
            term = f"%{query_str}%"
            q = q.filter(
                or_(
                    Employee.first_name.ilike(term),
                    Employee.last_name.ilike(term),
                    Employee.employee_code.ilike(term),
                    Employee.job_title.ilike(term),
                    User.email.ilike(term),
                    Department.name.ilike(term)
                )
            )
            
        total = q.count()
        items = q.offset(skip).limit(limit).all()
        return items, total

user_repo = CRUDUser(User)
employee_repo = CRUDEmployee(Employee)
