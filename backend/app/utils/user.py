from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password

def get_user(db: Session, user_id: int) -> Optional[User]:
    """
    ID로 사용자 조회
    """
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """
    사용자명으로 사용자 조회
    """
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """
    이메일로 사용자 조회
    """
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user_create: UserCreate) -> User:
    """
    새 사용자 생성

    Args:
        db: 데이터베이스 세션
        user_create: 사용자 생성 스키마

    Returns:
        생성된 사용자 객체
    """
    # 비밀번호 해시화
    hashed_password = get_password_hash(user_create.password)
    
    # 사용자 객체 생성
    db_user = User(
        username=user_create.username,
        email=user_create.email,
        hashed_password=hashed_password,
        character_name=user_create.character_name,
        server=user_create.server,
        job=user_create.job
    )
    
    # 데이터베이스에 저장
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

def update_user(
    db: Session,
    user: User,
    user_update: UserUpdate
) -> User:
    """
    사용자 정보 수정

    Args:
        db: 데이터베이스 세션
        user: 수정할 사용자 객체
        user_update: 사용자 수정 스키마

    Returns:
        수정된 사용자 객체
    """
    # 수정할 필드만 업데이트
    update_data = user_update.model_dump(exclude_unset=True)
    
    # 비밀번호가 포함된 경우 해시화
    if "password" in update_data:
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        update_data["hashed_password"] = hashed_password
    
    # 업데이트 적용
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user

def authenticate_user(
    db: Session,
    username: str,
    password: str
) -> Optional[User]:
    """
    사용자 인증

    Args:
        db: 데이터베이스 세션
        username: 사용자명
        password: 비밀번호

    Returns:
        인증된 사용자 객체 (실패 시 None)
    """
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def is_active(user: User) -> bool:
    """
    사용자 활성 상태 확인
    """
    return user.is_active

def is_admin(user: User) -> bool:
    """
    관리자 권한 확인
    """
    return user.is_admin