from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime, timezone

from app.core import deps
from app.models.user import User
from app.models.raid import RaidGroup, RaidMember
from app.models.equipment import Equipment, EquipmentSet, EquipmentSetItem, EquipmentSlot as ModelEquipmentSlot, EquipmentType as ModelEquipmentType
from app.models.item_distribution import ItemDistribution, DistributionHistory, ResourceRequirement
from app.schemas.item_distribution import (
    ItemDistribution as ItemDistributionSchema,
    ItemDistributionCreate,
    ItemDistributionUpdate,
    DistributionHistory as DistributionHistorySchema,
    DistributionHistoryCreate,
    ResourceRequirement as ResourceRequirementSchema,
    ResourceRequirementUpdate,
    ResourceCalculationResult,
    ItemType
)

router = APIRouter()

#SECTION - 아이템 분배 규칙 관리

@router.get("/groups/{group_id}/rules", response_model=List[ItemDistributionSchema])
def get_distribution_rules(
    group_id: int,
    floor_number: Optional[int] = None,
    item_type: Optional[ItemType] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    공대의 아이템 분배 규칙 목록 조회
    """
    # 공대 멤버 확인
    current_user = deps.get_raid_group_member(group_id, current_user, db)
    
    query = db.query(ItemDistribution).filter(
        ItemDistribution.raid_group_id == group_id
    )
    
    if floor_number:
        query = query.filter(ItemDistribution.floor_number == floor_number)
    if item_type:
        query = query.filter(ItemDistribution.item_type == item_type)
    if is_active is not None:
        query = query.filter(ItemDistribution.is_active == is_active)
    
    rules = query.all()
    return rules

@router.post("/groups/{group_id}/rules", response_model=ItemDistributionSchema)
def create_distribution_rule(
    group_id: int,
    rule_in: ItemDistributionCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    새 분배 규칙 생성 (공대장 또는 분배 권한자)
    """
    # 권한 확인
    member = db.query(RaidMember).filter(
        and_(
            RaidMember.raid_group_id == group_id,
            RaidMember.user_id == current_user.id
        )
    ).first()
    
    if not member or not member.can_manage_distribution:
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
                detail="Not authorized to manage distribution"
            )
    
    # 우선순위 순서 검증 (모든 멤버가 포함되어야 함)
    if rule_in.priority_order:
        members = db.query(RaidMember).filter(
            RaidMember.raid_group_id == group_id
        ).all()
        member_ids = {m.user_id for m in members}
        
        if set(rule_in.priority_order) != member_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Priority order must include all raid members"
            )
    
    # 분배 규칙 생성
    rule = ItemDistribution(
        **rule_in.model_dump(),
        raid_group_id=group_id
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.put("/groups/{group_id}/rules/{rule_id}", response_model=ItemDistributionSchema)
def update_distribution_rule(
    group_id: int,
    rule_id: int,
    rule_in: ItemDistributionUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    분배 규칙 수정
    """
    # 권한 확인 (위와 동일)
    member = db.query(RaidMember).filter(
        and_(
            RaidMember.raid_group_id == group_id,
            RaidMember.user_id == current_user.id
        )
    ).first()
    
    if not member or not member.can_manage_distribution:
        current_user = deps.get_raid_group_leader(group_id, current_user, db)
    
    # 규칙 조회
    rule = db.query(ItemDistribution).filter(
        and_(
            ItemDistribution.id == rule_id,
            ItemDistribution.raid_group_id == group_id
        )
    ).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Distribution rule not found"
        )
    
    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
    
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/groups/{group_id}/rules/{rule_id}")
def delete_distribution_rule(
    group_id: int,
    rule_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    분배 규칙 삭제
    """
    # 권한 확인
    current_user = deps.get_raid_group_leader(group_id, current_user, db)
    
    rule = db.query(ItemDistribution).filter(
        and_(
            ItemDistribution.id == rule_id,
            ItemDistribution.raid_group_id == group_id
        )
    ).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Distribution rule not found"
        )
    
    db.delete(rule)
    db.commit()
    
    return {"message": "Distribution rule deleted successfully"}

#SECTION - 분배 이력 관리

@router.get("/groups/{group_id}/history", response_model=List[DistributionHistorySchema])
def get_distribution_history(
    group_id: int,
    week_number: Optional[int] = None,
    user_id: Optional[int] = None,
    item_type: Optional[ItemType] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    아이템 분배 이력 조회
    """
    # 공대 멤버 확인
    current_user = deps.get_raid_group_member(group_id, current_user, db)
    
    query = db.query(DistributionHistory).filter(
        DistributionHistory.raid_group_id == group_id
    )
    
    if week_number:
        query = query.filter(DistributionHistory.week_number == week_number)
    if user_id:
        query = query.filter(DistributionHistory.user_id == user_id)
    if item_type:
        query = query.filter(DistributionHistory.item_type == item_type)
    
    # 최신순 정렬
    query = query.order_by(DistributionHistory.distributed_at.desc())
    
    histories = query.offset(skip).limit(limit).all()
    return histories

@router.post("/groups/{group_id}/history", response_model=DistributionHistorySchema)
def record_distribution(
    group_id: int,
    history_in: DistributionHistoryCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    아이템 분배 기록
    """
    # 권한 확인
    member = db.query(RaidMember).filter(
        and_(
            RaidMember.raid_group_id == group_id,
            RaidMember.user_id == current_user.id
        )
    ).first()
    
    if not member or not member.can_manage_distribution:
        current_user = deps.get_raid_group_leader(group_id, current_user, db)
    
    # 분배 규칙이 있는 경우 업데이트
    if history_in.distribution_id:
        rule = db.query(ItemDistribution).filter(
            and_(
                ItemDistribution.id == history_in.distribution_id,
                ItemDistribution.raid_group_id == group_id
            )
        ).first()
        
        if rule:
            # completed_users에 추가
            if history_in.user_id not in rule.completed_users:
                rule.completed_users = rule.completed_users + [history_in.user_id]
                db.add(rule)
    
    # 이력 생성
    history = DistributionHistory(
        **history_in.model_dump(),
        raid_group_id=group_id
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return history

@router.delete("/groups/{group_id}/history/{history_id}")
def delete_distribution_history(
    group_id: int,
    history_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    분배 이력 삭제 (공대장만)
    """
    current_user = deps.get_raid_group_leader(group_id, current_user, db)
    
    history = db.query(DistributionHistory).filter(
        and_(
            DistributionHistory.id == history_id,
            DistributionHistory.raid_group_id == group_id
        )
    ).first()
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Distribution history not found"
        )
    
    # 관련 규칙에서 completed_users 업데이트
    if history.distribution_id:
        rule = db.query(ItemDistribution).filter(
            ItemDistribution.id == history.distribution_id
        ).first()
        
        if rule and history.user_id in rule.completed_users:
            rule.completed_users = [uid for uid in rule.completed_users if uid != history.user_id]
            db.add(rule)
    
    db.delete(history)
    db.commit()
    
    return {"message": "Distribution history deleted successfully"}

#SECTION - 재화 요구량 계산

@router.get("/groups/{group_id}/resources", response_model=List[ResourceRequirementSchema])
def get_resource_requirements(
    group_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    공대원들의 재화 요구량 조회
    """
    # 공대 멤버 확인
    current_user = deps.get_raid_group_member(group_id, current_user, db)
    
    requirements = db.query(ResourceRequirement).filter(
        ResourceRequirement.raid_group_id == group_id
    ).all()
    
    return requirements

@router.get("/groups/{group_id}/resources/me", response_model=ResourceRequirementSchema)
def get_my_resource_requirement(
    group_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    내 재화 요구량 조회
    """
    # 공대 멤버 확인
    current_user = deps.get_raid_group_member(group_id, current_user, db)
    
    requirement = db.query(ResourceRequirement).filter(
        and_(
            ResourceRequirement.raid_group_id == group_id,
            ResourceRequirement.user_id == current_user.id
        )
    ).first()
    
    if not requirement:
        # 없으면 생성
        requirement = ResourceRequirement(
            user_id=current_user.id,
            raid_group_id=group_id
        )
        db.add(requirement)
        db.commit()
        db.refresh(requirement)
    
    return requirement

@router.post("/groups/{group_id}/resources/calculate", response_model=ResourceCalculationResult)
def calculate_resource_requirement(
    group_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    재화 요구량 계산 및 업데이트
    """
    # 공대 멤버 확인
    current_user = deps.get_raid_group_member(group_id, current_user, db)
    
    # 출발 세트와 BIS 세트 조회
    starting_set = db.query(EquipmentSet).filter(
        and_(
            EquipmentSet.user_id == current_user.id,
            EquipmentSet.raid_group_id == group_id,
            EquipmentSet.is_starting_set == True
        )
    ).first()
    
    bis_set = db.query(EquipmentSet).filter(
        and_(
            EquipmentSet.user_id == current_user.id,
            EquipmentSet.raid_group_id == group_id,
            EquipmentSet.is_bis_set == True
        )
    ).first()
    
    if not starting_set or not bis_set:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both starting set and BIS set are required"
        )
    
    # 재화 계산
    required_resources = _calculate_resources(db, starting_set, bis_set)
    
    # 재화 요구량 업데이트
    requirement = db.query(ResourceRequirement).filter(
        and_(
            ResourceRequirement.raid_group_id == group_id,
            ResourceRequirement.user_id == current_user.id
        )
    ).first()
    
    if not requirement:
        requirement = ResourceRequirement(
            user_id=current_user.id,
            raid_group_id=group_id
        )
        db.add(requirement)
    
    requirement.required_resources = required_resources["total"]
    requirement.remaining_resources = required_resources["total"] # 초기값
    requirement.last_calculated_at = datetime.now(timezone.utc)
    
    # 달성률 계산
    requirement.completion_percentage = 0 # 초기값
    
    db.commit()
    db.refresh(requirement)
    
    # 결과 반환
    result = ResourceCalculationResult(
        user_id=current_user.id,
        raid_group_id=group_id,
        required_resources=required_resources["total"],
        equipment_changes=required_resources["changes"],
        upgrade_materials_needed=required_resources["upgrade_materials"],
        tome_cost_total=required_resources["tome_cost"]
    )
    
    return result

@router.put("/groups/{group_id}/resources/update", response_model=ResourceRequirementSchema)
def update_obtained_resources(
    group_id: int,
    update_in: ResourceRequirementUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    획득한 재화 업데이트
    """
    # 공대 멤버 확인
    current_user = deps.get_raid_group_member(group_id, current_user, db)
    
    requirement = db.query(ResourceRequirement).filter(
        and_(
            ResourceRequirement.raid_group_id == group_id,
            ResourceRequirement.user_id == current_user.id
        )
    ).first()
    
    if not requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource requirement not found"
        )
    
    # 획득 재화 업데이트
    if update_in.obtained_resources:
        requirement.obtained_resources = update_in.obtained_resources
        
        # 남은 재화 계산
        remaining = {}
        for key, required in requirement.required_resources.items():
            obtained = requirement.obtained_resources.get(key, 0)
            remaining[key] = max(0, required - obtained)
        
        requirement.remaining_resources = remaining
        
        # 달성률 계산
        total_required = sum(requirement.required_resources.values())
        total_obtained = sum(requirement.obtained_resources.values())
        
        if total_required > 0:
            requirement.completion_percentage = min(100, int((total_obtained / total_required) * 100))
        else:
            requirement.completion_percentage = 100
    
    db.add(requirement)
    db.commit()
    db.refresh(requirement)
    
    return requirement

#SECTION - 우선순위 자동 계산

@router.post("/groups/{group_id}/calculate-priority")
def calculate_distribution_priority(
    group_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    우선 순위 자동 계산 (공대장 또는 분배 권한자)
    """
    # 권한 확인
    member = db.query(RaidMember).filter(
        and_(
            RaidMember.raid_group_id == group_id,
            RaidMember.user_id == current_user.id
        )
    ).first()
    
    if not member or not member.can_manage_distribution:
        current_user = deps.get_raid_group_leader(group_id, current_user, db)
    
    # 공대 설정 확인
    group = db.query(RaidGroup).filter(RaidGroup.id == group_id).first()
    if group.distribution_method != "priority":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This raid group does not use priority distribution"
        )
    
    # 모든 멤버의 재화 요구량 조회
    requirements = db.query(ResourceRequirement).filter(
        ResourceRequirement.raid_group_id == group_id
    ).all()
    
    if not requirements:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No resource requirements found. Members must calculate their requirements first."
        )
    
    # 각 아이템별 우선순위 계산
    priorities = _calculate_priorities(db, group_id, requirements)
    
    # 기존 분배 규칙 업데이트
    for item_name, priority_order in priorities.items():
        rule = db.query(ItemDistribution).filter(
            and_(
                ItemDistribution.raid_group_id == group_id,
                ItemDistribution.item_name == item_name,
                ItemDistribution.is_active == True
            )
        ).first()
        
        if rule:
            rule.priority_order = priority_order
            db.add(rule)
    
    db.commit()
    
    return {"message": "Priorities calculated successfully", "priorities": priorities}

#SECTION - 유틸리티 함수
def _calculate_resources(db: Session, starting_set: EquipmentSet, bis_set: EquipmentSet) -> Dict:
    """
    출발 세트에서 BIS 세트까지 필요한 재화 계산
    """
    required = {
        "total": {},
        "changes": [],
        "upgrade_materials": {},
        "tome_cost": 0
    }
    
    # 각 슬롯별로 비교
    starting_items = {item.slot: item for item in starting_set.items}
    bis_items = {item.slot: item for item in bis_set.items}
    
    for slot, bis_item in bis_items.items():
        starting_item = starting_items.get(slot)
        
        if not starting_item or starting_item.equipment_id != bis_item.equipment_id:
            # 장비 변경 필요
            bis_equipment = db.query(Equipment).filter(
                Equipment.id == bis_item.equipment_id
            ).first()
            
            if bis_equipment:
                change = {
                    "slot": slot.value,
                    "from": starting_item.equipment.name if starting_item else "없음",
                    "to": bis_equipment.name,
                    "type": bis_equipment.equipment_type.value
                }
                required["changes"].append(change)
                
                # 재화 계산
                if bis_equipment.equipment_type == ModelEquipmentType.RAID_HERO:
                    # 영웅 레이드 장비
                    token_name = _get_token_name(slot)
                    required["total"][token_name] = required["total"].get(token_name, 0) + _get_token_count(slot)
                
                elif bis_equipment.equipment_type == ModelEquipmentType.TOME_AUGMENTED:
                    # 보강된 석판 장비
                    required["total"]["석판"] = required["total"].get("석판", 0) + bis_equipment.tome_cost
                    required["tome_cost"] += bis_equipment.tome_cost
                    
                    # 보강 재료
                    material = _get_upgrade_material(slot)
                    required["total"][material] = required["total"].get(material, 0) + 1
                    required["upgrade_materials"][material] = required["upgrade_materials"].get(material, 0) + 1
    
    return required

def _calculate_priorities(db: Session, group_id: int, requirements: List[ResourceRequirement]) -> Dict:
    """
    재화 요구량 기반 우선순위 계산
    """
    priorities = {}
    
    # 각 아이템 타입별로 계산
    item_types = [
        ("귀걸이_낱장", 3), ("목걸이_낱장", 3), ("팔찌_낱장", 3), ("반지_낱장", 3),
        ("머리_낱장", 4), ("장갑_낱장", 4), ("신발_낱장", 4),
        ("상의_낱장", 6), ("하의_낱장", 6),
        ("무기_낱장", 8),
        ("경화약", 4), ("강화섬유", 4), ("강화약", 4)
    ]
    
    for item_name, _ in item_types:
        # 해당 아이템이 필요한 멤버들의 점수 계산
        scores = []
        
        for req in requirements:
            if item_name in req.required_resources:
                need = req.required_resources[item_name]
                obtained = req.obtained_resources.get(item_name, 0)
                remaining = need - obtained
                
                if remaining > 0:
                    # 전체 재화 필요량도 고려
                    total_need = sum(req.remaining_resources.values())
                    score = (remaining * 1000) + total_need # 해당 아이템 필요량을 우선시
                    scores.append((req.user_id, score))
        
        # 점수 기준 정렬 (높은 순)
        scores.sort(key=lambda x: x[1], reverse=True)
        priority_order = [user_id for user_id, _ in scores]
        
        if priority_order:
            priorities[item_name] = priority_order
    
    return priorities

def _get_token_name(slot: ModelEquipmentSlot) -> str:
    """슬롯에 따른 토큰(낱장) 이름 반환"""
    mapping = {
        ModelEquipmentSlot.WEAPON: "무기_낱장",
        ModelEquipmentSlot.HEAD: "머리_낱장",
        ModelEquipmentSlot.BODY: "상의_낱장",
        ModelEquipmentSlot.HANDS: "장갑_낱장",
        ModelEquipmentSlot.LEGS: "하의_낱장",
        ModelEquipmentSlot.FEET: "신발_낱장",
        ModelEquipmentSlot.EARRINGS: "귀걸이_낱장",
        ModelEquipmentSlot.NECKLACE: "목걸이_낱장",
        ModelEquipmentSlot.BRACELET: "팔찌_낱장",
        ModelEquipmentSlot.RING: "반지_낱장"
    }
    return mapping.get(slot, "")


def _get_token_count(slot: ModelEquipmentSlot) -> int:
    """슬롯에 따른 필요 토큰 수 반환"""
    counts = {
        ModelEquipmentSlot.WEAPON: 8,
        ModelEquipmentSlot.HEAD: 4,
        ModelEquipmentSlot.BODY: 6,
        ModelEquipmentSlot.HANDS: 4,
        ModelEquipmentSlot.LEGS: 6,
        ModelEquipmentSlot.FEET: 4,
        ModelEquipmentSlot.EARRINGS: 3,
        ModelEquipmentSlot.NECKLACE: 3,
        ModelEquipmentSlot.BRACELET: 3,
        ModelEquipmentSlot.RING: 3
    }
    return counts.get(slot, 0)


def _get_upgrade_material(slot: ModelEquipmentSlot) -> str:
    """슬롯에 따른 보강 재료 반환"""
    if slot in [ModelEquipmentSlot.EARRINGS, ModelEquipmentSlot.NECKLACE, 
                ModelEquipmentSlot.BRACELET, ModelEquipmentSlot.RING]:
        return "경화약"
    else:
        return "강화섬유"