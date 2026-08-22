from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.department import Department
from app.schemas.core import DepartmentResponse, DepartmentCreate

router = APIRouter()

@router.get("", response_model=dict)
def list_departments(
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_user)
) -> Any:
    depts = db.query(Department).all()
    # Seed default departments if table is empty
    if not depts:
        default_names = ["Human Resources", "Engineering", "Sales", "Marketing", "Finance"]
        for d_name in default_names:
            d = Department(name=d_name, description=f"{d_name} Department")
            db.add(d)
        db.commit()
        depts = db.query(Department).all()

    return {
        "success": True,
        "data": [DepartmentResponse.model_validate(d) for d in depts]
    }

@router.post("", response_model=dict)
def create_department(
    dept_in: DepartmentCreate,
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.require_admin)
) -> Any:
    existing = db.query(Department).filter(Department.name == dept_in.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Department already exists")
    dept = Department(name=dept_in.name, description=dept_in.description)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {
        "success": True,
        "data": DepartmentResponse.model_validate(dept)
    }
