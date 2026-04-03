from typing import Optional, List
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserCreate, UserUpdate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user(db: Session, id: int) -> Optional[User]:
    return db.query(User).filter(User.id == id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100, role: Optional[UserRole] = None, status: Optional[UserStatus] = None):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.status == status)
    total = query.count()
    users = query.offset(skip).limit(limit).all()
    return users, total

def create_user(db: Session, *, obj_in: UserCreate) -> User:
    db_obj = User(
        email=obj_in.email,
        name=obj_in.name,
        password_hash=pwd_context.hash(obj_in.password),
        role=obj_in.role,
        status=UserStatus.ACTIVE,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_user(db: Session, *, db_obj: User, obj_in: UserUpdate) -> User:
    if obj_in.email is not None: db_obj.email = obj_in.email
    if obj_in.password is not None: db_obj.password_hash = pwd_context.hash(obj_in.password)
    if obj_in.role is not None: db_obj.role = obj_in.role
    if obj_in.name is not None: db_obj.name = obj_in.name
    if obj_in.status is not None: db_obj.status = obj_in.status
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_user(db: Session, user_id: int) -> bool:
    user = get_user(db, user_id)
    if user:
        db.delete(user)
        db.commit()
        return True
    return False

def suspend_user(db: Session, user_id: int) -> Optional[User]:
    user = get_user(db, user_id)
    if user:
        user.status = UserStatus.SUSPENDED
        db.commit()
        db.refresh(user)
    return user

def activate_user(db: Session, user_id: int) -> Optional[User]:
    user = get_user(db, user_id)
    if user:
        user.status = UserStatus.ACTIVE
        db.commit()
        db.refresh(user)
    return user
