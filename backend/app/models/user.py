from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class User(Base):
    """
    사용자(플레이어) 모델
    공대장과 공대원 모두 이 모델을 사용
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # FF14 캐릭터 정보
    character_name = Column(String(100), nullable=False)
    server = Column(String(50), nullable=False)
    job = Column(String(50))  # 직업 (전사, 백마도사 등)
    
    # 권한
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)  # 시스템 관리자
    
    # 타임스탬프
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # 관계
    owned_raid_groups = relationship("RaidGroup", back_populates="leader", foreign_keys="RaidGroup.leader_id")
    raid_memberships = relationship("RaidMember", back_populates="user")
    equipment_sets = relationship("EquipmentSet", back_populates="user")
    distribution_histories = relationship("DistributionHistory", back_populates="user")
    resource_requirements = relationship("ResourceRequirement", back_populates="user")
    created_schedules = relationship("RaidSchedule", back_populates="created_by")
    raid_attendances = relationship("RaidAttendance", back_populates="user")