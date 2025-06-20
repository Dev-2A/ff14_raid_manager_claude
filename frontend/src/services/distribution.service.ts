import { apiClient } from './api';
import {
  ItemDistribution, DistributionHistory, ResourceRequirement,
  ItemDistributionCreate, ItemDistributionUpdate,
  DistributionHistoryCreate, ResourceRequirementUpdate,
  ItemType, ResourceCalculationResult
} from '../types';

class DistributionService {
  // ===== 아이템 분배 규칙 관리 =====
  
  // 분배 규칙 목록 조회
  async getDistributionRules(groupId: number, params?: {
    floor_number?: number;
    item_type?: ItemType;
    is_active?: boolean;
  }): Promise<ItemDistribution[]> {
    return apiClient.get<ItemDistribution[]>(`/distribution/groups/${groupId}/rules`, params);
  }

  // 분배 규칙 생성 (공대장/분배 권한자)
  async createDistributionRule(
    groupId: number, 
    ruleData: ItemDistributionCreate
  ): Promise<ItemDistribution> {
    return apiClient.post<ItemDistribution>(`/distribution/groups/${groupId}/rules`, ruleData);
  }

  // 분배 규칙 수정
  async updateDistributionRule(
    groupId: number,
    ruleId: number,
    ruleData: ItemDistributionUpdate
  ): Promise<ItemDistribution> {
    return apiClient.put<ItemDistribution>(`/distribution/groups/${groupId}/rules/${ruleId}`, ruleData);
  }

  // 분배 규칙 삭제
  async deleteDistributionRule(groupId: number, ruleId: number): Promise<{ message: string }> {
    return apiClient.delete(`/distribution/groups/${groupId}/rules/${ruleId}`);
  }

  // ===== 분배 이력 관리 =====
  
  // 분배 이력 조회
  async getDistributionHistory(groupId: number, params?: {
    week_number?: number;
    user_id?: number;
    item_type?: ItemType;
    skip?: number;
    limit?: number;
  }): Promise<DistributionHistory[]> {
    return apiClient.get<DistributionHistory[]>(`/distribution/groups/${groupId}/history`, params);
  }

  // 분배 기록
  async recordDistribution(
    groupId: number,
    historyData: DistributionHistoryCreate
  ): Promise<DistributionHistory> {
    return apiClient.post<DistributionHistory>(`/distribution/groups/${groupId}/history`, historyData);
  }

  // 분배 이력 삭제 (공대장)
  async deleteDistributionHistory(groupId: number, historyId: number): Promise<{ message: string }> {
    return apiClient.delete(`/distribution/groups/${groupId}/history/${historyId}`);
  }

  // ===== 재화 요구량 관리 =====
  
  // 공대원들의 재화 요구량 조회
  async getResourceRequirements(groupId: number): Promise<ResourceRequirement[]> {
    return apiClient.get<ResourceRequirement[]>(`/distribution/groups/${groupId}/resources`);
  }

  // 내 재화 요구량 조회
  async getMyResourceRequirement(groupId: number): Promise<ResourceRequirement> {
    return apiClient.get<ResourceRequirement>(`/distribution/groups/${groupId}/resources/me`);
  }

  // 재화 요구량 계산
  async calculateResourceRequirement(groupId: number): Promise<ResourceCalculationResult> {
    return apiClient.post<ResourceCalculationResult>(`/distribution/groups/${groupId}/resources/calculate`);
  }

  // 획득한 재화 업데이트
  async updateObtainedResources(
    groupId: number,
    updateData: ResourceRequirementUpdate
  ): Promise<ResourceRequirement> {
    return apiClient.put<ResourceRequirement>(`/distribution/groups/${groupId}/resources/update`, updateData);
  }

  // 우선순위 자동 계산 (공대장/분배 권한자)
  async calculatePriority(groupId: number): Promise<{
    message: string;
    priorities: Record<string, number[]>;
  }> {
    return apiClient.post(`/distribution/groups/${groupId}/calculate-priority`);
  }

  // ===== 유틸리티 함수 =====
  
  // 아이템 타입 한글 이름 변환
  getItemTypeName(type: ItemType): string {
    const typeNames: Record<ItemType, string> = {
      [ItemType.EQUIPMENT_COFFER]: '장비 궤짝',
      [ItemType.WEAPON_COFFER]: '무기 궤짝',
      [ItemType.UPGRADE_ITEM]: '보강 재료',
      [ItemType.TOME_MATERIAL]: '석판 교환 재료',
      [ItemType.TOKEN]: '낱장/토큰',
      [ItemType.WEAPON_TOKEN]: '무기 토큰',
      [ItemType.MOUNT]: '탈것',
      [ItemType.OTHER]: '기타'
    };
    return typeNames[type] || type;
  }

  // 재화 이름 한글 변환
  getResourceName(resource: string): string {
    const resourceNames: Record<string, string> = {
      '경화약': '경화약',
      '강화섬유': '강화섬유',
      '강화약': '강화약',
      '석판': '석판',
      '무기_낱장': '무기 낱장',
      '머리_낱장': '머리 낱장',
      '상의_낱장': '상의 낱장',
      '장갑_낱장': '장갑 낱장',
      '하의_낱장': '하의 낱장',
      '신발_낱장': '신발 낱장',
      '귀걸이_낱장': '귀걸이 낱장',
      '목걸이_낱장': '목걸이 낱장',
      '팔찌_낱장': '팔찌 낱장',
      '반지_낱장': '반지 낱장'
    };
    return resourceNames[resource] || resource;
  }

  // 주차 계산 (레이드 시작일 기준)
  calculateWeekNumber(startDate: Date, targetDate: Date = new Date()): number {
    const diffTime = Math.abs(targetDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  }
}

export const distributionService = new DistributionService();