from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from enum import Enum

class DistributionMethod(str, Enum):
    """아이템 분배 방식"""
    PRIORITY = "priority"
    FIRST_COME = "first_come"

# Raid 스키마
class RaidBase(BaseModel):
    """레이드 기본 스키마"""
    name: str = Field(..., min_length=1, max_length=100)
    tier: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    total_floors: int = Field(default=4, ge=1, le=12)
    min_item_level: Optional[int] = Field(None, ge=1, le=999)

class RaidCreate(RaidBase):
    """레이드 생성 스키마"""
    pass

class RaidUpdate(BaseModel):
    """레이드 수정 스키마"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    tier: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    total_floors: Optional[int] = Field(None, ge=1, le=12)
    min_item_level: Optional[int] = Field(None, ge=1, le=999)
    is_active: Optional[bool] = None

class Raid(RaidBase):
    """레이드 응답 스키마"""
    id: int
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# RaidGroup 스키마
class RaidGroupBase(BaseModel):
    """공대 기본 스키마"""
    name: str = Field(..., min_length=1, max_length=100)
    raid_id: int
    distribution_method: DistributionMethod = DistributionMethod.PRIORITY
    target_item_level: Optional[int] = Field(None, ge=1, le=999)
    description: Optional[str] = None

class RaidGroupCreate(RaidGroupBase):
    """공대 생성 스키마"""
    pass

class RaidGroupUpdate(BaseModel):
    """공대 수정 스키마"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    distribution_method: Optional[DistributionMethod] = None
    target_item_level: Optional[int] = Field(None, ge=1, le=999)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    is_recruiting: Optional[bool] = None

class RaidGroup(RaidGroupBase):
    """공대 응답 스키마"""
    id: int
    leader_id: int
    is_active: bool
    is_recruiting: bool
    created_at: datetime
    updated_at: datetime
    
    # 관계 데이터
    raid: Optional[Raid] = None
    leader: Optional["User"] = None
    member_count: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)

# RaidMember 스키마
class RaidMemberBase(BaseModel):
    """공대원 기본 스키마"""
    role: Optional[str] = Field(None, max_length=50) # 탱커, 힐러, 딜러
    job: Optional[str] = Field(None, max_length=50) # 구체적인 직업

class RaidMemberCreate(RaidMemberBase):
    """공대원 추가 스키마"""
    user_id: int

class RaidMemberUpdate(BaseModel):
    """공대원 수정 스키마"""
    role: Optional[str] = Field(None, max_length=50)
    job: Optional[str] = Field(None, max_length=50)
    can_manage_schedule: Optional[bool] = None
    can_manage_distribution: Optional[bool] = None

class RaidMember(RaidMemberBase):
    """공대원 응답 스키마"""
    id: int
    raid_group_id: int
    user_id: int
    can_manage_schedule: bool
    can_manage_distribution: bool
    joined_at: datetime
    
    # 관계 데이터
    user: Optional["User"] = None
    
    model_config = ConfigDict(from_attributes=True)

# Forward reference 해결
from app.schemas.user import User
RaidGroup.model_rebuild()
RaidMember.model_rebuild()