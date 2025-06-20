from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_,func, Integer, cast
from datetime import datetime, date, timezone, timedelta

from app.core import deps
from app.models.user import User
from app.models.raid import RaidGroup, RaidMember
from app.models.raid_schedule import RaidSchedule, RaidAttendance
from app.schemas.raid_schedule import (
    RaidSchedule as RaidScheduleSchema,
    RaidScheduleCreate,
    RaidScheduleUpdate,
    RaidAttendance as RaidAttendanceSchema,
    RecurrenceType,
    RaidAttendanceCreate,
    RaidAttendanceUpdate,
    ScheduleDashboard,
    AttendanceStatus
)

router = APIRouter()

#SECTION - 레이드 일정 관리

@router.get("/groups/{group_id}/schedules", response_model=List[RaidScheduleSchema])
def get_raid_schedules(
    group_id: int,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    is_confirmed: Optional[bool] = None,
    is_completed: Optional[bool] = None,
    is_cancelled: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    레이드 일정 목록 조회
    """
    # 공대 멤버 확인
    current_user = deps.get_raid_group_member(group_id, current_user, db)
    
    query = db.query(RaidSchedule).filter(
        RaidSchedule.raid_group_id == group_id
    )
    
    # 날짜 필터
    if from_date:
        query = query.filter(RaidSchedule.scheduled_date >= from_date)
    if to_date:
        query = query.filter(RaidSchedule.scheduled_date <= to_date)
    
    # 상태 필터
    if is_confirmed is not None:
        query = query.filter(RaidSchedule.is_confirmed == is_confirmed)
    if is_completed is not None:
        query = query.filter(RaidSchedule.is_completed == is_completed)
    if is_cancelled is not None:
        query = query.filter(RaidSchedule.is_cancelled == is_cancelled)
    
    # 날짜 기준 정렬
    query = query.order_by(RaidSchedule.scheduled_date.asc(), RaidSchedule.start_time.asc())
    
    schedules = query.offset(skip).limit(limit).all()
    
    # 참석 인원 수 계산
    for schedule in schedules:
        schedule.confirmed_count = db.query(RaidAttendance).filter(
            and_(
                RaidAttendance.schedule_id == schedule.id,
                RaidAttendance.status == AttendanceStatus.CONFIRMED
            )
        ).count()
        
        schedule.declined_count = db.query(RaidAttendance).filter(
            and_(
                RaidAttendance.schedule_id == schedule.id,
                RaidAttendance.status == AttendanceStatus.DECLINED
            )
        ).count()
    
    return schedules

@router.get("/groups/{group_id}/schedules/{schedule_id}", response_model=RaidScheduleSchema)
def get_raid_schedule(
    group_id: int,
    schedule_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    특정 레이드 일정 조회
    """
    # 공대 멤버 확인
    current_user = deps.get_raid_group_member(group_id, current_user, db)
    
    schedule = db.query(RaidSchedule).filter(
        and_(
            RaidSchedule.id == schedule_id,
            RaidSchedule.raid_group_id == group_id
        )
    ).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    # 참석 인원 수 계산
    schedule.confirmed_count = db.query(RaidAttendance).filter(
        and_(
            RaidAttendance.schedule_id == schedule.id,
            RaidAttendance.status == AttendanceStatus.CONFIRMED
        )
    ).count()
    
    schedule.declined_count = db.query(RaidAttendance).filter(
        and_(
            RaidAttendance.schedule_id == schedule.id,
            RaidAttendance.status == AttendanceStatus.DECLINED
        )
    ).count()
    
    return schedule

@router.post("/groups/{group_id}/schedules", response_model=RaidScheduleSchema)
def create_raid_schedule(
    group_id: int,
    schedule_in: RaidScheduleCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    새 레이드 일정 생성 (공대장 또는 일정 권한자)
    반복 설정이 있으면 여러 일정을 생성합니다.
    """
    # 권한 확인 (기존 코드 유지)
    member = db.query(RaidMember).filter(
        and_(
            RaidMember.raid_group_id == group_id,
            RaidMember.user_id == current_user.id
        )
    ).first()
    
    if not member or not member.can_manage_schedule:
        # 공대장인지 확인
        group = db.query(RaidGroup).filter(
            and_(
                RaidGroup.id == group_id,
                RaidGroup.leader_id == current_user.id
            )
        ).first()
        
        if not group:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to manage schedules"
            )
    
    # 기본 일정 생성
    schedule = RaidSchedule(
        **schedule_in.model_dump(exclude={'recurrence_type', 'recurrence_end_date', 'recurrence_count', 'recurrence_days'}),
        raid_group_id=group_id,
        created_by_id=current_user.id,
        recurrence_type=schedule_in.recurrence_type,
        recurrence_end_date=schedule_in.recurrence_end_date,
        recurrence_count=schedule_in.recurrence_count,
        recurrence_days=schedule_in.recurrence_days
    )
    db.add(schedule)
    db.commit()
    
    # 모든 공대원의 참석 레코드 생성
    members = db.query(RaidMember).filter(
        RaidMember.raid_group_id == group_id
    ).all()
    
    for member in members:
        attendance = RaidAttendance(
            schedule_id=schedule.id,
            user_id=member.user_id,
            status=AttendanceStatus.PENDING
        )
        db.add(attendance)
    
    # 반복 일정 생성
    if schedule_in.recurrence_type != RecurrenceType.NONE:
        recurring_schedules = create_recurring_schedules(db, schedule, schedule_in)
        
        for recurring_schedule in recurring_schedules:
            db.add(recurring_schedule)
            db.flush()  # ID 생성을 위해
            
            # 각 반복 일정에 대한 참석 레코드 생성
            for member in members:
                attendance = RaidAttendance(
                    schedule_id=recurring_schedule.id,
                    user_id=member.user_id,
                    status=AttendanceStatus.PENDING
                )
                db.add(attendance)
    
    db.commit()
    db.refresh(schedule)
    
    schedule.confirmed_count = 0
    schedule.declined_count = 0
    schedule.is_recurring = schedule_in.recurrence_type != RecurrenceType.NONE
    
    return schedule

@router.put("/groups/{group_id}/schedules/{shcedule_id}", response_model=RaidScheduleSchema)
def update_raid_schedule(
    group_id: int,
    schedule_id: int,
    schedule_in: RaidScheduleUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    레이드 일정 수정
    """
    # 권한 확인 (위와 동일)
    member = db.query(RaidMember).filter(
        and_(
            RaidMember.raid_group_id == group_id,
            RaidMember.user_id == current_user.id
        )
    ).first()
    
    if not member or not member.can_manage_schedule:
        current_user = deps.get_raid_group_leader(group_id, current_user, db)
    
    # 일정 조회
    schedule = db.query(RaidSchedule).filter(
        and_(
            RaidSchedule.id == schedule_id,
            RaidSchedule.raid_group_id == group_id
        )
    ).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    update_data = schedule_in.model_dump(exclude_unset=True)
    
    # 완료 처리
    if "is_completed" in update_data and update_data["is_completed"] and not schedule.is_completed:
        schedule.completed_at = datetime.now(timezone.utc)
    
    # 취소 처리
    if "is_cancelled" in update_data and update_data["is_cancelled"] and not schedule.is_cancelled:
        schedule.cancelled_at = datetime.now(timezone.utc)
    
    for field, value in update_data.items():
        setattr(schedule, field, value)
    
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    
    # 참석 인원 수 계산
    schedule.confirmed_coutn = db.query(RaidAttendance).filter(
        and_(
            RaidAttendance.schedule_id == schedule.id,
            RaidAttendance.status == AttendanceStatus.CONFIRMED
        )
    ).count()
    
    schedule.declined_count = db.query(RaidAttendance).filter(
        and_(
            RaidAttendance.schedule_id == schedule.id,
            RaidAttendance.status == AttendanceStatus.DECLINED
        )
    ).count()
    
    return schedule

@router.delete("/groups/{group_id}/schedules/{schedule_id}")
def delete_raid_schedule(
    group_id: int,
    schedule_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    레이드 일정 삭제 (공대장만)
    """
    current_user = deps.get_raid_group_leader(group_id, current_user, db)
    
    schedule = db.query(RaidSchedule).filter(
        and_(
            RaidSchedule.id == schedule_id,
            RaidSchedule.raid_group_id == group_id
        )
    ).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    db.delete(schedule)
    db.commit()
    
    return {"message": "Schedule deleted successfully"}

#SECTION - 참석 관리

@router.get("/groups/{group_id}/schedules/{schedule_id}/attendance", response_model=List[RaidAttendanceSchema])
def get_schedule_attendance(
    group_id: int,
    schedule_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    일정 참석 현황 조회
    """
    # 공대 멤버 확인
    current_user = deps.get_raid_group_member(group_id, current_user, db)
    
    # 일정 확인
    schedule = db.query(RaidSchedule).filter(
        and_(
            RaidSchedule.id == schedule_id,
            RaidSchedule.raid_group_id == group_id
        )
    ).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    attendances = db.query(RaidAttendance).filter(
        RaidAttendance.schedule_id == schedule_id
    ).all()
    
    return attendances

@router.put("/groups/{group_id}/schedules/{schedule_id}/attendance/me", response_model=RaidAttendanceSchema)
def update_my_attendance(
    group_id: int,
    schedule_id: int,
    attendance_in: RaidScheduleUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    내 참석 여부 업데이트
    """
    # 공대 멤버 확인
    current_user = deps.get_raid_group_member(group_id, current_user, db)
    
    # 참석 레코드 조회
    attendance = db.query(RaidAttendance).filter(
        and_(
            RaidAttendance.schedule_id == schedule_id,
            RaidAttendance.user_id == current_user.id
        )
    ).first()
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found"
        )
    
    update_data = attendance_in.model_dump(exclude_unset=True)
    
    # 응답 시간 기록
    if "status" in update_data and update_data["status"] != attendance.status:
        attendance.responded_at = datetime.now(timezone.utc)
    
    for field, value in update_data.items():
        setattr(attendance, field, value)
    
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    
    return attendance

@ router.put("/groups/{group_id}/schedules/{schedule_id}/attendance/{user_id}", response_model=RaidAttendanceSchema)
def update_member_attendance(
    group_id: int,
    schedule_id: int,
    user_id: int,
    attendance_in: RaidAttendanceUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    멤버 참석 여부 업데이트 (공대장 또는 일정 권한자)
    """
    # 권한 확인
    member = db.query(RaidMember).filter(
        and_(
            RaidMember.raid_group_id == group_id,
            RaidMember.user_id == current_user.id
        )
    ).first()
    
    if not member or not member.can_manage_schedule:
        current_user = deps.get_raid_group_leader(group_id, current_user, db)
    
    # 참석 레코드 조회
    attendance = db.query(RaidAttendance).filter(
        and_(
            RaidAttendance.schedule_id == schedule_id,
            RaidAttendance.user_id == user_id
        )
    ).first()
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found"
        )
    
    update_data = attendance_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(attendance, field, value)
    
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    
    return attendance

#SECTION - 대시보드

@router.get("/dashboard", response_model=ScheduleDashboard)
def get_schedule_dashboard(
    raid_group_id: Optional[int] = None,
    days_ahead: int = Query(30, ge=1, le=90),
    days_behind: int = Query(30, ge=1, le=90),
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    일정 대시보드 (내가 속한 공대들의 일정)
    """
    # 내가 속한 공대 목록
    my_groups = db.query(RaidMember.raid_group_id).filter(
        RaidMember.user_id == current_user.id
    )
    
    if raid_group_id:
        my_groups = my_groups.filter(RaidMember.raid_group_id == raid_group_id)
    
    group_ids = [g[0] for g in my_groups.all()]
    
    if not group_ids:
        return ScheduleDashboard()
    
    # 날짜 범위
    today = date.today()
    start_date = today - timedelta(days=days_behind)
    end_date = today + timedelta(days=days_ahead)
    
    # 일정 조회
    schedules = db.query(RaidSchedule).filter(
        and_(
            RaidSchedule.raid_group_id.in_(group_ids),
            RaidSchedule.scheduled_date >= start_date,
            RaidSchedule.scheduled_date <= end_date,
            RaidSchedule.is_cancelled == False
        )
    ).order_by(
        RaidSchedule.scheduled_date.asc(),
        RaidSchedule.start_time.asc()
    ).all()
    
    # 과거/미래 일정 분리
    upcoming = []
    past = []
    my_attendance = {}
    
    for schedule in schedules:
        # 참석 인원 수 계산
        schedule.confirmed_count = db.query(RaidAttendance).filter(
            and_(
                RaidAttendance.schedule_id == schedule.id,
                RaidAttendance.status == AttendanceStatus.CONFIRMED
            )
        ).count()
        
        schedule.declined_count = db.query(RaidAttendance).filter(
            and_(
                RaidAttendance.schedule_id == schedule.id,
                RaidAttendance.status == AttendanceStatus.DECLINED
            )
        ).count()
        
        # 내 참석 상태
        my_att = db.query(RaidAttendance).filter(
            and_(
                RaidAttendance.schedule_id == schedule.id,
                RaidAttendance.user_id == current_user.id
            )
        ).first()
        
        if my_att:
            my_attendance[schedule.id] = my_att.status
        
        # 과거/미래 분리
        if schedule.scheduled_date < today or schedule.is_completed:
            past.append(schedule)
        else:
            upcoming.append(schedule)
    
    dashboard = ScheduleDashboard(
        upcoming_schedules=upcoming,
        past_schedules=past,
        my_attendance_status=my_attendance
    )
    
    return dashboard


#SECTION - 통계

@router.get("/groups/{group_id}/attendance-stats")
def get_attendance_statistics(
    group_id: int,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    공대원 참석률 통계
    """
    # 공대 멤버 확인
    current_user = deps.get_raid_group_member(group_id, current_user, db)
    
    query = db.query(
        RaidAttendance.user_id,
        func.count(RaidAttendance.id).label('total_schedules'),
        func.sum(
            cast(
                RaidAttendance.status == AttendanceStatus.CONFIRMED,
                Integer
            )
        ).label('confirmed_count'),
        func.sum(
            cast(
                RaidAttendance.actually_attended == True,
                Integer
            )
        ).label('actual_attendance')
    ).join(
        RaidSchedule
    ).filter(
        and_(
            RaidSchedule.raid_group_id == group_id,
            RaidSchedule.is_cancelled == False
        )
    )
    
    if from_date:
        query = query.filter(RaidSchedule.scheduled_date >= from_date)
    if to_date:
        query = query.filter(RaidSchedule.scheduled_date <= to_date)
    
    stats = query.group_by(RaidAttendance.user_id).all()
    
    # 사용자 정보 추가
    result = []
    for stat in stats:
        user = db.query(User).filter(User.id == stat.user_id).first()
        if user:
            result.append({
                "user_id": stat.user_id,
                "username": user.username,
                "character_name": user.character_name,
                "total_schedules": stat.total_schedules,
                "confirmed_count": stat.confirmed_count or 0,
                "actual_attendance": stat.actual_attendance or 0,
                "confirmation_rate": round((stat.confirmed_count or 0) / stat.total_schedules * 100, 1) if stat.total_schedules > 0 else 0,
                "attendance_rate": round((stat.actual_attendance or 0) / stat.total_schedules * 100, 1) if stat.total_schedules > 0 else 0
            })
    
    return {"statistics": result}

def create_recurring_schedules(
    db: Session,
    base_schedule: RaidSchedule,
    rule: RaidScheduleCreate
) -> List[RaidSchedule]:
    """
    반복 규칙에 따라 여러 일정 생성
    """
    schedules = []
    current_date = base_schedule.scheduled_date
    end_date = rule.recurrence_end_date
    count = rule.recurrence_count or 52  # 기본값 52주
    created_count = 0
    
    # 선택된 요일 파싱
    selected_days = []
    if rule.recurrence_days and rule.recurrence_type == RecurrenceType.WEEKLY:
        selected_days = [int(d) for d in rule.recurrence_days.split(',')]
    
    while created_count < count:
        # 종료일 체크
        if end_date and current_date > end_date:
            break
        
        # 반복 유형에 따른 처리
        if rule.recurrence_type == RecurrenceType.DAILY:
            # 매일
            current_date += timedelta(days=1)
        elif rule.recurrence_type == RecurrenceType.WEEKLY:
            # 매주
            if selected_days:
                # 선택된 요일만
                found = False
                for _ in range(7):
                    current_date += timedelta(days=1)
                    if current_date.weekday() in selected_days:
                        found = True
                        break
                if not found:
                    continue
            else:
                # 7일 후
                current_date += timedelta(days=7)
        elif rule.recurrence_type == RecurrenceType.BIWEEKLY:
            # 격주
            current_date += timedelta(days=14)
        elif rule.recurrence_type == RecurrenceType.MONTHLY:
            # 매월 같은 날
            # 월의 마지막 날 처리
            next_month = current_date.month + 1
            next_year = current_date.year
            if next_month > 12:
                next_month = 1
                next_year += 1
            
            try:
                current_date = current_date.replace(month=next_month, year=next_year)
            except ValueError:
                # 예: 1월 31일 -> 2월 31일이 없는 경우
                # 해당 월의 마지막 날로 설정
                import calendar
                last_day = calendar.monthrange(next_year, next_month)[1]
                current_date = current_date.replace(
                    month=next_month, 
                    year=next_year, 
                    day=last_day
                )
        
        # 일정 생성
        new_schedule = RaidSchedule(
            raid_group_id=base_schedule.raid_group_id,
            created_by_id=base_schedule.created_by_id,
            title=base_schedule.title,
            description=base_schedule.description,
            scheduled_date=current_date,
            start_time=base_schedule.start_time,
            end_time=base_schedule.end_time,
            target_floors=base_schedule.target_floors,
            minimum_members=base_schedule.minimum_members,
            notes=base_schedule.notes,
            recurrence_type=base_schedule.recurrence_type,
            recurrence_end_date=base_schedule.recurrence_end_date,
            recurrence_count=base_schedule.recurrence_count,
            recurrence_days=base_schedule.recurrence_days,
            parent_schedule_id=base_schedule.id
        )
        
        schedules.append(new_schedule)
        created_count += 1
        
        # 너무 많은 일정 생성 방지
        if created_count >= 100:
            break
    
    return schedules