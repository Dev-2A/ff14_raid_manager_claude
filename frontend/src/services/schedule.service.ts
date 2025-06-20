import { apiClient } from './api';
import {
  RaidSchedule, RaidAttendance, ScheduleDashboard,
  RaidScheduleCreate, RaidScheduleUpdate,
  RaidAttendanceUpdate, AttendanceStatus,
  RecurrenceType, RecurringScheduleDeleteOption,
  AttendanceStatistics
} from '../types';

class ScheduleService {
  // ===== 레이드 일정 관리 =====
  
  // 일정 목록 조회
  async getRaidSchedules(groupId: number, params?: {
    from_date?: string;
    to_date?: string;
    is_confirmed?: boolean;
    is_completed?: boolean;
    is_cancelled?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<RaidSchedule[]> {
    return apiClient.get<RaidSchedule[]>(`/schedules/groups/${groupId}/schedules`, params);
  }

  // 특정 일정 조회
  async getRaidSchedule(groupId: number, scheduleId: number): Promise<RaidSchedule> {
    return apiClient.get<RaidSchedule>(`/schedules/groups/${groupId}/schedules/${scheduleId}`);
  }

  // 일정 생성 (반복 설정 포함)
  async createRaidSchedule(
    groupId: number,
    scheduleData: RaidScheduleCreate
  ): Promise<RaidSchedule> {
    return apiClient.post<RaidSchedule>(`/schedules/groups/${groupId}/schedules`, scheduleData);
  }

  // 일정 수정
  async updateRaidSchedule(
    groupId: number,
    scheduleId: number,
    scheduleData: RaidScheduleUpdate
  ): Promise<RaidSchedule> {
    return apiClient.put<RaidSchedule>(
      `/schedules/groups/${groupId}/schedules/${scheduleId}`,
      scheduleData
    );
  }

  // 일정 삭제
  async deleteRaidSchedule(
    groupId: number,
    scheduleId: number,
    deleteOption?: RecurringScheduleDeleteOption
  ): Promise<{ message: string }> {
    const params = deleteOption ? { delete_option: deleteOption } : undefined;
    return apiClient.delete(`/schedules/groups/${groupId}/schedules/${scheduleId}`, params);
  }

  // ===== 참석 관리 =====
  
  // 일정 참석 현황 조회
  async getScheduleAttendance(
    groupId: number,
    scheduleId: number
  ): Promise<RaidAttendance[]> {
    return apiClient.get<RaidAttendance[]>(
      `/schedules/groups/${groupId}/schedules/${scheduleId}/attendance`
    );
  }

  // 내 참석 여부 업데이트
  async updateMyAttendance(
    groupId: number,
    scheduleId: number,
    attendanceData: RaidAttendanceUpdate
  ): Promise<RaidAttendance> {
    return apiClient.put<RaidAttendance>(
      `/schedules/groups/${groupId}/schedules/${scheduleId}/attendance/me`,
      attendanceData
    );
  }

  // 멤버 참석 여부 업데이트 (공대장/일정 권한자)
  async updateMemberAttendance(
    groupId: number,
    scheduleId: number,
    userId: number,
    attendanceData: RaidAttendanceUpdate
  ): Promise<RaidAttendance> {
    return apiClient.put<RaidAttendance>(
      `/schedules/groups/${groupId}/schedules/${scheduleId}/attendance/${userId}`,
      attendanceData
    );
  }

  // ===== 대시보드 & 통계 =====
  
  // 일정 대시보드
  async getScheduleDashboard(params?: {
    raid_group_id?: number;
    days_ahead?: number;
    days_behind?: number;
  }): Promise<ScheduleDashboard> {
    return apiClient.get<ScheduleDashboard>('/schedules/dashboard', params);
  }

  // 공대원 참석률 통계
  async getAttendanceStatistics(groupId: number, params?: {
    from_date?: string;
    to_date?: string;
  }): Promise<{ statistics: AttendanceStatistics[] }> {
    return apiClient.get(`/schedules/groups/${groupId}/attendance-stats`, params);
  }

  // ===== 유틸리티 함수 =====
  
  // 참석 상태 한글 이름 변환
  getAttendanceStatusName(status: AttendanceStatus): string {
    const statusNames: Record<AttendanceStatus, string> = {
      [AttendanceStatus.PENDING]: '미응답',
      [AttendanceStatus.CONFIRMED]: '참석',
      [AttendanceStatus.DECLINED]: '불참',
      [AttendanceStatus.TENTATIVE]: '미정'
    };
    return statusNames[status] || status;
  }

  // 참석 상태별 색상 클래스
  getAttendanceStatusColorClass(status: AttendanceStatus): string {
    const colorClasses: Record<AttendanceStatus, string> = {
      [AttendanceStatus.PENDING]: 'text-gray-400',
      [AttendanceStatus.CONFIRMED]: 'text-green-400',
      [AttendanceStatus.DECLINED]: 'text-red-400',
      [AttendanceStatus.TENTATIVE]: 'text-yellow-400'
    };
    return colorClasses[status] || 'text-gray-400';
  }

  // 반복 유형 한글 이름 변환
  getRecurrenceTypeName(type: RecurrenceType): string {
    const typeNames: Record<RecurrenceType, string> = {
      [RecurrenceType.NONE]: '반복 없음',
      [RecurrenceType.DAILY]: '매일',
      [RecurrenceType.WEEKLY]: '매주',
      [RecurrenceType.BIWEEKLY]: '격주',
      [RecurrenceType.MONTHLY]: '매월'
    };
    return typeNames[type] || type;
  }

  // 요일 문자열을 배열로 변환
  parseRecurrenceDays(days: string): number[] {
    if (!days) return [];
    return days.split(',').map(d => parseInt(d, 10));
  }

  // 요일 배열을 문자열로 변환
  formatRecurrenceDays(days: number[]): string {
    return days.join(',');
  }

  // 날짜/시간 포맷팅
  formatScheduleDateTime(date: string, time: string): string {
    const d = new Date(`${date}T${time}`);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    return d.toLocaleString('ko-KR', options);
  }

  // 일정까지 남은 시간 계산
  getTimeUntilSchedule(date: string, time: string): string {
    const scheduleDate = new Date(`${date}T${time}`);
    const now = new Date();
    const diff = scheduleDate.getTime() - now.getTime();

    if (diff < 0) {
      return '일정 종료';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}일 ${hours}시간 후`;
    } else if (hours > 0) {
      return `${hours}시간 ${minutes}분 후`;
    } else {
      return `${minutes}분 후`;
    }
  }

  // 참석 가능 인원 계산
  calculateAvailableMembers(attendances: RaidAttendance[]): {
    confirmed: number;
    declined: number;
    tentative: number;
    pending: number;
    total: number;
  } {
    const counts = {
      confirmed: 0,
      declined: 0,
      tentative: 0,
      pending: 0,
      total: attendances.length
    };

    attendances.forEach(attendance => {
      switch (attendance.status) {
        case AttendanceStatus.CONFIRMED:
          counts.confirmed++;
          break;
        case AttendanceStatus.DECLINED:
          counts.declined++;
          break;
        case AttendanceStatus.TENTATIVE:
          counts.tentative++;
          break;
        case AttendanceStatus.PENDING:
          counts.pending++;
          break;
      }
    });

    return counts;
  }
}

export const scheduleService = new ScheduleService();