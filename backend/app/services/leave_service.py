from datetime import datetime, date, timezone
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from fastapi import HTTPException, status

from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.department import Department
from app.models.leave import LeaveType, LeaveRequest, LeaveStatusEnum
from app.models.audit_log import AuditLog
from app.repositories.core import employee_repo
from app.schemas.hr import LeaveTypeCreate, LeaveTypeUpdate, LeaveRequestCreate

class LeaveService:
    @staticmethod
    def get_employee_for_user(db: Session, user: User) -> Employee:
        if not user.active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user account cannot perform leave actions."
            )
        employee = employee_repo.get_by_user_id(db, user_id=user.id)
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No linked employee profile found for current user."
            )
        return employee

    @staticmethod
    def seed_default_leave_types(db: Session) -> List[LeaveType]:
        existing = db.query(LeaveType).all()
        if not existing:
            defaults = [
                {"name": "Paid Time Off", "description": "Annual Paid Time Off", "paid": True, "max_days": 15},
                {"name": "Sick Leave", "description": "Medical & Sick Leave", "paid": True, "max_days": 10},
                {"name": "Unpaid Leave", "description": "Unpaid Leave", "paid": False, "max_days": 30},
                {"name": "Casual Leave", "description": "Casual / Personal Leave", "paid": True, "max_days": 7},
            ]
            for item in defaults:
                db.add(LeaveType(**item))
            db.commit()
            existing = db.query(LeaveType).all()
        return existing

    @staticmethod
    def get_leave_types(db: Session, active_only: bool = True) -> List[LeaveType]:
        LeaveService.seed_default_leave_types(db)
        q = db.query(LeaveType)
        if active_only:
            q = q.filter(LeaveType.active == True)
        return q.all()

    @staticmethod
    def create_leave_type(db: Session, admin_user: User, lt_in: LeaveTypeCreate) -> LeaveType:
        existing = db.query(LeaveType).filter(LeaveType.name == lt_in.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Leave type with this name already exists."
            )
        leave_type = LeaveType(
            name=lt_in.name,
            description=lt_in.description,
            paid=lt_in.paid,
            max_days=lt_in.max_days,
            active=True
        )
        db.add(leave_type)
        db.flush()

        audit = AuditLog(
            user_id=admin_user.id,
            action="CREATE_LEAVE_TYPE",
            entity="LeaveType",
            entity_id=leave_type.id,
            metadata_details=f"Created leave type {leave_type.name}"
        )
        db.add(audit)
        db.commit()
        db.refresh(leave_type)
        return leave_type

    @staticmethod
    def update_leave_type(db: Session, admin_user: User, leave_type_id: int, lt_in: LeaveTypeUpdate) -> LeaveType:
        leave_type = db.query(LeaveType).filter(LeaveType.id == leave_type_id).first()
        if not leave_type:
            raise HTTPException(status_code=404, detail="Leave type not found")

        update_data = lt_in.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(leave_type, key, val)

        audit = AuditLog(
            user_id=admin_user.id,
            action="UPDATE_LEAVE_TYPE",
            entity="LeaveType",
            entity_id=leave_type.id,
            metadata_details=f"Updated leave type {leave_type.name}"
        )
        db.add(audit)
        db.commit()
        db.refresh(leave_type)
        return leave_type

    @staticmethod
    def create_leave_request(db: Session, user: User, req_in: LeaveRequestCreate) -> LeaveRequest:
        employee = LeaveService.get_employee_for_user(db, user)

        # 1. Date Validation
        if req_in.start_date > req_in.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start date cannot be after end date."
            )

        # 2. Leave Type Validation
        leave_type = db.query(LeaveType).filter(LeaveType.id == req_in.leave_type_id).first()
        if not leave_type or not leave_type.active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected leave type is inactive or invalid."
            )

        # 3. Overlapping Leave Check (PENDING or APPROVED)
        overlapping = db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == employee.id,
            LeaveRequest.status.in_([LeaveStatusEnum.PENDING, LeaveStatusEnum.APPROVED]),
            LeaveRequest.start_date <= req_in.end_date,
            LeaveRequest.end_date >= req_in.start_date
        ).first()

        if overlapping:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An existing leave request overlaps with these dates."
            )

        # 4. Create Request
        leave_request = LeaveRequest(
            employee_id=employee.id,
            leave_type_id=req_in.leave_type_id,
            start_date=req_in.start_date,
            end_date=req_in.end_date,
            reason=req_in.reason,
            status=LeaveStatusEnum.PENDING
        )
        db.add(leave_request)
        db.flush()

        audit = AuditLog(
            user_id=user.id,
            action="CREATE_LEAVE_REQUEST",
            entity="LeaveRequest",
            entity_id=leave_request.id,
            metadata_details=f"Employee {employee.employee_code} requested {leave_type.name} from {req_in.start_date} to {req_in.end_date}"
        )
        db.add(audit)
        db.commit()
        db.refresh(leave_request)
        return leave_request

    @staticmethod
    def cancel_leave_request(db: Session, user: User, request_id: int) -> LeaveRequest:
        employee = LeaveService.get_employee_for_user(db, user)
        leave_req = db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
        
        if not leave_req:
            raise HTTPException(status_code=404, detail="Leave request not found.")

        if leave_req.employee_id != employee.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot cancel another employee's leave request."
            )

        if leave_req.status != LeaveStatusEnum.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only pending leave requests can be cancelled."
            )

        leave_req.status = LeaveStatusEnum.CANCELLED

        audit = AuditLog(
            user_id=user.id,
            action="CANCEL_LEAVE_REQUEST",
            entity="LeaveRequest",
            entity_id=leave_req.id,
            metadata_details=f"Employee {employee.employee_code} cancelled leave request #{leave_req.id}"
        )
        db.add(audit)
        db.commit()
        db.refresh(leave_req)
        return leave_req

    @staticmethod
    def approve_leave_request(db: Session, admin_user: User, request_id: int, comment: Optional[str] = None) -> LeaveRequest:
        leave_req = db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
        if not leave_req:
            raise HTTPException(status_code=404, detail="Leave request not found.")

        if leave_req.status != LeaveStatusEnum.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only pending leave requests can be approved."
            )

        leave_req.status = LeaveStatusEnum.APPROVED
        leave_req.approver_id = admin_user.id
        if comment:
            leave_req.comment = comment

        audit = AuditLog(
            user_id=admin_user.id,
            action="APPROVE_LEAVE_REQUEST",
            entity="LeaveRequest",
            entity_id=leave_req.id,
            metadata_details=f"Admin approved leave request #{leave_req.id}"
        )
        db.add(audit)
        db.commit()
        db.refresh(leave_req)
        return leave_req

    @staticmethod
    def refuse_leave_request(db: Session, admin_user: User, request_id: int, refusal_reason: str) -> LeaveRequest:
        leave_req = db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
        if not leave_req:
            raise HTTPException(status_code=404, detail="Leave request not found.")

        if leave_req.status != LeaveStatusEnum.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only pending leave requests can be refused."
            )

        if not refusal_reason or not refusal_reason.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refusal reason is required."
            )

        leave_req.status = LeaveStatusEnum.REFUSED
        leave_req.approver_id = admin_user.id
        leave_req.comment = refusal_reason.strip()

        audit = AuditLog(
            user_id=admin_user.id,
            action="REFUSE_LEAVE_REQUEST",
            entity="LeaveRequest",
            entity_id=leave_req.id,
            metadata_details=f"Admin refused leave request #{leave_req.id}: {refusal_reason}"
        )
        db.add(audit)
        db.commit()
        db.refresh(leave_req)
        return leave_req

    @staticmethod
    def get_my_leave_balances(db: Session, user: User) -> List[Dict[str, Any]]:
        employee = LeaveService.get_employee_for_user(db, user)
        leave_types = LeaveService.get_leave_types(db, active_only=True)

        results = []
        for lt in leave_types:
            # Sum approved days for this employee & leave type
            approved_requests = db.query(LeaveRequest).filter(
                LeaveRequest.employee_id == employee.id,
                LeaveRequest.leave_type_id == lt.id,
                LeaveRequest.status == LeaveStatusEnum.APPROVED
            ).all()

            used_days = sum((req.end_date - req.start_date).days + 1 for req in approved_requests)
            remaining_days = max(0, lt.max_days - used_days)

            results.append({
                "leave_type_id": lt.id,
                "leave_type_name": lt.name,
                "paid": lt.paid,
                "max_days": lt.max_days,
                "used_days": used_days,
                "remaining_days": remaining_days
            })
        return results

    @staticmethod
    def get_my_leave_requests(
        db: Session,
        user: User,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[LeaveRequest], int]:
        employee = LeaveService.get_employee_for_user(db, user)
        q = db.query(LeaveRequest).filter(LeaveRequest.employee_id == employee.id).order_by(LeaveRequest.created_at.desc())
        total = q.count()
        items = q.offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_admin_leave_requests(
        db: Session,
        query_str: Optional[str] = None,
        employee_id: Optional[int] = None,
        department_id: Optional[int] = None,
        leave_type_id: Optional[int] = None,
        status_filter: Optional[LeaveStatusEnum] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[LeaveRequest], int]:
        q = db.query(LeaveRequest).join(Employee, LeaveRequest.employee_id == Employee.id).join(User, Employee.user_id == User.id, isouter=True).join(Department, Employee.department_id == Department.id, isouter=True).join(LeaveType, LeaveRequest.leave_type_id == LeaveType.id)

        if employee_id:
            q = q.filter(LeaveRequest.employee_id == employee_id)
        if department_id:
            q = q.filter(Employee.department_id == department_id)
        if leave_type_id:
            q = q.filter(LeaveRequest.leave_type_id == leave_type_id)
        if status_filter:
            q = q.filter(LeaveRequest.status == status_filter)
        if start_date:
            q = q.filter(LeaveRequest.start_date >= start_date)
        if end_date:
            q = q.filter(LeaveRequest.end_date <= end_date)

        if query_str:
            term = f"%{query_str}%"
            q = q.filter(
                or_(
                    Employee.first_name.ilike(term),
                    Employee.last_name.ilike(term),
                    Employee.employee_code.ilike(term),
                    User.email.ilike(term),
                    Department.name.ilike(term),
                    LeaveType.name.ilike(term)
                )
            )

        q = q.order_by(LeaveRequest.created_at.desc(), LeaveRequest.id.desc())
        total = q.count()
        items = q.offset(skip).limit(limit).all()
        return items, total
