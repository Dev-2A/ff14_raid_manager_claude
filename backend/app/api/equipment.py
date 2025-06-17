from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.core import deps
from app.models.user import User
from app.models.equipment import Equipment, EquipmentSet, EquipmentSetItem, EquipmentSlot as ModelEquipmentSlot
from app.models.raid import RaidMember
from app.schemas.equipment import (
    Equipment as EquipmentSchema,
    EquipmentCreate,
    EquipmentUpdate,
    EquipmentSet as EquipmentSetSchema,
    EquipmentSetCreate,
    EquipmentSetUpdate,
    EquipmentSetItem as EquipmentSetItemSchema,
    EquipmentSetItemCreate,
    EquipmentSetItemUpdate,
    EquipmentSlot,
    EquipmentType
)

router = APIRouter()

#SECTION - 장비 관리 (관리자)

@router.get("/", response_model=List[EquipmentSchema])
def get_equipment_list(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    slot: Optional[EquipmentSlot] = None,
    equipment_type: Optional[EquipmentType] = None,
    item_level: Optional[int] = None,
    raid_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(deps.get_db)
):
    """
    장비 목록 조회
    """
    query = db.query(Equipment)
    
    if slot:
        query = query.filter(Equipment.slot == slot)
    if equipment_type:
        query = query.filter(Equipment.equipment_type == equipment_type)
    if item_level:
        query = query.filter(Equipment.item_level == item_level)
    if raid_id:
        query = query.filter(Equipment.raid_id == raid_id)
    if is_active is not None:
        query = query.filter(Equipment.is_active == is_active)
    
    equipment_list = query.offset(skip).limit(limit).all()
    return equipment_list

