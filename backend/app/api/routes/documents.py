import os
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User, RoleEnum
from app.models.document import Document
from app.services.document_service import DocumentService, UPLOAD_DIR

router = APIRouter()

def format_document_response(doc: Document) -> dict:
    return {
        "id": doc.id,
        "employee_id": doc.employee_id,
        "employee_name": f"{doc.employee.first_name} {doc.employee.last_name}" if doc.employee else None,
        "employee_code": doc.employee.employee_code if doc.employee else None,
        "name": doc.name,
        "type": doc.type,
        "file_reference": doc.file_reference,
        "file_size": doc.file_size,
        "uploaded_by": doc.uploaded_by,
        "uploader_email": doc.uploader.email if doc.uploader else None,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at
    }

@router.get("/me", response_model=dict)
def get_my_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    items, total = DocumentService.get_my_documents(db, user=current_user, skip=skip, limit=limit)
    return {
        "success": True,
        "data": [format_document_response(doc) for doc in items],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("", response_model=dict)
def list_documents_admin(
    q: Optional[str] = Query(None, description="Search name, type, employee code"),
    employee_id: Optional[int] = Query(None),
    doc_type: Optional[str] = Query(None, alias="type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.require_admin)
) -> Any:
    items, total = DocumentService.get_admin_documents(
        db,
        query_str=q,
        employee_id=employee_id,
        doc_type=doc_type,
        skip=skip,
        limit=limit
    )
    return {
        "success": True,
        "data": [format_document_response(doc) for doc in items],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.post("/upload", response_model=dict)
def upload_document(
    employee_id: int = Form(...),
    name: str = Form(...),
    doc_type: str = Form("General", alias="type"),
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    doc = DocumentService.upload_document(
        db,
        uploader=current_user,
        target_employee_id=employee_id,
        file=file,
        name=name,
        doc_type=doc_type
    )
    return {
        "success": True,
        "message": "Document uploaded successfully.",
        "data": format_document_response(doc)
    }

@router.get("/{document_id}/file")
def download_document_file(
    document_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Authorization Check
    if current_user.role == RoleEnum.EMPLOYEE:
        if doc.employee.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this document."
            )

    filename = os.path.basename(doc.file_reference)
    file_path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Physical document file missing.")

    return FileResponse(file_path, filename=doc.name)

@router.delete("/{document_id}", response_model=dict)
def delete_document(
    document_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    DocumentService.delete_document(db, current_user, document_id)
    return {
        "success": True,
        "message": "Document deleted successfully."
    }
