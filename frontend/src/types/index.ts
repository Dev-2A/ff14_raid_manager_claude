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

export interface UserUpdate {
  username?: string;
  email?: string;
  character_name?: string;
  server?: string;
  job?: string;
  password?: string;  // 비밀번호 변경용
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

// 프로필 관련 추가 타입
export interface UserProfile extends User {
  raid_groups?: RaidGroup[];  // 소속된 공대 목록
  total_raids_completed?: number;  // 완료한 레이드 수
  main_role?: string;  // 주 역할 (탱커/힐러/딜러)
}

// 레이드 관련 타입
export enum DistributionMethod {
  PRIORITY = "priority",
  FIRST_COME = "first_come"
}

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

// ===== Create 타입들 =====
export interface RaidCreate {
  name: string;
  tier: string;
  description?: string;
  total_floors?: number;
  min_item_level?: number;
}

export interface RaidGroupCreate {
  name: string;
  distribution_method?: DistributionMethod;
  target_item_level?: number;
  description?: string;
}

export interface RaidMemberCreate {
  user_id: number;
  role?: string;
  job?: string;
}

// ===== Update 타입들 =====
export interface RaidUpdate {
  name?: string;
  tier?: string;
  description?: string;
  total_floors?: number;
  min_item_level?: number;
  is_active?: boolean;
}

export interface RaidGroupUpdate {
  name?: string;
  distribution_method?: DistributionMethod;
  target_item_level?: number;
  description?: string;
  is_active?: boolean;
  is_recruiting?: boolean;
}

export interface RaidMemberUpdate {
  role?: string;
  job?: string;
  can_manage_schedule?: boolean;
  can_manage_distribution?: boolean;
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

// ===== 장비 관련 Create/Update 타입들 =====
export interface EquipmentCreate {
  name: string;
  slot: EquipmentSlot;
  equipment_type: EquipmentType;
  item_level: number;
  job_category?: string;
  raid_id?: number;
  source?: string;
  tome_cost?: number;
}

export interface EquipmentUpdate {
  name?: string;
  item_level?: number;
  job_category?: string;
  source?: string;
  tome_cost?: number;
  is_active?: boolean;
}

export interface EquipmentSetCreate {
  name: string;
  raid_group_id: number;
  is_starting_set?: boolean;
  is_bis_set?: boolean;
  is_current_set?: boolean;
}

export interface EquipmentSetUpdate {
  name?: string;
  is_starting_set?: boolean;
  is_bis_set?: boolean;
  is_current_set?: boolean;
}

export interface EquipmentSetItemCreate {
  equipment_id: number;
  slot: EquipmentSlot;
}

export interface EquipmentSetItemUpdate {
  equipment_id?: number;
  is_obtained?: boolean;
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

// 재화 계산 결과 타입
export interface ResourceCalculationResult {
  user_id: number;
  raid_group_id: number;
  required_resources: Record<string, number>;
  
  // 상세 내역
  equipment_changes: Array<{
    slot: string;
    from: string;
    to: string;
    type: string;
  }>;
  upgrade_materials_needed: Record<string, number>;
  tome_cost_total: number;
  
