from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.core import deps
from app.models.user import User
from app.models.raid import Raid, RaidGroup, RaidMember
from app.schemas.raid import (
    Raid as RaidSchema,
    RaidCreate,
    RaidUpdate,
    RaidGroup as RaidGroupSchema,
    RaidGroupCreate,
    RaidGroupUpdate,
    RaidMember as RaidMemberSchema,
    RaidMemberCreate,
    RaidMemberUpdate
)

router = APIRouter()


# ============ 레이드 관리 ============

@router.get("/", response_model=List[RaidSchema])
def get_raids(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: Optional[bool] = None,
    db: Session = Depends(deps.get_db)
):
    """
    레이드 목록 조회
    """
    query = db.query(Raid)
    
    if is_active is not None:
        query = query.filter(Raid.is_active == is_active)
    
    raids = query.offset(skip).limit(limit).all()
    return raids


@router.get("/{raid_id}", response_model=RaidSchema)
def get_raid(
    raid_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    특정 레이드 조회
    """
    raid = db.query(Raid).filter(Raid.id == raid_id).first()
    if not raid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Raid not found"
        )
    return raid


@router.post("/", response_model=RaidSchema)
def create_raid(
    raid_in: RaidCreate,
    current_user: User = Depends(deps.get_current_admin_user),
    db: Session = Depends(deps.get_db)
):
    """
    새 레이드 생성 (관리자만)
    """
    raid = Raid(**raid_in.model_dump())
    db.add(raid)
    db.commit()
    db.refresh(raid)
    return raid


@router.put("/{raid_id}", response_model=RaidSchema)
def update_raid(
    raid_id: int,
    raid_in: RaidUpdate,
    current_user: User = Depends(deps.get_current_admin_user),
    db: Session = Depends(deps.get_db)
):
    """
    레이드 정보 수정 (관리자만)
    """
    raid = db.query(Raid).filter(Raid.id == raid_id).first()
    if not raid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Raid not found"
        )
    
    update_data = raid_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(raid, field, value)
    
    db.add(raid)
    db.commit()
    db.refresh(raid)
    return raid


# ============ 공대 관리 ============

@router.get("/{raid_id}/groups", response_model=List[RaidGroupSchema])
def get_raid_groups(
    raid_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: Optional[bool] = None,
    is_recruiting: Optional[bool] = None,
    db: Session = Depends(deps.get_db)
):
    """
    특정 레이드의 공대 목록 조회
    """
    query = db.query(RaidGroup).filter(RaidGroup.raid_id == raid_id)
    
    if is_active is not None:
        query = query.filter(RaidGroup.is_active == is_active)
    if is_recruiting is not None:
        query = query.filter(RaidGroup.is_recruiting == is_recruiting)
    
    groups = query.offset(skip).limit(limit).all()
    
    # 멤버 수 계산
    for group in groups:
        group.member_count = db.query(RaidMember).filter(
            RaidMember.raid_group_id == group.id
        ).count()
    
    return groups


@router.post("/{raid_id}/groups", response_model=RaidGroupSchema)
def create_raid_group(
    raid_id: int,
    group_in: RaidGroupCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    새 공대 생성
    """
    # 레이드 존재 확인
    raid = db.query(Raid).filter(Raid.id == raid_id).first()
    if not raid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Raid not found"
        )
    
    # 공대 생성
    group = RaidGroup(
        **group_in.model_dump(),
        raid_id=raid_id,
        leader_id=current_user.id
    )
    db.add(group)
    db.commit()
    
    # 공대장을 첫 번째 멤버로 추가
    member = RaidMember(
        raid_group_id=group.id,
        user_id=current_user.id,
        can_manage_schedule=True,
        can_manage_distribution=True
    )
    db.add(member)
    db.commit()
    
    db.refresh(group)
    group.member_count = 1
    return group


