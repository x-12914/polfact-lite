from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.user import UserCreate, UserUpdate, UserListResponse
from app.schemas.response import ResponseModel
from app.services import user as user_service
from app.models.user import UserRole, UserStatus

router = APIRouter()

@router.get("/", response_model=ResponseModel[list[UserListResponse]])
def list_users(db: Session = Depends(deps.get_db), current_user: deps.User = Depends(deps.get_current_admin), skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), role: Optional[UserRole] = None, status: Optional[UserStatus] = None) -> Any:
    users, total = user_service.get_users(db, skip=skip, limit=limit, role=role, status=status)
    return ResponseModel(data=[UserListResponse.model_validate(u) for u in users], message=f"Retrieved {len(users)} users")

@router.post("/", response_model=ResponseModel[UserListResponse], status_code=status.HTTP_201_CREATED)
def create_user(*, db: Session = Depends(deps.get_db), current_user: deps.User = Depends(deps.get_current_admin), user_in: UserCreate) -> Any:
    if user_service.get_user_by_email(db, email=user_in.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")
    user = user_service.create_user(db, obj_in=user_in)
    return ResponseModel(data=UserListResponse.model_validate(user), message="User created")

@router.get("/journalists/", response_model=ResponseModel[list[UserListResponse]])
def list_journalists(db: Session = Depends(deps.get_db), current_user: deps.User = Depends(deps.get_current_admin), skip: int = 0, limit: int = 20) -> Any:
    users, total = user_service.get_users(db, skip=skip, limit=limit, role=UserRole.JOURNALIST)
    return ResponseModel(data=[UserListResponse.model_validate(u) for u in users])

@router.get("/{user_id}", response_model=ResponseModel[UserListResponse])
def get_user(user_id: int, db: Session = Depends(deps.get_db), current_user: deps.User = Depends(deps.get_current_admin)) -> Any:
    user = user_service.get_user(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return ResponseModel(data=UserListResponse.model_validate(user))

@router.patch("/{user_id}", response_model=ResponseModel[UserListResponse])
def update_user(user_id: int, *, db: Session = Depends(deps.get_db), current_user: deps.User = Depends(deps.get_current_admin), user_in: UserUpdate) -> Any:
    user = user_service.get_user(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user = user_service.update_user(db, db_obj=user, obj_in=user_in)
    return ResponseModel(data=UserListResponse.model_validate(user), message="User updated")

@router.delete("/{user_id}", response_model=ResponseModel[dict])
def delete_user(user_id: int, db: Session = Depends(deps.get_db), current_user: deps.User = Depends(deps.get_current_admin)) -> Any:
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own account")
    success = user_service.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return ResponseModel(data={"success": True}, message="User deleted")

@router.post("/{user_id}/suspend", response_model=ResponseModel[UserListResponse])
def suspend_user(user_id: int, db: Session = Depends(deps.get_db), current_user: deps.User = Depends(deps.get_current_admin)) -> Any:
    user = user_service.suspend_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return ResponseModel(data=UserListResponse.model_validate(user), message="User suspended")

@router.post("/{user_id}/activate", response_model=ResponseModel[UserListResponse])
def activate_user(user_id: int, db: Session = Depends(deps.get_db), current_user: deps.User = Depends(deps.get_current_admin)) -> Any:
    user = user_service.activate_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return ResponseModel(data=UserListResponse.model_validate(user), message="User activated")
