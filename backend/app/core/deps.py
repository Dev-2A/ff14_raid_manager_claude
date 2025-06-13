from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models.user import User
from app.models.raid import RaidMember, RaidGroup
from app.schemas.user import TokenData

# OAuth2 스키마 설정
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_db() -> Generator:
    """
    데이터베이스 세션 의존성
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    현재 로그인한 사용자 가져오기

    Args:
        db: 데이터베이스 세션
        token: JWT 토큰

    Returns:
        현재 사용자 객체
    
    Raises:
        HTTPException: 인증 실패 시
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 토큰 디코드
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: int = int(payload.get("sub"))
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except (JWTError, ValueError):
        raise credentials_exception
    
    # 사용자 조회
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    
    # 비활성 사용자 체크
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    현재 활성 사용자만 허용
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    관리자만 허용
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

def get_raid_group_member(
    raid_group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """
    특정 공대의 멤버만 허용

    Args:
        raid_group_id: 공대 ID
        current_user: 현재 사용자
        db: 데이터베이스 세션

    Returns:
        현재 사용자 (공대 멤버인 경우)
    
    Raises:
        HTTPException: 공대 멤버가 아닌 경우
    """
    member = db.query(RaidMember).filter(
        RaidMember.raid_group_id == raid_group_id,
        RaidMember.user_id == current_user.id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this raid group"
        )
    
    return current_user

def get_raid_group_leader(
    raid_group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """
    공대장만 허용

    Args:
        raid_group_id: 공대 ID
        current_user: 현재 사용자
        db: 데이터베이스 세션

    Returns:
        현재 사용자
    
    Raises:
        HTTPException: 공대장이 아닌 경우
    """
    raid_group = db.query(RaidGroup).filter(
        RaidGroup.id == raid_group_id,
        RaidGroup.leader_id == current_user.id
    ).first()
    
    if not raid_group:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not the leader of this raid group"
        )
    
    return current_user