@router.get("/groups/{group_id}", response_model=RaidGroupSchema)
def get_raid_group(
    group_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    특정 공대 조회
    """
    group = db.query(RaidGroup).filter(RaidGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Raid group not found"
        )
    
    # 멤버 수 계산
    group.member_count = db.query(RaidMember).filter(
        RaidMember.raid_group_id == group.id
    ).count()
    
    return group


@router.put("/groups/{group_id}", response_model=RaidGroupSchema)
def update_raid_group(
    group_id: int,
    group_in: RaidGroupUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    공대 정보 수정 (공대장만)
    """
    # 권한 확인
    current_user = deps.get_raid_group_leader(group_id, current_user, db)
    
    group = db.query(RaidGroup).filter(RaidGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Raid group not found"
        )
    
    update_data = group_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(group, field, value)
    
    db.add(group)
    db.commit()
    db.refresh(group)
    
    # 멤버 수 계산
    group.member_count = db.query(RaidMember).filter(
        RaidMember.raid_group_id == group.id
    ).count()
    
    return group


@router.delete("/groups/{group_id}")
def delete_raid_group(
    group_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    공대 삭제 (공대장만)
    """
    # 권한 확인
    current_user = deps.get_raid_group_leader(group_id, current_user, db)
    
    group = db.query(RaidGroup).filter(RaidGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Raid group not found"
        )
    
    db.delete(group)
    db.commit()
    
    return {"message": "Raid group deleted successfully"}


# ============ 공대원 관리 ============

@router.get("/groups/{group_id}/members", response_model=List[RaidMemberSchema])
def get_raid_members(
    group_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    공대원 목록 조회
    """
    members = db.query(RaidMember).filter(
        RaidMember.raid_group_id == group_id
    ).all()
    return members


@router.post("/groups/{group_id}/members", response_model=RaidMemberSchema)
def add_raid_member(
    group_id: int,
    member_in: RaidMemberCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    공대원 추가 (공대장만)
    """
    # 권한 확인
    current_user = deps.get_raid_group_leader(group_id, current_user, db)
    
    # 이미 멤버인지 확인
    existing = db.query(RaidMember).filter(
        and_(
            RaidMember.raid_group_id == group_id,
            RaidMember.user_id == member_in.user_id
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this raid group"
        )
    
    # 멤버 수 확인 (최대 8명)
    member_count = db.query(RaidMember).filter(
        RaidMember.raid_group_id == group_id
    ).count()
    
    if member_count >= 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Raid group is full (maximum 8 members)"
        )
    
    # 멤버 추가
    member = RaidMember(
        **member_in.model_dump(),
        raid_group_id=group_id
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.put("/groups/{group_id}/members/{member_id}", response_model=RaidMemberSchema)
def update_raid_member(
    group_id: int,
    member_id: int,
    member_in: RaidMemberUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    공대원 정보 수정 (공대장만)
    """
    # 권한 확인
    current_user = deps.get_raid_group_leader(group_id, current_user, db)
    
    member = db.query(RaidMember).filter(
        and_(
            RaidMember.id == member_id,
            RaidMember.raid_group_id == group_id
        )
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    update_data = member_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(member, field, value)
    
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/groups/{group_id}/members/{member_id}")
def remove_raid_member(
    group_id: int,
    member_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    공대원 제거 (공대장만) 또는 본인 탈퇴
    """
    member = db.query(RaidMember).filter(
        and_(
            RaidMember.id == member_id,
            RaidMember.raid_group_id == group_id
        )
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    # 본인이 아니면 공대장 권한 필요
    if member.user_id != current_user.id:
        current_user = deps.get_raid_group_leader(group_id, current_user, db)
    
    # 공대장은 탈퇴 불가
    group = db.query(RaidGroup).filter(RaidGroup.id == group_id).first()
    if member.user_id == group.leader_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Leader cannot leave the raid group"
        )
    
    db.delete(member)
    db.commit()
    
    return {"message": "Member removed successfully"}


# ============ 내 공대 조회 ============

@router.get("/my-groups", response_model=List[RaidGroupSchema])
def get_my_raid_groups(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    내가 속한 공대 목록 조회
    """
    # 내가 멤버인 공대 ID 조회
    member_groups = db.query(RaidMember.raid_group_id).filter(
        RaidMember.user_id == current_user.id
    ).subquery()
    
    # 공대 정보 조회
    groups = db.query(RaidGroup).filter(
        RaidGroup.id.in_(member_groups)
    ).all()
    
    # 멤버 수 계산
    for group in groups:
        group.member_count = db.query(RaidMember).filter(
            RaidMember.raid_group_id == group.id
        ).count()
    
    return groups