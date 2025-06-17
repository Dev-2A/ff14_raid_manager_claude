import api, { fileApi, createQueryParams } from './config';
import {
  User, UserCreate, UserLogin, Token,
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
    const response = await api.get(`/raids/groups/${groupId}`);
    return response.data;
  },

  // 공대 생성
  create: async (raidId: number, data: RaidGroupCreate): Promise<RaidGroup> => {
    const response = await api.post(`/raids/${raidId}/groups`, data);
    return response.data;
  },

  // 공대 수정
  update: async (groupId: number, data: Partial<RaidGroupCreate>): Promise<RaidGroup> => {
    const response = await api.put(`/raids/groups/${groupId}`, data);
    return response.data;
  },

  // 공대 삭제
  delete: async (groupId: number): Promise<void> => {
    await api.delete(`/raids/groups/${groupId}`);
  },

  // 내가 속한 공대 목록
  myGroups: async (): Promise<RaidGroup[]> => {
    const response = await api.get('/raids/my-groups');
    return response.data;
  },

  // 공대원 목록
  members: async (groupId: number): Promise<RaidMember[]> => {
    const response = await api.get(`/raids/groups/${groupId}/members`);
    return response.data;
  },

  // 공대원 추가
  addMember: async (groupId: number, data: {
    user_id: number;
    role?: string;
    job?: string;
  }): Promise<RaidMember> => {
    const response = await api.post(`/raids/groups/${groupId}/members`, data);
    return response.data;
  },

  // 공대원 수정
  updateMember: async (groupId: number, memberId: number, data: {
    role?: string;
    job?: string;
    can_manage_schedule?: boolean;
    can_manage_distribution?: boolean;
  }): Promise<RaidMember> => {
    const response = await api.put(`/raids/groups/${groupId}/members/${memberId}`, data);
    return response.data;
  },

  // 공대원 제거
  removeMember: async (groupId: number, memberId: number): Promise<void> => {
    await api.delete(`/raids/groups/${groupId}/members/${memberId}`);
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
    is_active?: boolean;
  }): Promise<Equipment[]> => {
    const response = await api.get(`/equipment`, { params });
    return response.data;
  },

  // 장비 상세
  get: async (id: number): Promise<Equipment> => {
    const response = await api.get(`/equipment/${id}`);
    return response.data;
  },

  // 장비 생성 (관리자)
  create: async (data: Partial<Equipment>): Promise<Equipment> => {
    const response = await api.post('/equipment', data);
    return response.data;
  },

  // 장비 수정 (관리자)
  update: async (id: number, data: Partial<Equipment>): Promise<Equipment> => {
    const response = await api.put(`/equipment/${id}`, data);
    return response.data;
  },
  
  // 장비 삭제 (관리자)
  delete: async (id: number): Promise<void> => {
    await api.delete(`/equipment/${id}`);
  },
};

// 장비 세트 API
export const equipmentSetApi = {
  // 내 장비 세트 목록
  mySets: async (raid_group_id?: number): Promise<EquipmentSet[]> => {
    const params = raid_group_id ? { raid_group_id } : undefined;
    const response = await api.get('/equipment/sets/my-sets', { params });
    return response.data;
  },
  
  // 장비 세트 상세
  get: async (setId: number): Promise<EquipmentSet> => {
    const response = await api.get(`/equipment/sets/${setId}`);
    return response.data;
  },
  
  // 장비 세트 생성
  create: async (data: {
    name: string;
    raid_group_id: number;
    is_starting_set?: boolean;
    is_bis_set?: boolean;
    is_current_set?: boolean;
  }): Promise<EquipmentSet> => {
    const response = await api.post('/equipment/sets', data);
    return response.data;
  },
  
  // 장비 세트 수정
  update: async (setId: number, data: Partial<EquipmentSet>): Promise<EquipmentSet> => {
    const response = await api.put(`/equipment/sets/${setId}`, data);
    return response.data;
  },
  
  // 장비 세트 삭제
  delete: async (setId: number): Promise<void> => {
    await api.delete(`/equipment/sets/${setId}`);
  },
  
  // 세트에 아이템 추가
  addItem: async (setId: number, data: {
    equipment_id: number;
    slot: string;
  }): Promise<EquipmentSetItem> => {
    const response = await api.post(`/equipment/sets/${setId}/items`, data);
    return response.data;
  },
  
  // 세트 아이템 수정
  updateItem: async (setId: number, itemId: number, data: {
    is_obtained?: boolean;
  }): Promise<EquipmentSetItem> => {
    const response = await api.put(`/equipment/sets/${setId}/items/${itemId}`, data);
    return response.data;
  },
  
  // 세트에서 아이템 제거
  removeItem: async (setId: number, itemId: number): Promise<void> => {
    await api.delete(`/equipment/sets/${setId}/items/${itemId}`);
  },
};