  // 우선순위 정보 (우선순위 분배 방식인 경우)
  priority_rankings?: Record<string, number>;
}

// ===== 아이템 분배 관련 Create/Update 타입들 =====
export interface ItemDistributionCreate {
  item_name: string;
  item_type: ItemType;
  floor_number: number;
  priority_order?: number[];
  notes?: string;
}

export interface ItemDistributionUpdate {
  item_name?: string;
  priority_order?: number[];
  completed_users?: number[];
  notes?: string;
  is_active?: boolean;
}

export interface DistributionHistoryCreate {
  user_id: number;
  distribution_id?: number;
  item_name: string;
  item_type: ItemType;
  floor_number?: number;
  week_number: number;
  notes?: string;
}

export interface ResourceRequirementUpdate {
  obtained_resources?: Record<string, number>;
}

// 레이드 일정 관련 타입
export enum AttendanceStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  DECLINED = "declined",
  TENTATIVE = "tentative"
}

export enum RecurrenceType {
  NONE = "none",
  DAILY = "daily",
  WEEKLY = "weekly",
  BIWEEKLY = "biweekly",
  MONTHLY = "monthly"
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
  minimum_members: number;
  notes?: string;
  // 반복 설정 추가
  recurrence_type: RecurrenceType;
  recurrence_end_date?: string;
  recurrence_count?: number;
  recurrence_days?: string;
  parent_schedule_id?: number;
  is_confirmed: boolean;
  is_completed: boolean;
  is_cancelled: boolean;
  completion_notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  cancelled_at?: string;
  created_by?: User;
  attendances?: RaidAttendance[];
  confirmed_count?: number;
  declined_count?: number;
  is_recurring?: boolean;
}

// 일정 생성/수정을 위한 타입 추가
export interface RaidScheduleCreate {
  title: string;
  description?: string;
  scheduled_date: string;
  start_time: string;
  end_time?: string;
  target_floors?: string;
  minimum_members?: number;
  notes?: string;
  // 반복 설정
  recurrence_type: RecurrenceType;
  recurrence_end_date?: string;
  recurrence_count?: number;
  recurrence_days?: string;
}

export interface RaidScheduleUpdate {
  title?: string;
  description?: string;
  scheduled_date?: string;
  start_time?: string;
  end_time?: string;
  target_floors?: string;
  minimum_members?: number;
  notes?: string;
  is_confirmed?: boolean;
  is_completed?: boolean;
  is_cancelled?: boolean;
  completion_notes?: string;
}

// 반복 일정 삭제 옵션
export enum RecurringScheduleDeleteOption {
  THIS_ONLY = "this_only",
  THIS_AND_FUTURE = "this_and_future",
  ALL = "all"
}

// 요일 타입 (반복 일정용)
export interface WeekDay {
  value: number;  // 0: 일요일, 1: 월요일, ..., 6: 토요일
  label: string;
  short: string;
}

export const WEEKDAYS: WeekDay[] = [
  { value: 0, label: '일요일', short: '일' },
  { value: 1, label: '월요일', short: '월' },
  { value: 2, label: '화요일', short: '화' },
  { value: 3, label: '수요일', short: '수' },
  { value: 4, label: '목요일', short: '목' },
  { value: 5, label: '금요일', short: '금' },
  { value: 6, label: '토요일', short: '토' },
];

export interface RaidAttendance {
  id: number;
  schedule_id: number;
  user_id: number;
  status: AttendanceStatus;
  reason?: string;
  responded_at?: string;
  actually_attended?: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
}

// ===== 참석 관련 Create/Update 타입들 =====
export interface RaidAttendanceCreate {
  user_id: number;
  status?: AttendanceStatus;
  reason?: string;
}

export interface RaidAttendanceUpdate {
  status?: AttendanceStatus;
  reason?: string;
  actually_attended?: boolean;
}

// API 응답 타입
export interface ApiError {
  detail: string | Array<{
    type?: string;
    loc?: string[];
    msg?: string;
    input?: any;
    url?: string;
  }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// API 페이지네이션 타입 (필요한 경우)
export interface PaginationParams {
  skip?: number;
  limit?: number;
}

// 일정 대시보드용 타입
export interface ScheduleDashboard {
  upcoming_schedules: RaidSchedule[];
  past_schedules: RaidSchedule[];
  my_attendance_status: Record<number, AttendanceStatus>;  // schedule_id: status
}

// 참석률 통계 타입
export interface AttendanceStatistics {
  user_id: number;
  username: string;
  character_name: string;
  total_schedules: number;
  confirmed_count: number;
  actual_attendance: number;
  confirmation_rate: number;
  attendance_rate: number;
}