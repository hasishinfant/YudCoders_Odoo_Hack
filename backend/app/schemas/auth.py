from pydantic import BaseModel, EmailStr
from app.schemas.core import UserResponse

class LoginRequest(BaseModel):
    identifier: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    must_change_password: bool
    user: UserResponse

class AuthResponse(BaseModel):
    success: bool = True
    message: str = "Success"
    data: Token

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_new_password: str
