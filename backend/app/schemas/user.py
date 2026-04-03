from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from app.models.user import UserRole, UserStatus

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: UserRole = UserRole.USER

class UserCreate(UserBase):
    password: str
    name: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    name: Optional[str] = None
    status: Optional[UserStatus] = None

class UserInDBBase(UserBase):
    id: int
    status: UserStatus
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class User(UserInDBBase):
    pass

class UserListResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    role: UserRole
    status: UserStatus
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
