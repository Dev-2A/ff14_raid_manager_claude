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

export interface UserLogin {
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// 레이드 관련 타입
export interface Raid {
  id: number;
  name: string;
  tier: string;
  description?: string;
  total_floors: number;
  min_item_level?: number;
  is_active: boolean;
  created_at: string;
}

export interface RaidCreate {
  name: string;
  tier: string;
  description?: string;
  total_floors?: number;
  min_item_level?: number;
}

// 공대 관련 타입
export enum DistributionMethod {
  PRIORITY = "priority",
  FIRST_COME = "first_come"
}

export interface RaidGroup {
  id: number;
  name: string;
  raid_id: number;
  leader_id: number;
  distribution_method: DistributionMethod;
  target_item_level?: number;
  description?: string;
  is_active: boolean;
  is_recruiting: boolean;
  created_at: string;
  updated_at: string;
  raid?: Raid;
  leader?: User;
  member_count?: number;
}

export interface RaidGroupCreate {
  name: string;
  distribution_method?: DistributionMethod;
  target_item_level?: number;
  description?: string;
}

export interface RaidMember {
  id: number;
  raid_group_id: number;
  user_id: number;
  role?: string;
  job?: string;
  can_manage_schedule: boolean;
  can_manage_distribution: boolean;
  joined_at: string;
  user?: User;
}

// 장비 관련 타입
export enum EquipmentSlot {
  WEAPON = "weapon",
  HEAD = "head",
  BODY = "body",
  HANDS = "hands",
  LEGS = "legs",
  FEET = "feet",
  EARRINGS = "earrings",
  NECKLACE = "necklace",
  BRACELET = "bracelet",
  RING = "ring"
}

export enum EquipmentType {
  RAID_HERO = "raid_hero",
  RAID_NORMAL = "raid_normal",
  TOME = "tome",
  TOME_AUGMENTED = "tome_augmented",
  CRAFTED = "crafted",
  OTHER = "other"
}

export interface Equipment {
  id: number;
  name: string;
  slot: EquipmentSlot;
  equipment_type: EquipmentType;
  item_level: number;
  job_category?: string;
  raid_id?: number;
  source?: string;
  tome_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EquipmentSet {
  id: number;
  name: string;
  user_id: number;
  raid_group_id: number;
  is_starting_set: boolean;
  is_bis_set: boolean;
  is_current_set: boolean;
  total_item_level: number;
  created_at: string;
  updated_at: string;
  items?: EquipmentSetItem[];
}

export interface EquipmentSetItem {
  id: number;
  equipment_set_id: number;
  equipment_id: number;
  slot: EquipmentSlot;
  is_obtained: boolean;
  obtained_at?: string;
  created_at: string;
  equipment?: Equipment;
}

// 아이템 분배 관련 타입
export enum ItemType {
  EQUIPMENT_COFFER = "equipment_coffer",
  WEAPON_COFFER = "weapon_coffer",
  UPGRADE_ITEM = "upgrade_item",
  TOME_MATERIAL = "tome_material",
  TOKEN = "token",
  WEAPON_TOKEN = "weapon_token",
  MOUNT = "mount",
  OTHER = "other"
}

export interface ItemDistribution {
  id: number;
  raid_group_id: number;
  item_name: string;
  item_type: ItemType;
  floor_number: number;
  priority_order: number[];
  completed_users: number[];
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DistributionHistory {
  id: number;
  raid_group_id: number;
  user_id: number;
  distribution_id?: number;
  item_name: string;
  item_type: ItemType;
  floor_number?: number;
  week_number: number;
  distributed_at: string;
  notes?: string;
  user?: User;
}

export interface ResourceRequirement {
  id: number;
  user_id: number;
  raid_group_id: number;
  required_resources: Record<string, number>;
  obtained_resources: Record<string, number>;
  remaining_resources: Record<string, number>;
  completion_percentage: number;
  last_calculated_at: string;
}

// 일정 관련 타입
export enum AttendanceStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  DECLINED = "declined",
  TENTATIVE = "tentative"
}

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
  completion_notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  cancelled_at?: string;
  created_by?: User;
  attendances?: RaidAttendance[];
  confirmed_count?: number;
  declined_count?: number;
}

export interface RaidAttendance {
  id: number;
  schedule_id: number;
  user_id: number;
  status: AttendanceStatus;
  responded_at?: string;
  reason?: string;
  actually_attended?: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
}

// 일정 대시보드 타입
export interface ScheduleDashboard {
  upcoming_schedules: RaidSchedule[];
  past_schedules: RaidSchedule[];
  my_attendance_status: Record<number, AttendanceStatus>;
}

// API 응답 타입
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// 폼 데이터 타입
export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  character_name: string;
  server: string;
  job?: string;
}

