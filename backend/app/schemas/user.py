from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime, timezone
from typing import Optional

class UserBase(BaseModel):
    """사용자 기본 스키마"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    character_name: str = Field(..., min_length=1, max_length=100)
    server: str = Field(..., min_length=1, max_length=50)
    job: Optional[str] = Field(None, max_length=50)

class UserCreate(UserBase):
    """사용자 생성 스키마"""
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    """사용자 수정 스키마"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    character_name: Optional[str] = Field(None, min_length=1, max_length=100)
    server: Optional[str] = Field(None, min_length=1, max_length=50)
    job: Optional[str] = Field(None, max_length=50)
    password: Optional[str] = Field(None, min_length=6)

class User(UserBase):
    """사용자 응답 스키마"""
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserInDB(User):
    """DB에 저장된 사용자 스키마 (비밀번호 포함)"""
    hashed_password: str

class UserLogin(BaseModel):
    """로그인 요청 스키마"""
    username: str
    password: str

class Token(BaseModel):
    """JWT 토큰 응답 스키마"""
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """토큰 데이터 스키마"""
    username: Optional[str] = None
    user_id: Optional[int] = None