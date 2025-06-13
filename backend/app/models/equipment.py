from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.database import Base


class EquipmentSlot(enum.Enum):
    """장비 부위"""
    WEAPON = "weapon"  # 무기
    HEAD = "head"  # 머리
    BODY = "body"  # 상의
    HANDS = "hands"  # 장갑
    LEGS = "legs"  # 하의
    FEET = "feet"  # 신발
    EARRINGS = "earrings"  # 귀걸이
    NECKLACE = "necklace"  # 목걸이
    BRACELET = "bracelet"  # 팔찌
    RING = "ring"  # 반지


class EquipmentType(enum.Enum):
    """장비 타입"""
    RAID_HERO = "raid_hero"  # 영웅 레이드
    RAID_NORMAL = "raid_normal"  # 일반 레이드
    TOME = "tome"  # 석판
    TOME_AUGMENTED = "tome_augmented"  # 보강된 석판
    CRAFTED = "crafted"  # 제작
    OTHER = "other"  # 기타


class Equipment(Base):
    """
    장비 아이템 정의
    게임 내 모든 장비 아이템을 정의
    """
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    
    # 장비 정보
    slot = Column(Enum(EquipmentSlot), nullable=False)
    equipment_type = Column(Enum(EquipmentType), nullable=False)
    item_level = Column(Integer, nullable=False)
    
    # 추가 정보
    job_category = Column(String(100))  # 착용 가능 직업군 (예: 탱커, 힐러, 캐스터 등)
    raid_id = Column(Integer, ForeignKey("raids.id"), nullable=True)  # 관련 레이드 (레이드 장비인 경우)
    
    # 획득 정보
    source = Column(String(200))  # 획득처 설명
    tome_cost = Column(Integer, default=0)  # 석판 비용 (석판 장비인 경우)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # 관계
    raid = relationship("Raid", backref="equipment")
    equipment_set_items = relationship("EquipmentSetItem", back_populates="equipment")


class EquipmentSet(Base):
    """
    장비 세트
    플레이어의 출발 세트, 최종 BIS 세트 등을 관리
    """
    __tablename__ = "equipment_sets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # 세트 이름 (예: "출발 세트", "최종 BIS")
    
    # 외래키
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    raid_group_id = Column(Integer, ForeignKey("raid_groups.id"), nullable=False)
    
    # 세트 타입
    is_starting_set = Column(Boolean, default=False)  # 출발 세트인지
    is_bis_set = Column(Boolean, default=False)  # 최종 BIS 세트인지
    is_current_set = Column(Boolean, default=False)  # 현재 착용 중인 세트인지
    
    # 통계
    total_item_level = Column(Integer, default=0)  # 평균 아이템 레벨
    
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # 관계
    user = relationship("User", back_populates="equipment_sets")
    raid_group = relationship("RaidGroup", back_populates="equipment_sets")
    items = relationship("EquipmentSetItem", back_populates="equipment_set", cascade="all, delete-orphan")


class EquipmentSetItem(Base):
    """
    장비 세트 아이템
    장비 세트에 포함된 개별 아이템
    """
    __tablename__ = "equipment_set_items"

    id = Column(Integer, primary_key=True, index=True)
    
    # 외래키
    equipment_set_id = Column(Integer, ForeignKey("equipment_sets.id"), nullable=False)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    
    # 슬롯 정보 (중복 저장이지만 빠른 조회를 위해)
    slot = Column(Enum(EquipmentSlot), nullable=False)
    
    # 추가 정보
    is_obtained = Column(Boolean, default=False)  # 획득 여부 (현재 세트에서만 사용)
    obtained_at = Column(DateTime, nullable=True)  # 획득 일시
    
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    # 관계
    equipment_set = relationship("EquipmentSet", back_populates="items")
    equipment = relationship("Equipment", back_populates="equipment_set_items")