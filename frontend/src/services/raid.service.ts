import { apiClient } from './api';
import { 
  Raid, RaidGroup, RaidMember, 
  RaidCreate, RaidGroupCreate, RaidMemberCreate,
  RaidUpdate, RaidGroupUpdate, RaidMemberUpdate 
} from '../types';

class RaidService {
  // ===== 레이드 관리 =====
  
  // 레이드 목록 조회
  async getRaids(params?: { is_active?: boolean }): Promise<Raid[]> {
    return apiClient.get<Raid[]>('/raids', params);
  }

  // 특정 레이드 조회
  async getRaid(raidId: number): Promise<Raid> {
    return apiClient.get<Raid>(`/raids/${raidId}`);
  }

  // 레이드 생성 (관리자)
  async createRaid(raidData: RaidCreate): Promise<Raid> {
    return apiClient.post<Raid>('/raids', raidData);
  }

  // 레이드 수정 (관리자)
  async updateRaid(raidId: number, raidData: RaidUpdate): Promise<Raid> {
    return apiClient.put<Raid>(`/raids/${raidId}`, raidData);
  }

  // ===== 공대 관리 =====
  
  // 특정 레이드의 공대 목록
  async getRaidGroups(raidId: number, params?: { 
    is_active?: boolean; 
    is_recruiting?: boolean 
  }): Promise<RaidGroup[]> {
    return apiClient.get<RaidGroup[]>(`/raids/${raidId}/groups`, params);
  }

  // 공대 상세 조회
  async getRaidGroup(groupId: number): Promise<RaidGroup> {
    return apiClient.get<RaidGroup>(`/raids/groups/${groupId}`);
  }

  // 공대 생성
  async createRaidGroup(raidId: number, groupData: RaidGroupCreate): Promise<RaidGroup> {
    return apiClient.post<RaidGroup>(`/raids/${raidId}/groups`, groupData);
  }

  // 공대 수정 (공대장)
  async updateRaidGroup(groupId: number, groupData: RaidGroupUpdate): Promise<RaidGroup> {
    return apiClient.put<RaidGroup>(`/raids/groups/${groupId}`, groupData);
  }

  // 공대 삭제 (공대장)
  async deleteRaidGroup(groupId: number): Promise<{ message: string }> {
    return apiClient.delete(`/raids/groups/${groupId}`);
  }

  // 내가 속한 공대 목록
  async getMyRaidGroups(): Promise<RaidGroup[]> {
    return apiClient.get<RaidGroup[]>('/raids/my-groups');
  }

  // ===== 공대원 관리 =====
  
  // 공대원 목록 조회
  async getRaidMembers(groupId: number): Promise<RaidMember[]> {
    return apiClient.get<RaidMember[]>(`/raids/groups/${groupId}/members`);
  }

  // 공대원 추가 (공대장)
  async addRaidMember(groupId: number, memberData: RaidMemberCreate): Promise<RaidMember> {
    return apiClient.post<RaidMember>(`/raids/groups/${groupId}/members`, memberData);
  }

  // 공대원 정보 수정 (공대장)
  async updateRaidMember(
    groupId: number, 
    memberId: number, 
    memberData: RaidMemberUpdate
  ): Promise<RaidMember> {
    return apiClient.put<RaidMember>(
      `/raids/groups/${groupId}/members/${memberId}`, 
      memberData
    );
  }

  // 공대원 제거 또는 탈퇴
  async removeRaidMember(groupId: number, memberId: number): Promise<{ message: string }> {
    return apiClient.delete(`/raids/groups/${groupId}/members/${memberId}`);
  }
}

export const raidService = new RaidService();