// 유틸리티 타입
export type JobRole = "tank" | "healer" | "dps";

export interface Job {
  id: string;
  name: string;
  role: JobRole;
  icon?: string;
}

// 게임 서버 목록
export const GAME_SERVERS = [
  "카벙클",
  "초코보", 
  "모그리",
  "톤베리",
  "펜리르"
] as const;

export type GameServer = typeof GAME_SERVERS[number];

// 직업 목록
export const JOBS: Job[] = [
  // 탱커
  { id: "paladin", name: "나이트", role: "tank" },
  { id: "warrior", name: "전사", role: "tank" },
  { id: "darkknight", name: "암흑기사", role: "tank" },
  { id: "gunbreaker", name: "건브레이커", role: "tank" },
  
  // 힐러
  { id: "whitemage", name: "백마도사", role: "healer" },
  { id: "scholar", name: "학자", role: "healer" },
  { id: "astrologian", name: "점성술사", role: "healer" },
  { id: "sage", name: "현자", role: "healer" },
  
  // 근거리 DPS
  { id: "monk", name: "몽크", role: "dps" },
  { id: "dragoon", name: "용기사", role: "dps" },
  { id: "ninja", name: "닌자", role: "dps" },
  { id: "samurai", name: "사무라이", role: "dps" },
  { id: "reaper", name: "리퍼", role: "dps" },
  { id: "viper", name: "바이퍼", role: "dps" },
  
  // 원거리 물리 DPS
  { id: "bard", name: "음유시인", role: "dps" },
  { id: "machinist", name: "기공사", role: "dps" },
  { id: "dancer", name: "무도가", role: "dps" },
  
  // 원거리 마법 DPS
  { id: "blackmage", name: "흑마도사", role: "dps" },
  { id: "summoner", name: "소환사", role: "dps" },
  { id: "redmage", name: "적마도사", role: "dps" },
  { id: "pictomancer", name: "픽토맨서", role: "dps" }
];

// 장비 슬롯 한글명
export const EQUIPMENT_SLOT_NAMES: Record<EquipmentSlot, string> = {
  [EquipmentSlot.WEAPON]: "무기",
  [EquipmentSlot.HEAD]: "머리",
  [EquipmentSlot.BODY]: "상의",
  [EquipmentSlot.HANDS]: "장갑",
  [EquipmentSlot.LEGS]: "하의",
  [EquipmentSlot.FEET]: "신발",
  [EquipmentSlot.EARRINGS]: "귀걸이",
  [EquipmentSlot.NECKLACE]: "목걸이",
  [EquipmentSlot.BRACELET]: "팔찌",
  [EquipmentSlot.RING]: "반지"
};

// 장비 타입 한글명
export const EQUIPMENT_TYPE_NAMES: Record<EquipmentType, string> = {
  [EquipmentType.RAID_HERO]: "영웅 레이드",
  [EquipmentType.RAID_NORMAL]: "일반 레이드",
  [EquipmentType.TOME]: "석판",
  [EquipmentType.TOME_AUGMENTED]: "강화 석판",
  [EquipmentType.CRAFTED]: "제작",
  [EquipmentType.OTHER]: "기타"
};

// 아이템 타입 한글명
export const ITEM_TYPE_NAMES: Record<ItemType, string> = {
  [ItemType.EQUIPMENT_COFFER]: "장비 궤짝",
  [ItemType.WEAPON_COFFER]: "무기 궤짝",
  [ItemType.UPGRADE_ITEM]: "강화 재료",
  [ItemType.TOME_MATERIAL]: "석판 재료",
  [ItemType.TOKEN]: "토큰",
  [ItemType.WEAPON_TOKEN]: "무기 토큰",
  [ItemType.MOUNT]: "탈것",
  [ItemType.OTHER]: "기타"
};