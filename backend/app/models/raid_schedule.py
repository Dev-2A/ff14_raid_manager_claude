from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Date, Time, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.database import Base

class RecurrenceType(enum.Enum):
    """반복 유형"""
    NONE = "none"  # 반복 없음
    DAILY = "daily"  # 매일
    WEEKLY = "weekly"  # 매주
    BIWEEKLY = "biweekly"  # 격주
    MONTHLY = "monthly"  # 매월


class RaidSchedule(Base):
    """
    레이드 일정 관리
    공대의 레이드 일정을 관리
    """
    __tablename__ = "raid_schedules"

    id = Column(Integer, primary_key=True, index=True)
    
    # 외래키
    raid_group_id = Column(Integer, ForeignKey("raid_groups.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 일정 정보
    title = Column(String(200), nullable=False)
    description = Column(Text)
    
    # 날짜와 시간
    scheduled_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time)
    
    # 반복 설정 (새로 추가)
    recurrence_type = Column(SQLEnum(RecurrenceType), default=RecurrenceType.NONE)
    recurrence_end_date = Column(Date)  # 반복 종료일
    recurrence_count = Column(Integer)  # 반복 횟수 (end_date 대신 사용 가능)
    recurrence_days = Column(String(20))  # 요일 선택 (weekly인 경우, "1,3,5" = 월,수,금)
    parent_schedule_id = Column(Integer, ForeignKey("raid_schedules.id"))  # 원본 일정 ID
    
    # 레이드 정보
    target_floors = Column(String(50))
    
    # 상태
    is_confirmed = Column(Boolean, default=False)
    is_completed = Column(Boolean, default=False)
    is_cancelled = Column(Boolean, default=False)
    
    # 참석 관련
    minimum_members = Column(Integer, default=8)
    
    # 메모
    notes = Column(Text)
    completion_notes = Column(Text)
    
    # 타임스탬프
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    completed_at = Column(DateTime)
    cancelled_at = Column(DateTime)
    
    # 관계
    raid_group = relationship("RaidGroup", back_populates="schedules")
    created_by = relationship("User", back_populates="created_schedules")
    attendances = relationship("RaidAttendance", back_populates="schedule", cascade="all, delete-orphan")
    # 반복 일정 관계
    parent_schedule = relationship("RaidSchedule", remote_side=[id], backref="child_schedules")


class RaidAttendance(Base):
    """
    레이드 참석 관리
    각 일정에 대한 멤버들의 참석 여부를 관리
    """
    __tablename__ = "raid_attendances"

    id = Column(Integer, primary_key=True, index=True)
    
    # 외래키
    schedule_id = Column(Integer, ForeignKey("raid_schedules.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 참석 상태
    status = Column(String(20), default="pending")  # pending, confirmed, declined, tentative
    
    # 응답 정보
    responded_at = Column(DateTime)  # 응답 시간
    reason = Column(Text)  # 불참 사유 등
    
    # 실제 참석
    actually_attended = Column(Boolean)  # 실제 참석 여부
    
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # 관계
    schedule = relationship("RaidSchedule", back_populates="attendances")
    user = relationship("User", back_populates="raid_attendances")