@router.get("/{equipment_id}", response_model=EquipmentSchema)
def get_equipment(
    equipment_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    특정 장비 조회
    """
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    return equipment

@router.post("/", response_model=EquipmentSchema)
def create_equipment(
    equipment_in: EquipmentCreate,
    current_user: User = Depends(deps.get_current_admin_user),
    db: Session = Depends(deps.get_db)
):
    """
    새 장비 생성 (관리자만)
    """
    equipment = Equipment(**equipment_in.model_dump())
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment

@router.put("/{equipment_id}", response_model=EquipmentSchema)
def update_equipment(
    equipment_id: int,
    equipment_in: EquipmentUpdate,
    current_user: User = Depends(deps.get_current_admin_user),
    db: Session = Depends(deps.get_db)
):
    """
    장비 정보 수정 (관리자만)
    """
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    update_data = equipment_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(equipment, field, value)
    
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment

@router.delete("/{equipment_id}")
def delete_equipment(
    equipment_id: int,
    current_user: User = Depends(deps.get_current_admin_user),
    db: Session = Depends(deps.get_db)
):
    """
    장비 삭제 (관리자만)
    """
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    # 실제로 삭제하지 않고 비활성화
    equipment.is_active = False
    db.add(equipment)
    db.commit()
    
    return {"message": "Equipment deactivated successfully"}

#SECTION - 장비 세트 관리

@router.get("/sets/my-sets", response_model=List[EquipmentSetSchema])
def get_my_equipment_sets(
    raid_group_id: Optional[int] = None,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    내 장비 세트 목록 조회
    """
    query = db.query(EquipmentSet).filter(EquipmentSet.user_id == current_user.id)
    
    if raid_group_id:
        query = query.filter(EquipmentSet.raid_group_id == raid_group_id)
    
    sets = query.all()
    return sets

@router.get("/sets/{set_id}", response_model=EquipmentSetSchema)
def get_equipment_set(
    set_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    특정 장비 세트 조회
    """
    equipment_set = db.query(EquipmentSet).filter(
        EquipmentSet.id == set_id
    ).first()
    
    if not equipment_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment set not found"
        )
    
    # 본인 세트이거나 같은 공대원의 세트만 조회 가능
    if equipment_set.user_id != current_user.id:
        member = db.query(RaidMember).filter(
            and_(
                RaidMember.raid_group_id == equipment_set.raid_group_id,
                RaidMember.user_id == current_user.id
            )
        ).first()
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this equipment set"
            )
    
    return equipment_set

@router.post("/sets", response_model=EquipmentSetSchema)
def create_equipemnt_set(
    set_in: EquipmentSetCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    새 장비 세트 생성
    """
    # 공대 멤버인지 확인
    member = db.query(RaidMember).filter(
        and_(
            RaidMember.raid_group_id == set_in.raid_group_id,
            RaidMember.user_id == current_user.id
        )
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this raid group"
        )
    
    # 같은 타입의 세트가 이미 있는지 확인
    if set_in.is_starting_set:
        existing = db.query(EquipmentSet).filter(
            and_(
                EquipmentSet.user_id == current_user.id,
                EquipmentSet.raid_group_id == set_in.raid_group_id,
                EquipmentSet.is_starting_set == True
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Starting set already exists for this raid group"
            )
    
    if set_in.is_bis_set:
        existing = db.query(EquipmentSet).filter(
            and_(
                EquipmentSet.user_id == current_user.id,
                EquipmentSet.raid_group_id == set_in.raid_group_id,
                EquipmentSet.is_bis_set == True
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="BIS set already exists for this raid group"
            )
    
    # 세트 생성
    equipment_set = EquipmentSet(
        **set_in.model_dump(),
        user_id=current_user.id
    )
    db.add(equipment_set)
    db.commit()
    db.refresh(equipment_set)
    return equipment_set

@router.put("/sets/{set_id}", response_model=EquipmentSetSchema)
def update_equipment_set(
    set_id: int,
    set_in: EquipmentSetUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    장비 세트 수정 (본인만)
    """
    equipment_set = db.query(EquipmentSet).filter(
        and_(
            EquipmentSet.id == set_id,
            EquipmentSet.user_id == current_user.id
        )
    ).first()
    
    if not equipment_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment set not found"
        )
    
    update_data = set_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(equipment_set, field, value)
    
    db.add(equipment_set)
    db.commit()
    db.refresh(equipment_set)
    return equipment_set

@router.delete("/sets/{set_id}")
def delete_equipment_set(
    set_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    장비 세트 삭제 (본인만)
    """
    equipment_set = db.query(EquipmentSet).filter(
        and_(
            EquipmentSet.id == set_id,
            EquipmentSet.user_id == current_user.id
        )
    ).first()
    
    if not equipment_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment set not found"
        )
    
    db.delete(equipment_set)
    db.commit()
    
    return {"message": "Equipment set deleted successfully"}

#SECTION - 장비 세트 아이템 관리

@router.post("/sets/{set_id}/items", response_model=EquipmentSetItemSchema)
def add_equipment_to_set(
    set_id: int,
    item_in: EquipmentSetItemCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    장비 세트에 아이템 추가
    """
    # 세트 소유자 확인
    equipment_set = db.query(EquipmentSet).filter(
        and_(
            EquipmentSet.id == set_id,
            EquipmentSet.user_id == current_user.id
        )
    ).first()
    
    if not equipment_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment set not found"
        )
    
    # 장비 존재 확인
    equipment = db.query(Equipment).filter(Equipment.id == item_in.equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    # 슬롯 일치 확인
    if equipment.slot != item_in.slot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipment slot mismatch"
        )
    
    # 같은 슬롯에 이미 장비가 있는지 확인
    existing = db.query(EquipmentSetItem).filter(
        and_(
            EquipmentSetItem.equipment_set_id == set_id,
            EquipmentSetItem.slot == item_in.slot
        )
    ).first()
    
    if existing:
        # 기존 장비 교체
        existing.equipment_id = item_in.equipment_id
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # 새 아이템 추가
        set_item = EquipmentSetItem(
            **item_in.model_dump(),
            equipment_set_id=set_id
        )
        db.add(set_item)
        db.commit()
        db.refresh(set_item)
        
        # 세트의 아이템 레벨 재계산
        _recalculate_set_item_level(db, equipment_set)
        
        return set_item

@router.put("/sets/{set_id}/items/{item_id}", response_model=EquipmentSetItemSchema)
def update_set_item(
    set_id: int,
    item_id: int,
    item_in: EquipmentSetItemUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    세트 아이템 수정 (획득 여부 변경 등)
    """
    # 세트 소유자 확인
    equipment_set = db.query(EquipmentSet).filter(
        and_(
            EquipmentSet.id == set_id,
            EquipmentSet.user_id == current_user.id
        )
    ).first()
    
    if not equipment_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment set not found"
        )
    
    # 아이템 확인
    set_item = db.query(EquipmentSetItem).filter(
        and_(
            EquipmentSetItem.id == item_id,
            EquipmentSetItem.equipment_set_id == set_id
        )
    ).first()
    
    if not set_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Set item not found"
        )
    
    update_data = item_in.model_dump(exclude_unset=True)
    
    # 획득 여부가 변경되고 True로 설정되면 획득 시간 기록
    if "is_obtained" in update_data and update_data["is_obtained"] and not set_item.is_obtained:
        from datetime import datetime, timezone
        set_item.obtained_at = datetime.now(timezone.utc)
    
    for field, value in update_data.items():
        setattr(set_item, field, value)
    
    db.add(set_item)
    db.commit()
    db.refresh(set_item)
    
    # 세트의 아이템 레벨 재계산
    _recalculate_set_item_level(db, equipment_set)
    
    return set_item

@router.delete("/sets/{set_id}/items/{item_id}")
def remove_item_from_set(
    set_id: int,
    item_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    세트에서 아이템 제거
    """
    # 세트 소유자 확인
    equipment_set = db.query(EquipmentSet).filter(
        and_(
            EquipmentSet.id == set_id,
            EquipmentSet.user_id == current_user.id
        )
    ).first()
    
    if not equipment_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment set not found"
        )
    
    # 아이템 확인
    set_item = db.query(EquipmentSetItem).filter(
        and_(
            EquipmentSetItem.id == item_id,
            EquipmentSetItem.equipment_set_id == set_id
        )
    ).first()
    
    if not set_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Set item not found"
        )
    
    db.delete(set_item)
    db.commit()
    
    # 세트의 아이템 레벨 재계산
    _recalculate_set_item_level(db, equipment_set)
    
    return {"message": "Item removed set successfully"}

#SECTION - 유틸리티 함수

def _recalculate_set_item_level(db: Session, equipment_set: EquipmentSet):
    """
    장비 세트의 평균 아이템 레벨 재계산
    """
    items = db.query(EquipmentSetItem).filter(
        EquipmentSetItem.equipment_set_id == equipment_set.id
    ).all()
    
    if not items:
        equipment_set.total_item_level = 0
    else:
        total_level = 0
        item_count = 0
        
        for item in items:
            equipment = db.query(Equipment).filter(Equipment.id == item.equipment_id).first()
            if equipment:
                # 무기는 2개로 계산 (메인+보조)
                if equipment.slot == ModelEquipmentSlot.WEAPON:
                    total_level += equipment.item_level * 2
                    item_count += 2
                else:
                    total_level += equipment.item_level
                    item_count += 1
        
        # 전체 부위는 11개 (무기 2개로 계산)
        if item_count > 0:
            equipment_set.total_item_level = total_level // 11 # 실제 착용 부위 수로 나누기
        else:
            equipment_set.total_item_level = 0
    
    db.add(equipment_set)
    db.commit()