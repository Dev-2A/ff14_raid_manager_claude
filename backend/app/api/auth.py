from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.config import settings
from app.core import deps, security
from app.schemas.user import User, UserCreate, UserUpdate, Token
from app.models.user import User as UserModel
from app.utils import user as user_utils

router = APIRouter()

# 비밀번호 변경 요청 스키마
class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@router.post("/register", response_model=User)
def register(
    user_in: UserCreate,
    db: Session = Depends(deps.get_db)
):
    """
    새 사용자 등록
    """
    # 사용자명 중복 체크
    user = user_utils.get_user_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # 이메일 중복 체크
    user = user_utils.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # 새 사용자 생성
    user = user_utils.create_user(db=db, user_create=user_in)
    return user

@router.post("/login", response_model=Token)
def login(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    사용자 로그인 (액세스 토큰 발급)
    """
    # 사용자 인증
    user = user_utils.authenticate_user(
        db,
        username=form_data.username,
        password=form_data.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 비활성 사용자 체크
    if not user_utils.is_active(user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # 액세스 토큰 생성
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.id,
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=User)
def read_users_me(
    current_user: UserModel = Depends(deps.get_current_active_user)
):
    """
    현재 로그인한 사용자 정보 조회
    """
    return current_user

@router.put("/me", response_model=User)
def update_profile(
    user_update: UserUpdate,
    current_user: UserModel = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    프로필 정보 수정
    """
    # 이메일 중복 체크 (자신의 이메일이 아닌 경우)
    if user_update.email and user_update.email != current_user.email:
        existing_user = user_utils.get_user_by_email(db, email=user_update.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # 사용자명 중복 체크 (자신의 사용자명이 아닌 경우)
    if user_update.username and user_update.username != current_user.username:
        existing_user = user_utils.get_user_by_username(db, username=user_update.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
    
    # 비밀번호 필드 제거 (비밀번호 변경은 별도 엔드포인트 사용)
    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data:
        del update_data["password"]
    
    # 프로필 업데이트
    updated_user = user_utils.update_user(
        db=db,
        user=current_user,
        user_update=UserUpdate(**update_data)
    )
    
    return updated_user

@router.post("/change-password")
def change_password(
    password_data: PasswordChange,
    current_user: UserModel = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    비밀번호 변경
    """
    # 현재 비밀번호 확인
    if not security.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    # 새 비밀번호 해시화 및 저장
    current_user.hashed_password = security.get_password_hash(password_data.new_password)
    db.add(current_user)
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.post("/refresh", response_model=Token)
def refresh_token(
    current_user: UserModel = Depends(deps.get_current_active_user)
):
    """
    토큰 갱신
    """
    # 새로운 액세스 토큰 생성
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=current_user.id,
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }