from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.database import Base


class ItemType(enum.Enum):
    """분배 아이템 타입"""
    EQUIPMENT_COFFER = "equipment_coffer"  # 장비 궤짝
    WEAPON_COFFER = "weapon_coffer"  # 무기 궤짝
    UPGRADE_ITEM = "upgrade_item"  # 보강 재료
    TOME_MATERIAL = "tome_material"  # 석판 교환 재료
    TOKEN = "token"  # 낱장/토큰
    WEAPON_TOKEN = "weapon_token"  # 무기 석판
    MOUNT = "mount"  # 탈것
    OTHER = "other"  # 기타 (악보, 꼬마친구 등)


class ItemDistribution(Base):
    """
    아이템 분배 규칙 및 우선순위
    각 공대의 아이템별 분배 순서를 관리
    """
    __tablename__ = "item_distributions"

    id = Column(Integer, primary_key=True, index=True)
    
    # 외래키
    raid_group_id = Column(Integer, ForeignKey("raid_groups.id"), nullable=False)
    
    # 아이템 정보
    item_name = Column(String(200), nullable=False)  # 아이템 이름
    item_type = Column(Enum(ItemType), nullable=False)
    floor_number = Column(Integer, nullable=False)  # 드랍 층 (1-4층)
    
    # 분배 정보
    priority_order = Column(JSON)  # 우선순위 순서 (user_id 리스트)
    completed_users = Column(JSON, default=[])  # 이미 획득한 유저 리스트
    
    # 추가 정보
    notes = Column(Text)  # 분배 관련 메모
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # 관계
    raid_group = relationship("RaidGroup", back_populates="item_distributions")
    histories = relationship("DistributionHistory", back_populates="distribution_rule")


class DistributionHistory(Base):
    """
    아이템 분배 이력
    실제로 누가 언제 어떤 아이템을 획득했는지 기록
    """
    __tablename__ = "distribution_histories"

    id = Column(Integer, primary_key=True, index=True)
    
    # 외래키
    raid_group_id = Column(Integer, ForeignKey("raid_groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    distribution_id = Column(Integer, ForeignKey("item_distributions.id"), nullable=True)
    
    # 아이템 정보
    item_name = Column(String(200), nullable=False)
    item_type = Column(Enum(ItemType), nullable=False)
    floor_number = Column(Integer)
    
    # 분배 정보
    week_number = Column(Integer, nullable=False)  # 몇 주차
    distributed_at = Column(DateTime, default=datetime.now(timezone.utc))  # 분배 일시
    
    # 추가 정보
    notes = Column(Text)
    
    # 관계
    raid_group = relationship("RaidGroup", back_populates="distribution_histories")
    user = relationship("User", back_populates="distribution_histories")
    distribution_rule = relationship("ItemDistribution", back_populates="histories")


class ResourceRequirement(Base):
    """
    재화 요구량 계산을 위한 테이블
    각 플레이어가 최종 BIS까지 필요한 재화량을 저장
    """
    __tablename__ = "resource_requirements"

    id = Column(Integer, primary_key=True, index=True)
    
    # 외래키
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    raid_group_id = Column(Integer, ForeignKey("raid_groups.id"), nullable=False)
    
    # 필요 재화 (JSON 형태로 저장)
    # 예: {"경화약": 4, "강화섬유": 8, "귀걸이_낱장": 3, "무기_낱장": 8, "석판": 1650}
    required_resources = Column(JSON, default={})
    obtained_resources = Column(JSON, default={})  # 이미 획득한 재화
    remaining_resources = Column(JSON, default={})  # 남은 필요 재화
    
    # 달성률
    completion_percentage = Column(Integer, default=0)  # 0-100%
    
    last_calculated_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    # 관계
    user = relationship("User", back_populates="resource_requirements")
    raid_group = relationship("RaidGroup", back_populates="resource_requirements")