import api, { fileApi, createQueryParams } from './config';
import {
  User, UserCreate, UserLogin, UserUpdate, Token,
  Raid, RaidCreate,
  RaidGroup, RaidGroupCreate,
  RaidMember,
  Equipment, EquipmentSet, EquipmentSetItem,
  ItemDistribution, DistributionHistory, ResourceRequirement,
  RaidSchedule, RaidAttendance,
  PaginatedResponse
} from '../types';

// 인증 API
export const authApi = {
  // 로그인
  login: async (credentials: UserLogin): Promise<Token> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  // 회원가입
  register: async (userData: UserCreate): Promise<User> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // 내 정보 조회
  me: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // 프로필 업데이트
  updateProfile: async (userData: UserUpdate): Promise<User> => {
    const response = await api.put('/auth/me', userData);
    return response.data;
  },

  // 비밀번호 변경
  changePassword: async (passwords: {
    current_password: string;
    new_password: string;
  }): Promise<{ message: string }> => {
    const response = await api.post('/auth/change-password', passwords);
    return response.data;
  },

  // 토큰 갱신
  refresh: async (): Promise<Token> => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
};

// 레이드 API
export const raidApi = {
  // 레이드 목록
  list: async (params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  }): Promise<Raid[]> => {
    const response = await api.get('/raids', { params });
    return response.data;
  },

  // 레이드 상세
  get: async (id: number): Promise<Raid> => {
    const response = await api.get(`/raids/${id}`);
    return response.data;
  },

  // 레이드 생성 (관리자)
  create: async (data: RaidCreate): Promise<Raid> => {
    const response = await api.post('/raids', data);
    return response.data;
  },

  // 레이드 수정 (관리자)
  update: async (id: number, data: Partial<RaidCreate>): Promise<Raid> => {
    const response = await api.put(`/raids/${id}`, data);
    return response.data;
  },
};

// 공대 API
export const raidGroupApi = {
  // 특정 레이드의 공대 목록
  list: async (raidId: number, params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
    is_recruiting?: boolean;
  }): Promise<RaidGroup[]> => {
    const response = await api.get(`/raids/${raidId}/groups`, { params });
    return response.data;
  },

  // 공대 상세
  get: async (groupId: number): Promise<RaidGroup> => {
    const response = await api.get(`/raid-groups/${groupId}`);
    return response.data;
  },

  // 공대 생성
  create: async (raidId: number, data: RaidGroupCreate): Promise<RaidGroup> => {
    const response = await api.post(`/raids/${raidId}/groups`, data);
    return response.data;
  },

  // 공대 수정 (공대장)
  update: async (groupId: number, data: Partial<RaidGroupCreate>): Promise<RaidGroup> => {
    const response = await api.put(`/raid-groups/${groupId}`, data);
    return response.data;
  },

  // 공대 삭제 (공대장)
  delete: async (groupId: number): Promise<void> => {
    await api.delete(`/raid-groups/${groupId}`);
  },

  // 내가 속한 공대 목록
  myGroups: async (): Promise<RaidGroup[]> => {
    const response = await api.get('/raid-groups/my-groups');
    return response.data;
  },

  // 공대 멤버 목록
  getMembers: async (groupId: number): Promise<RaidMember[]> => {
    const response = await api.get(`/raid-groups/${groupId}/members`);
    return response.data;
  },

  // members 별칭 추가 (하위 호환성)
  members: async (groupId: number): Promise<RaidMember[]> => {
    return raidGroupApi.getMembers(groupId);
  },

  // 공대 가입 신청
  join: async (groupId: number): Promise<RaidMember> => {
    const response = await api.post(`/raid-groups/${groupId}/join`);
    return response.data;
  },

  // 공대 탈퇴
  leave: async (groupId: number): Promise<void> => {
    await api.post(`/raid-groups/${groupId}/leave`);
  },

  // 멤버 승인 (공대장)
  approveMember: async (groupId: number, memberId: number): Promise<RaidMember> => {
    const response = await api.post(`/raid-groups/${groupId}/members/${memberId}/approve`);
    return response.data;
  },

  // 멤버 거절 (공대장)
  rejectMember: async (groupId: number, memberId: number): Promise<void> => {
    await api.post(`/raid-groups/${groupId}/members/${memberId}/reject`);
  },

  // 멤버 추방 (공대장)
  kickMember: async (groupId: number, memberId: number): Promise<void> => {
    await api.delete(`/raid-groups/${groupId}/members/${memberId}`);
  },
};

