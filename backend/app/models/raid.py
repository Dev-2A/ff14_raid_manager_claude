from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.database import Base


class DistributionMethod(enum.Enum):
    """아이템 분배 방식"""
    PRIORITY = "priority"  # 우선순위 분배
    FIRST_COME = "first_come"  # 먹고 빠지기


class Raid(Base):
    """
    레이드 정의 모델
    (예: 영웅 레이드 - 아르카디아 토벌전)
    """
    __tablename__ = "raids"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # 레이드 이름
    tier = Column(String(50), nullable=False)  # 레이드 단계 (예: 7.0 영웅)
    description = Column(Text)
    
    # 레이드 정보
    total_floors = Column(Integer, default=4)  # 총 층수
    min_item_level = Column(Integer)  # 최소 아이템 레벨
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    # 관계
    raid_groups = relationship("RaidGroup", back_populates="raid")


class RaidGroup(Base):
    """
    레이드 공대(파티) 모델
    8인 고정 파티를 관리
    """
    __tablename__ = "raid_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # 공대 이름
    
    # 외래키
    raid_id = Column(Integer, ForeignKey("raids.id"), nullable=False)
    leader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 설정
    distribution_method = Column(Enum(DistributionMethod), default=DistributionMethod.PRIORITY)
    target_item_level = Column(Integer)  # 목표 아이템 레벨
    description = Column(Text)
    
    # 상태
    is_active = Column(Boolean, default=True)
    is_recruiting = Column(Boolean, default=False)  # 모집 중 여부
    
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # 관계
    raid = relationship("Raid", back_populates="raid_groups")
    leader = relationship("User", back_populates="owned_raid_groups", foreign_keys=[leader_id])
    members = relationship("RaidMember", back_populates="raid_group", cascade="all, delete-orphan")
    schedules = relationship("RaidSchedule", back_populates="raid_group", cascade="all, delete-orphan")
    item_distributions = relationship("ItemDistribution", back_populates="raid_group", cascade="all, delete-orphan")
    equipment_sets = relationship("EquipmentSet", back_populates="raid_group")
    distribution_histories = relationship("DistributionHistory", back_populates="raid_group")
    resource_requirements = relationship("ResourceRequirement", back_populates="raid_group")


class RaidMember(Base):
    """
    공대원 모델
    공대와 사용자 간의 다대다 관계를 나타냄
    """
    __tablename__ = "raid_members"

    id = Column(Integer, primary_key=True, index=True)
    
    # 외래키
    raid_group_id = Column(Integer, ForeignKey("raid_groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 공대 내 역할
    role = Column(String(50))  # 탱커, 힐러, 딜러
    job = Column(String(50))  # 구체적인 직업 (전사, 백마도사 등)
    
    # 권한
    can_manage_schedule = Column(Boolean, default=False)  # 일정 관리 권한
    can_manage_distribution = Column(Boolean, default=False)  # 분배 관리 권한
    
    joined_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    # 관계
    raid_group = relationship("RaidGroup", back_populates="members")
    user = relationship("User", back_populates="raid_memberships")