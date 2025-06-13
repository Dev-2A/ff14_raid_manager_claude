from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.config import settings
from app.core import deps, security
from app.schemas.user import User, UserCreate, Token
from app.models.user import User as UserModel
from app.utils import user as user_utils

router = APIRouter()

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