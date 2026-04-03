from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.user import UserRole, UserStatus

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[dict] = None

class TokenPayload(BaseModel):
    sub: Optional[int] = None

class UserLogin(BaseModel):
    id: int
    email: str
    name: Optional[str]
    role: UserRole
    status: UserStatus

    model_config = ConfigDict(from_attributes=True)
