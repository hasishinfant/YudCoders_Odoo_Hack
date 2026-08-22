from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.schemas.auth import LoginRequest, AuthResponse, ChangePasswordRequest
from app.schemas.core import UserResponse
from app.models.user import User, RoleEnum
from app.repositories.core import user_repo

router = APIRouter()

@router.post("/login", response_model=AuthResponse)
def login(
    login_data: LoginRequest, db: Session = Depends(deps.get_db)
) -> Any:
    user = user_repo.get_by_identifier(db, identifier=login_data.identifier)
    if not user or not security.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/login ID or password",
        )
    if not user.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "access_token": token,
            "token_type": "bearer",
            "must_change_password": user.must_change_password,
            "user": user
        }
    }

@router.post("/change-password")
def change_password(
    password_data: ChangePasswordRequest, 
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    if password_data.new_password != password_data.confirm_new_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")
        
    if not security.verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect current password")
        
    if password_data.current_password == password_data.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password")
        
    # Security requirement checks (e.g. length)
    if len(password_data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
    current_user.password_hash = security.get_password_hash(password_data.new_password)
    current_user.must_change_password = False
    
    db.add(current_user)
    db.commit()
    
    return {"success": True, "message": "Password changed successfully"}

@router.get("/me")
def read_current_user(
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    return {
        "success": True,
        "data": UserResponse.model_validate(current_user)
    }
