from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.schemas.token import Token, UserLogin
from app.schemas.response import ResponseModel
from app.services import user as user_service
from app.models.user import UserStatus

router = APIRouter()

@router.post("/login/access-token", response_model=ResponseModel[Token])
def login_access_token(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    user = user_service.get_user_by_email(db, email=form_data.username)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect email or password")
    if not user_service.pwd_context.verify(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect email or password")
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User account is inactive or suspended")
    user_data = UserLogin.model_validate(user)
    token_data = {
        "access_token": security.create_access_token(user.id),
        "token_type": "bearer",
        "user": user_data.model_dump()
    }
    return ResponseModel(data=Token(**token_data), message="Login successful")
