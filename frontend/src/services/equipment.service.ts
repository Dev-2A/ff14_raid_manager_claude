import { apiClient } from './api';
import {
  Equipment, EquipmentSet, EquipmentSetItem,
  EquipmentCreate, EquipmentUpdate,
  EquipmentSetCreate, EquipmentSetUpdate,
  EquipmentSetItemCreate, EquipmentSetItemUpdate,
  EquipmentSlot, EquipmentType
} from '../types';

class EquipmentService {
  // ===== 장비 관리 (관리자) =====
  
  // 장비 목록 조회
  async getEquipmentList(params?: {
    slot?: EquipmentSlot;
    equipment_type?: EquipmentType;
    item_level?: number;
    raid_id?: number;
    is_active?: boolean;
  }): Promise<Equipment[]> {
    return apiClient.get<Equipment[]>('/equipment', params);
  }

  // 특정 장비 조회
  async getEquipment(equipmentId: number): Promise<Equipment> {
    return apiClient.get<Equipment>(`/equipment/${equipmentId}`);
  }

  // 장비 생성 (관리자)
  async createEquipment(equipmentData: EquipmentCreate): Promise<Equipment> {
    return apiClient.post<Equipment>('/equipment', equipmentData);
  }

  // 장비 수정 (관리자)
  async updateEquipment(equipmentId: number, equipmentData: EquipmentUpdate): Promise<Equipment> {
    return apiClient.put<Equipment>(`/equipment/${equipmentId}`, equipmentData);
  }

  // 장비 삭제 (관리자) - 실제로는 비활성화
  async deleteEquipment(equipmentId: number): Promise<{ message: string }> {
    return apiClient.delete(`/equipment/${equipmentId}`);
  }

  // ===== 장비 세트 관리 =====
  
  // 내 장비 세트 목록 조회
  async getMyEquipmentSets(raidGroupId?: number): Promise<EquipmentSet[]> {
    const params = raidGroupId ? { raid_group_id: raidGroupId } : undefined;
    return apiClient.get<EquipmentSet[]>('/equipment/sets/my-sets', params);
  }

  // 특정 장비 세트 조회
  async getEquipmentSet(setId: number): Promise<EquipmentSet> {
    return apiClient.get<EquipmentSet>(`/equipment/sets/${setId}`);
  }

  // 장비 세트 생성
  async createEquipmentSet(setData: EquipmentSetCreate): Promise<EquipmentSet> {
    return apiClient.post<EquipmentSet>('/equipment/sets', setData);
  }

  // 장비 세트 수정
  async updateEquipmentSet(setId: number, setData: EquipmentSetUpdate): Promise<EquipmentSet> {
    return apiClient.put<EquipmentSet>(`/equipment/sets/${setId}`, setData);
  }

  // 장비 세트 삭제
  async deleteEquipmentSet(setId: number): Promise<{ message: string }> {
    return apiClient.delete(`/equipment/sets/${setId}`);
  }

  // ===== 장비 세트 아이템 관리 =====
  
  // 세트에 아이템 추가
  async addItemToSet(setId: number, itemData: EquipmentSetItemCreate): Promise<EquipmentSetItem> {
    return apiClient.post<EquipmentSetItem>(`/equipment/sets/${setId}/items`, itemData);
  }

  // 세트 아이템 수정 (획득 여부 등)
  async updateSetItem(
    setId: number, 
    itemId: number, 
    itemData: EquipmentSetItemUpdate
  ): Promise<EquipmentSetItem> {
    return apiClient.put<EquipmentSetItem>(`/equipment/sets/${setId}/items/${itemId}`, itemData);
  }

  // 세트에서 아이템 제거
  async removeItemFromSet(setId: number, itemId: number): Promise<{ message: string }> {
    return apiClient.delete(`/equipment/sets/${setId}/items/${itemId}`);
  }

  // ===== 유틸리티 함수 =====
  
  // 슬롯 한글 이름 변환
  getSlotName(slot: EquipmentSlot): string {
    const slotNames: Record<EquipmentSlot, string> = {
      [EquipmentSlot.WEAPON]: '무기',
      [EquipmentSlot.HEAD]: '머리',
      [EquipmentSlot.BODY]: '상의',
      [EquipmentSlot.HANDS]: '장갑',
      [EquipmentSlot.LEGS]: '하의',
      [EquipmentSlot.FEET]: '신발',
      [EquipmentSlot.EARRINGS]: '귀걸이',
      [EquipmentSlot.NECKLACE]: '목걸이',
      [EquipmentSlot.BRACELET]: '팔찌',
      [EquipmentSlot.RING]: '반지'
    };
    return slotNames[slot] || slot;
  }

  // 장비 타입 한글 이름 변환
  getEquipmentTypeName(type: EquipmentType): string {
    const typeNames: Record<EquipmentType, string> = {
      [EquipmentType.RAID_HERO]: '영웅 레이드',
      [EquipmentType.RAID_NORMAL]: '일반 레이드',
      [EquipmentType.TOME]: '석판',
      [EquipmentType.TOME_AUGMENTED]: '강화 석판',
      [EquipmentType.CRAFTED]: '제작',
      [EquipmentType.OTHER]: '기타'
    };
    return typeNames[type] || type;
  }

  // 아이템 레벨별 색상 클래스
  getItemLevelColorClass(itemLevel: number): string {
    if (itemLevel >= 730) return 'item-quality-legendary';
    if (itemLevel >= 710) return 'item-quality-epic';
    if (itemLevel >= 690) return 'item-quality-rare';
    if (itemLevel >= 670) return 'item-quality-uncommon';
    return 'item-quality-common';
  }
}

export const equipmentService = new EquipmentService();