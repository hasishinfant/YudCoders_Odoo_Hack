import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, UploadFile, status

from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.document import Document
from app.models.audit_log import AuditLog
from app.repositories.core import employee_repo

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class DocumentService:
    @staticmethod
    def get_employee_for_user(db: Session, user: User) -> Employee:
        if not user.active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user account cannot perform document actions."
            )
        employee = employee_repo.get_by_user_id(db, user_id=user.id)
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No linked employee profile found for current user."
            )
        return employee

    @staticmethod
    def upload_document(
        db: Session,
        uploader: User,
        target_employee_id: int,
        file: UploadFile,
        name: str,
        doc_type: str
    ) -> Document:
        # Resolve target_employee_id to employee profile if uploader is EMPLOYEE
        if uploader.role == RoleEnum.EMPLOYEE:
            user_emp = DocumentService.get_employee_for_user(db, uploader)
            target_employee_id = user_emp.id
        
        emp = db.query(Employee).filter(Employee.id == target_employee_id).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Target employee not found.")

        file_bytes = file.file.read()
        file_size = len(file_bytes)
        file_ext = os.path.splitext(file.filename or "")[1]
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        save_path = os.path.join(UPLOAD_DIR, unique_filename)

        with open(save_path, "wb") as f:
            f.write(file_bytes)

        rel_reference = f"uploads/{unique_filename}"
        doc_name = name.strip() if name and name.strip() else (file.filename or "Document")

        document = Document(
            employee_id=target_employee_id,
            name=doc_name,
            type=doc_type or "General",
            file_reference=rel_reference,
            file_size=file_size,
            uploaded_by=uploader.id
        )
        db.add(document)
        db.flush()

        audit = AuditLog(
            user_id=uploader.id,
            action="UPLOAD_DOCUMENT",
            entity="Document",
            entity_id=document.id,
            metadata_details=f"Uploaded document '{document.name}' ({doc_type}) for employee {emp.employee_code}"
        )
        db.add(audit)
        db.commit()
        db.refresh(document)
        return document

    @staticmethod
    def get_my_documents(db: Session, user: User, skip: int = 0, limit: int = 20) -> Tuple[List[Document], int]:
        emp = DocumentService.get_employee_for_user(db, user)
        q = db.query(Document).filter(Document.employee_id == emp.id).order_by(Document.created_at.desc())
        total = q.count()
        items = q.offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_admin_documents(
        db: Session,
        query_str: Optional[str] = None,
        employee_id: Optional[int] = None,
        doc_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Document], int]:
        q = db.query(Document).join(Employee, Document.employee_id == Employee.id)

        if employee_id:
            q = q.filter(Document.employee_id == employee_id)
        if doc_type:
            q = q.filter(Document.type.ilike(f"%{doc_type}%"))
        if query_str:
            term = f"%{query_str}%"
            q = q.filter(
                or_(
                    Document.name.ilike(term),
                    Document.type.ilike(term),
                    Employee.first_name.ilike(term),
                    Employee.last_name.ilike(term),
                    Employee.employee_code.ilike(term)
                )
            )

        q = q.order_by(Document.created_at.desc())
        total = q.count()
        items = q.offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def delete_document(db: Session, current_user: User, doc_id: int) -> None:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")

        # RBAC Check: Employee can delete own, Admin can delete any
        if current_user.role == RoleEnum.EMPLOYEE:
            user_emp = DocumentService.get_employee_for_user(db, current_user)
            if doc.employee_id != user_emp.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to delete this document."
                )

        # Remove physical file if present
        filename = os.path.basename(doc.file_reference)
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass

        audit = AuditLog(
            user_id=current_user.id,
            action="DELETE_DOCUMENT",
            entity="Document",
            entity_id=doc.id,
            metadata_details=f"Deleted document '{doc.name}' #{doc.id}"
        )
        db.add(audit)
        db.delete(doc)
        db.commit()
