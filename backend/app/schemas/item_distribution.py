from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

# User 타입을 직접 import
from app.schemas.user import User as UserSchema


class ItemType(str, Enum):
    """분배 아이템 타입"""
    EQUIPMENT_COFFER = "equipment_coffer"
    WEAPON_COFFER = "weapon_coffer"
    UPGRADE_ITEM = "upgrade_item"
    TOME_MATERIAL = "tome_material"
    TOKEN = "token"
    WEAPON_TOKEN = "weapon_token"
    MOUNT = "mount"
    OTHER = "other"


# ItemDistribution 스키마
class ItemDistributionBase(BaseModel):
    """아이템 분배 기본 스키마"""
    item_name: str = Field(..., min_length=1, max_length=200)
    item_type: ItemType
    floor_number: int = Field(..., ge=1, le=4)
    notes: Optional[str] = None


class ItemDistributionCreate(ItemDistributionBase):
    """아이템 분배 생성 스키마"""
    priority_order: List[int] = []  # user_id 리스트


class ItemDistributionUpdate(BaseModel):
    """아이템 분배 수정 스키마"""
    item_name: Optional[str] = Field(None, min_length=1, max_length=200)
    priority_order: Optional[List[int]] = None
    completed_users: Optional[List[int]] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class ItemDistribution(ItemDistributionBase):
    """아이템 분배 응답 스키마"""
    id: int
    raid_group_id: int
    priority_order: List[int]
    completed_users: List[int]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# DistributionHistory 스키마
class DistributionHistoryBase(BaseModel):
    """분배 이력 기본 스키마"""
    item_name: str = Field(..., min_length=1, max_length=200)
    item_type: ItemType
    floor_number: Optional[int] = Field(None, ge=1, le=4)
    week_number: int = Field(..., ge=1)
    notes: Optional[str] = None


class DistributionHistoryCreate(DistributionHistoryBase):
    """분배 이력 생성 스키마"""
    user_id: int
    distribution_id: Optional[int] = None


class DistributionHistory(DistributionHistoryBase):
    """분배 이력 응답 스키마"""
    id: int
    raid_group_id: int
    user_id: int
    distribution_id: Optional[int] = None
    distributed_at: datetime
    
    # 관계 데이터
    user: Optional["User"] = None
    
    model_config = ConfigDict(from_attributes=True)


# ResourceRequirement 스키마
class ResourceRequirementBase(BaseModel):
    """재화 요구량 기본 스키마"""
    required_resources: Dict[str, int] = Field(default_factory=dict)
    obtained_resources: Dict[str, int] = Field(default_factory=dict)
    remaining_resources: Dict[str, int] = Field(default_factory=dict)


class ResourceRequirementUpdate(BaseModel):
    """재화 요구량 수정 스키마"""
    obtained_resources: Optional[Dict[str, int]] = None


class ResourceRequirement(ResourceRequirementBase):
    """재화 요구량 응답 스키마"""
    id: int
    user_id: int
    raid_group_id: int
    completion_percentage: int
    last_calculated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# 재화 계산 결과 스키마
class ResourceCalculationResult(BaseModel):
    """재화 계산 결과 스키마"""
    user_id: int
    raid_group_id: int
    required_resources: Dict[str, int]
    
    # 상세 내역
    equipment_changes: List[Dict[str, Any]] = []  # 장비 변경 내역
    upgrade_materials_needed: Dict[str, int] = {}  # 필요한 보강 재료
    tome_cost_total: int = 0  # 총 석판 비용
    
    # 우선순위 정보 (우선순위 분배 방식인 경우)
    priority_rankings: Optional[Dict[str, int]] = None  # 각 아이템별 우선순위


# Forward reference 해결
from app.schemas.user import User
DistributionHistory.model_rebuild()