// 장비 API
export const equipmentApi = {
  // 장비 목록
  list: async (params?: {
    skip?: number;
    limit?: number;
    slot?: string;
    equipment_type?: string;
    item_level?: number;
    raid_id?: number;
  }): Promise<Equipment[]> => {
    const response = await api.get('/equipment', { params });
    return response.data;
  },

  // 장비 상세
  get: async (id: number): Promise<Equipment> => {
    const response = await api.get(`/equipment/${id}`);
    return response.data;
  },

  // 내 장비 세트 목록
  getMySets: async (raidGroupId?: number): Promise<EquipmentSet[]> => {
    const params = raidGroupId ? { raid_group_id: raidGroupId } : {};
    const response = await api.get('/equipment/sets/my-sets', { params });
    return response.data;
  },

  // 장비 세트 생성
  createSet: async (data: {
    name: string;
    raid_group_id?: number;
    description?: string;
  }): Promise<EquipmentSet> => {
    const response = await api.post('/equipment/sets', data);
    return response.data;
  },

  // 장비 세트 아이템 추가
  addSetItem: async (setId: number, data: {
    equipment_id: number;
    slot: string;
  }): Promise<EquipmentSetItem> => {
    const response = await api.post(`/equipment/sets/${setId}/items`, data);
    return response.data;
  },

  // 장비 세트 아이템 제거
  removeSetItem: async (setId: number, itemId: number): Promise<void> => {
    await api.delete(`/equipment/sets/${setId}/items/${itemId}`);
  },
};

// 분배 API
export const distributionApi = {
  // 분배 규칙 목록
  getRules: async (groupId: number, params?: {
    floor_number?: number;
    item_type?: string;
  }): Promise<ItemDistribution[]> => {
    const response = await api.get(`/distribution/groups/${groupId}/rules`, { params });
    return response.data;
  },

  // 분배 규칙 생성
  createRule: async (groupId: number, data: {
    raid_id: number;
    floor_number: number;
    item_type: string;
    priority_order: number[];
  }): Promise<ItemDistribution> => {
    const response = await api.post(`/distribution/groups/${groupId}/rules`, data);
    return response.data;
  },

  // 분배 기록
  getHistory: async (groupId: number, params?: {
    skip?: number;
    limit?: number;
    user_id?: number;
    floor_number?: number;
  }): Promise<PaginatedResponse<DistributionHistory>> => {
    const queryString = createQueryParams(params);
    const response = await api.get(`/distribution/groups/${groupId}/history${queryString}`);
    return response.data;
  },

  // history 별칭 추가 (하위 호환성)
  history: async (groupId: number, params?: {
    week_number?: number;
    user_id?: number;
    item_type?: string;
  }): Promise<DistributionHistory[]> => {
    const response = await api.get(`/distribution/groups/${groupId}/history`, { params });
    return response.data;
  },

  // rules 별칭 추가 (하위 호환성)
  rules: async (groupId: number, params?: {
    floor_number?: number;
    item_type?: string;
    is_active?: boolean;
  }): Promise<ItemDistribution[]> => {
    const response = await api.get(`/distribution/groups/${groupId}/rules`, { params });
    return response.data;
  },

  // 자원 요구사항
  getRequirements: async (groupId: number, userId?: number): Promise<ResourceRequirement[]> => {
    const params = userId ? { user_id: userId } : {};
    const response = await api.get(`/distribution/groups/${groupId}/requirements`, { params });
    return response.data;
  },

  // 자원 계산
  calculateResources: async (groupId: number): Promise<{
    total_required: { [key: string]: number };
    user_requirements: { [userId: string]: { [key: string]: number } };
  }> => {
    const response = await api.get(`/distribution/groups/${groupId}/calculate`);
    return response.data;
  },
};

// 일정 API
export const scheduleApi = {
  // 일정 목록
  list: async (groupId: number, params?: {
    from_date?: string;
    to_date?: string;
    is_confirmed?: boolean;
    is_completed?: boolean;
    is_cancelled?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<RaidSchedule[]> => {
    const response = await api.get(`/schedules/groups/${groupId}/schedules`, { params });
    return response.data;
  },

  // 일정 생성
  create: async (groupId: number, data: {
    title: string;
    description?: string;
    scheduled_date: string;
    start_time: string;
    end_time?: string;
    target_floors?: string;
    minimum_members?: number;
    notes?: string;
  }): Promise<RaidSchedule> => {
    const response = await api.post(`/schedules/groups/${groupId}/schedules`, data);
    return response.data;
  },

  // 일정 수정
  update: async (groupId: number, scheduleId: number, data: Partial<RaidSchedule>): Promise<RaidSchedule> => {
    const response = await api.put(`/schedules/groups/${groupId}/schedules/${scheduleId}`, data);
    return response.data;
  },

  // 일정 삭제
  delete: async (groupId: number, scheduleId: number): Promise<void> => {
    await api.delete(`/schedules/groups/${groupId}/schedules/${scheduleId}`);
  },

  // 출석 상태 업데이트
  updateAttendance: async (scheduleId: number, status: string): Promise<RaidAttendance> => {
    const response = await api.post(`/schedules/${scheduleId}/attendance`, { status });
    return response.data;
  },

  // 내 참석 여부 업데이트
  updateMyAttendance: async (groupId: number, scheduleId: number, data: {
    status: string;
    reason?: string;
  }): Promise<RaidAttendance> => {
    const response = await api.put(`/schedules/groups/${groupId}/schedules/${scheduleId}/attendance/me`, data);
    return response.data;
  },

  // 출석 현황 조회
  getAttendance: async (scheduleId: number): Promise<RaidAttendance[]> => {
    const response = await api.get(`/schedules/${scheduleId}/attendance`);
    return response.data;
  },
};