from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, date, time
from typing import Optional, List, Dict
from enum import Enum

class AttendanceStatus(str, Enum):
    """참석 상태"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    DECLINED = "declined"
    TENTATIVE = "tentative"

# RaidSchedule 스키마
class RaidScheduleBase(BaseModel):
    """레이드 일정 기본 스키마"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    scheduled_date: date
    start_time: time
    end_time: Optional[time] = None
    target_floors: Optional[str] = Field(None, max_length=50)
    minimum_members: int = Field(default=8, ge=1, le=8)
    notes: Optional[str] = None

class RaidScheduleCreate(RaidScheduleBase):
    """레이드 일정 생성 스키마"""
    pass

class RaidScheduleUpdate(BaseModel):
    """레이드 일정 수정 스키마"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    scheduled_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    target_floors: Optional[str] = Field(None, max_length=50)
    minimum_members: Optional[int] = Field(None, ge=1, le=8)
    notes: Optional[str] = None
    is_confirmed: Optional[bool] = None
    is_completed: Optional[bool] = None
    is_cancelled: Optional[bool] = None
    completion_notes: Optional[str] = None

class RaidSchedule(RaidScheduleBase):
    """레이드 일정 응답 스키마"""
    id: int
    raid_group_id: int
    created_by_id: int
    is_confirmed: bool
    is_completed: bool
    is_cancelled: bool
    completion_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    
    # 관계 데이터
    created_by: Optional["User"] = None
    attendances: Optional[List["RaidAttendance"]] = []
    confirmed_count: Optional[int] = 0
    declined_count: Optional[int] = 0
    
    model_config = ConfigDict(from_attributes=True)

# RaidAttendance 스키마
class RaidAttendanceBase(BaseModel):
    """레이드 참석 기본 스키마"""
    status: AttendanceStatus = AttendanceStatus.PENDING
    reason: Optional[str] = None

class RaidAttendanceCreate(RaidAttendanceBase):
    """레이드 참석 생성 스키마"""
    user_id: int

class RaidAttendanceUpdate(BaseModel):
    """레이드 참석 수정 스키마"""
    status: Optional[AttendanceStatus] = None
    reason: Optional[str] = None
    actually_attened: Optional[bool] = None

class RaidAttendance(RaidAttendanceBase):
    """레이드 참석 응답 스키마"""
    id: int
    schedule_id: int
    user_id: int
    responded_at: Optional[datetime] = None
    actually_attended: Optional[bool] = None
    created_at: datetime
    updated_at: datetime
    
    # 관계 데이터
    user: Optional["User"] = None
    
    model_config = ConfigDict(from_attributes=True)

# 일정 대시보드용 스키마
class ScheduleDashboard(BaseModel):
    """일정 대시보드 스키마"""
    upcoming_schedules: List[RaidSchedule] = []
    past_schedules: List[RaidSchedule] = []
    my_attendance_status: Dict[int, AttendanceStatus] = {} # schedule_id: status

# Forward reference 해결
from app.schemas.user import User
RaidSchedule.model_rebuild()
RaidAttendance.model_rebuild()