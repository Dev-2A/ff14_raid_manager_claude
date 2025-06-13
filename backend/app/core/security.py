from datetime import datetime,timezone, timedelta
from typing import Optional, Union, Any
from jose import jwt
from passlib.context import CryptContext
from app.config import settings

# 비밀번호 암호화 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    JWT 액세스 토큰 생성

    Args:
        subject: 토큰에 포함될 주제 (일반적으로 user_id)
        expires_delta: 토큰 만료 시간

    Returns:
        JWT 토큰 문자열
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    비밀번호 검증

    Args:
        plain_password: 평문 비밀번호
        hashed_password: 해시된 비밀번호

    Returns:
        일치 여부
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    비밀번호 해시 생성

    Args:
        password: 평분 비밀번호

    Returns:
        해시된 비밀번호
    """
    return pwd_context.hash(password)