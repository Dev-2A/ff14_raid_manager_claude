// 사용자 관련 타입
export interface User {
  id: number;
  username: string;
  email: string;
  character_name: string;
  server: string;
  job?: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  character_name: string;
  server: string;
  job?: string;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  character_name?: string;
  server?: string;
  job?: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// 게임 서버 목록
export const GAME_SERVERS = [
  '초코보',
  '카벙클',
  '모그리',
  '톤베리',
  '펜리르'
] as const;

// 직업 목록
export const JOBS = {
  // 탱커
  TANK: [
    { value: 'PLD', label: '나이트' },
    { value: 'WAR', label: '전사' },
    { value: 'DRK', label: '암흑기사' },
    { value: 'GNB', label: '건브레이커' }
  ],
  // 힐러
  HEALER: [
    { value: 'WHM', label: '백마도사' },
    { value: 'SCH', label: '학자' },
    { value: 'AST', label: '점성술사' },
    { value: 'SGE', label: '현자' }
  ],
  // 근거리 DPS
  MELEE_DPS: [
    { value: 'MNK', label: '몽크' },
    { value: 'DRG', label: '용기사' },
    { value: 'NIN', label: '닌자' },
    { value: 'SAM', label: '사무라이' },
    { value: 'RPR', label: '리퍼' },
    { value: 'VPR', label: '바이퍼' }
  ],
  // 원거리 물리 DPS
  RANGED_DPS: [
    { value: 'BRD', label: '음유시인' },
    { value: 'MCH', label: '기공사' },
    { value: 'DNC', label: '무도가' }
  ],
  // 원거리 마법 DPS
  CASTER_DPS: [
    { value: 'BLM', label: '흑마도사' },
    { value: 'SMN', label: '소환사' },
    { value: 'RDM', label: '적마도사' },
    { value: 'PCT', label: '픽토맨서' }
  ]
} as const;

// 레이드 관련 타입
export interface Raid {
  id: number;
  name: string;
  description?: string;
  min_item_level: number;
  max_item_level: number;
  release_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RaidCreate {
  name: string;
  description?: string;
  min_item_level: number;
  max_item_level: number;
  release_date: string;
}

// 공대 관련 타입
export interface RaidGroup {
  id: number;
  raid_id: number;
  name: string;
  description?: string;
  leader_id: number;
  max_members: number;
  is_recruiting: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  raid?: Raid;
  leader?: User;
  members?: RaidMember[];
  member_count?: number;
}

export interface RaidGroupCreate {
  name: string;
  description?: string;
  max_members?: number;
  is_recruiting?: boolean;
}

export interface RaidMember {
  id: number;
  raid_group_id: number;
  user_id: number;
  role: MemberRole;
  is_active: boolean;
  joined_at: string;
  user?: User;
  raid_group?: RaidGroup;
}

export enum MemberRole {
  LEADER = 'leader',
  OFFICER = 'officer',
  MEMBER = 'member',
  PENDING = 'pending'
}

// 장비 관련 타입
export interface Equipment {
  id: number;
  raid_id: number;
  name: string;
  slot: EquipmentSlot;
  equipment_type: EquipmentType;
  item_level: number;
  main_stat?: string;
  sub_stats?: string[];
  special_effect?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  raid?: Raid;
}

export enum EquipmentSlot {
  WEAPON = 'weapon',
  HEAD = 'head',
  BODY = 'body',
  HANDS = 'hands',
  LEGS = 'legs',
  FEET = 'feet',
  EARRINGS = 'earrings',
  NECKLACE = 'necklace',
  BRACELETS = 'bracelets',
  RING = 'ring'
}

export enum EquipmentType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  ACCESSORY = 'accessory'
}

export interface EquipmentSet {
  id: number;
  user_id: number;
  raid_group_id?: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  items?: EquipmentSetItem[];
}

export interface EquipmentSetItem {
  id: number;
  equipment_set_id: number;
  equipment_id: number;
  slot: EquipmentSlot;
  created_at: string;
  equipment?: Equipment;
}

// 분배 관련 타입
export interface ItemDistribution {
  id: number;
  raid_group_id: number;
  raid_id: number;
  floor_number: number;
  item_type: ItemType;
  priority_order: number[];
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export enum ItemType {
  EQUIPMENT = 'equipment',
  MOUNT = 'mount',
  MATERIAL = 'material',
  TOKEN = 'token',
  OTHER = 'other'
}

export interface DistributionHistory {
  id: number;
  raid_group_id: number;
  user_id: number;
  item_name: string;
  item_type: ItemType;
  floor_number: number;
  distributed_at: string;
  notes?: string;
  created_at: string;
  user?: User;
}

export interface ResourceRequirement {
  id: number;
  raid_group_id: number;
  user_id: number;
  resource_type: string;
  amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

// 일정 관련 타입
export interface RaidSchedule {
  id: number;
  raid_group_id: number;
  created_by_id: number;
  title: string;
  description?: string;
  scheduled_date: string;
  start_time: string;
  end_time?: string;
  target_floors?: string;
  is_confirmed: boolean;
  is_completed: boolean;
  is_cancelled: boolean;
  minimum_members: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: User;
  attendances?: RaidAttendance[];
  confirmed_count?: number;
  declined_count?: number;
}

export enum RepeatType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly'
}

export interface RaidAttendance {
  id: number;
  schedule_id: number;
  user_id: number;
  status: AttendanceStatus;
  notes?: string;
  responded_at: string;
  created_at: string;
  updated_at: string;
  user?: User;
  schedule?: RaidSchedule;
}

export enum AttendanceStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DECLINED = 'declined',
  TENTATIVE = 'tentative'
}

// 페이지네이션
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

// API 에러
export interface ApiError {
  detail: string;
  status_code?: number;
  validation_errors?: any;
}

// 아이템 타입 한글명
export const ITEM_TYPE_NAMES: Record<ItemType, string> = {
  [ItemType.EQUIPMENT]: '장비',
  [ItemType.MOUNT]: '탈것',
  [ItemType.MATERIAL]: '재료',
  [ItemType.TOKEN]: '토큰',
  [ItemType.OTHER]: '기타'
};