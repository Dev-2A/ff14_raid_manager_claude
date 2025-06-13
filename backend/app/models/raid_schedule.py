from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Date, Time
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class RaidSchedule(Base):
    """
    레이드 일정 관리
    공대의 레이드 일정을 관리
    """
    __tablename__ = "raid_schedules"

    id = Column(Integer, primary_key=True, index=True)
    
    # 외래키
    raid_group_id = Column(Integer, ForeignKey("raid_groups.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # 일정 생성자
    
    # 일정 정보
    title = Column(String(200), nullable=False)  # 일정 제목
    description = Column(Text)  # 일정 설명
    
    # 날짜와 시간
    scheduled_date = Column(Date, nullable=False)  # 레이드 날짜
    start_time = Column(Time, nullable=False)  # 시작 시간
    end_time = Column(Time)  # 종료 시간 (선택)
    
    # 레이드 정보
    target_floors = Column(String(50))  # 목표 층 (예: "1-4층", "3-4층")
    
    # 상태
    is_confirmed = Column(Boolean, default=False)  # 확정 여부
    is_completed = Column(Boolean, default=False)  # 완료 여부
    is_cancelled = Column(Boolean, default=False)  # 취소 여부
    
    # 참석 관련
    minimum_members = Column(Integer, default=8)  # 최소 인원
    
    # 메모
    notes = Column(Text)  # 추가 메모
    completion_notes = Column(Text)  # 완료 후 메모 (드랍 아이템 등)
    
    # 타임스탬프
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    completed_at = Column(DateTime)  # 완료 시간
    cancelled_at = Column(DateTime)  # 취소 시간
    
    # 관계
    raid_group = relationship("RaidGroup", back_populates="schedules")
    created_by = relationship("User", back_populates="created_schedules")
    attendances = relationship("RaidAttendance", back_populates="schedule", cascade="all, delete-orphan")


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