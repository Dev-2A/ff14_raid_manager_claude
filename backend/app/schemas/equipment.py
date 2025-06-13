from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from enum import Enum


class EquipmentSlot(str, Enum):
    """장비 부위"""
    WEAPON = "weapon"
    HEAD = "head"
    BODY = "body"
    HANDS = "hands"
    LEGS = "legs"
    FEET = "feet"
    EARRINGS = "earrings"
    NECKLACE = "necklace"
    BRACELET = "bracelet"
    RING = "ring"


class EquipmentType(str, Enum):
    """장비 타입"""
    RAID_HERO = "raid_hero"
    RAID_NORMAL = "raid_normal"
    TOME = "tome"
    TOME_AUGMENTED = "tome_augmented"
    CRAFTED = "crafted"
    OTHER = "other"


# Equipment 스키마
class EquipmentBase(BaseModel):
    """장비 기본 스키마"""
    name: str = Field(..., min_length=1, max_length=200)
    slot: EquipmentSlot
    equipment_type: EquipmentType
    item_level: int = Field(..., ge=1, le=999)
    job_category: Optional[str] = Field(None, max_length=100)
    raid_id: Optional[int] = None
    source: Optional[str] = Field(None, max_length=200)
    tome_cost: int = Field(default=0, ge=0)


class EquipmentCreate(EquipmentBase):
    """장비 생성 스키마"""
    pass


class EquipmentUpdate(BaseModel):
    """장비 수정 스키마"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    item_level: Optional[int] = Field(None, ge=1, le=999)
    job_category: Optional[str] = Field(None, max_length=100)
    source: Optional[str] = Field(None, max_length=200)
    tome_cost: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class Equipment(EquipmentBase):
    """장비 응답 스키마"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# EquipmentSet 스키마
class EquipmentSetBase(BaseModel):
    """장비 세트 기본 스키마"""
    name: str = Field(..., min_length=1, max_length=100)
    raid_group_id: int


class EquipmentSetCreate(EquipmentSetBase):
    """장비 세트 생성 스키마"""
    is_starting_set: bool = False
    is_bis_set: bool = False
    is_current_set: bool = False


class EquipmentSetUpdate(BaseModel):
    """장비 세트 수정 스키마"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_starting_set: Optional[bool] = None
    is_bis_set: Optional[bool] = None
    is_current_set: Optional[bool] = None


class EquipmentSet(EquipmentSetBase):
    """장비 세트 응답 스키마"""
    id: int
    user_id: int
    is_starting_set: bool
    is_bis_set: bool
    is_current_set: bool
    total_item_level: int
    created_at: datetime
    updated_at: datetime
    
    # 관계 데이터
    items: Optional[List["EquipmentSetItem"]] = []
    
    model_config = ConfigDict(from_attributes=True)


# EquipmentSetItem 스키마
class EquipmentSetItemBase(BaseModel):
    """장비 세트 아이템 기본 스키마"""
    equipment_id: int
    slot: EquipmentSlot


class EquipmentSetItemCreate(EquipmentSetItemBase):
    """장비 세트 아이템 추가 스키마"""
    pass


class EquipmentSetItemUpdate(BaseModel):
    """장비 세트 아이템 수정 스키마"""
    equipment_id: Optional[int] = None
    is_obtained: Optional[bool] = None


class EquipmentSetItem(EquipmentSetItemBase):
    """장비 세트 아이템 응답 스키마"""
    id: int
    equipment_set_id: int
    is_obtained: bool
    obtained_at: Optional[datetime] = None
    created_at: datetime
    
    # 관계 데이터
    equipment: Optional[Equipment] = None
    
    model_config = ConfigDict(from_attributes=True)


# Forward reference 해결
EquipmentSet.model_rebuild()