// 분배 API
export const distributionApi = {
  // 분배 규칙 목록
  rules: async (groupId: number, params?: {
    floor_number?: number;
    item_type?: string;
    is_active?: boolean;
  }): Promise<ItemDistribution[]> => {
    const response = await api.get(`/distribution/groups/${groupId}/rules`, { params });
    return response.data;
  },
  
  // 분배 규칙 생성
  createRule: async (groupId: number, data: {
    item_name: string;
    item_type: string;
    floor_number: number;
    priority_order?: number[];
    notes?: string;
  }): Promise<ItemDistribution> => {
    const response = await api.post(`/distribution/groups/${groupId}/rules`, data);
    return response.data;
  },
  
  // 분배 규칙 수정
  updateRule: async (groupId: number, ruleId: number, data: Partial<ItemDistribution>): Promise<ItemDistribution> => {
    const response = await api.put(`/distribution/groups/${groupId}/rules/${ruleId}`, data);
    return response.data;
  },
  
  // 분배 규칙 삭제
  deleteRule: async (groupId: number, ruleId: number): Promise<void> => {
    await api.delete(`/distribution/groups/${groupId}/rules/${ruleId}`);
  },
  
  // 분배 이력 목록
  history: async (groupId: number, params?: {
    week_number?: number;
    user_id?: number;
    item_type?: string;
    skip?: number;
    limit?: number;
  }): Promise<DistributionHistory[]> => {
    const response = await api.get(`/distribution/groups/${groupId}/history`, { params });
    return response.data;
  },
  
  // 분배 기록
  recordDistribution: async (groupId: number, data: {
    user_id: number;
    distribution_id?: number;
    item_name: string;
    item_type: string;
    floor_number?: number;
    week_number: number;
    notes?: string;
  }): Promise<DistributionHistory> => {
    const response = await api.post(`/distribution/groups/${groupId}/history`, data);
    return response.data;
  },
  
  // 분배 이력 삭제
  deleteHistory: async (groupId: number, historyId: number): Promise<void> => {
    await api.delete(`/distribution/groups/${groupId}/history/${historyId}`);
  },
  
  // 재화 요구량 목록
  resources: async (groupId: number): Promise<ResourceRequirement[]> => {
    const response = await api.get(`/distribution/groups/${groupId}/resources`);
    return response.data;
  },
  
  // 내 재화 요구량
  myResource: async (groupId: number): Promise<ResourceRequirement> => {
    const response = await api.get(`/distribution/groups/${groupId}/resources/me`);
    return response.data;
  },
  
  // 재화 계산
  calculateResource: async (groupId: number): Promise<any> => {
    const response = await api.post(`/distribution/groups/${groupId}/resources/calculate`);
    return response.data;
  },
  
  // 획득 재화 업데이트
  updateResource: async (groupId: number, data: {
    obtained_resources: Record<string, number>;
  }): Promise<ResourceRequirement> => {
    const response = await api.put(`/distribution/groups/${groupId}/resources/update`, data);
    return response.data;
  },
  
  // 우선순위 자동 계산
  calculatePriority: async (groupId: number): Promise<any> => {
    const response = await api.post(`/distribution/groups/${groupId}/calculate-priority`);
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
  
  // 일정 상세
  get: async (groupId: number, scheduleId: number): Promise<RaidSchedule> => {
    const response = await api.get(`/schedules/groups/${groupId}/schedules/${scheduleId}`);
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
  
  // 대시보드
  dashboard: async (params?: {
    raid_group_id?: number;
    days_ahead?: number;
    days_behind?: number;
  }): Promise<any> => {
    const response = await api.get('/schedules/dashboard', { params });
    return response.data;
  },
  
  // 참석 현황
  attendance: async (groupId: number, scheduleId: number): Promise<RaidAttendance[]> => {
    const response = await api.get(`/schedules/groups/${groupId}/schedules/${scheduleId}/attendance`);
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
  
  // 멤버 참석 여부 업데이트
  updateMemberAttendance: async (groupId: number, scheduleId: number, userId: number, data: {
    status?: string;
    reason?: string;
    actually_attended?: boolean;
  }): Promise<RaidAttendance> => {
    const response = await api.put(`/schedules/groups/${groupId}/schedules/${scheduleId}/attendance/${userId}`, data);
    return response.data;
  },
  
  // 출석 통계
  attendanceStats: async (groupId: number, params?: {
    from_date?: string;
    to_date?: string;
  }): Promise<any> => {
    const response = await api.get(`/schedules/groups/${groupId}/attendance-stats`, { params });
    return response.data;
  },
};