import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, usePermission } from "../../contexts/AuthContext";
import { raidGroupApi, scheduleApi } from "../../api/endpoints";
import {
  RaidSchedule, RaidGroup, AttendanceStatus, RaidAttendance
} from "../../types";
import { PageLoading } from "../../components/Common/LoadingScreen";
import { 
  Calendar, Plus, Edit2, Trash2, Users, Clock,
  Check, X, AlertCircle, ChevronRight, Target,
  CalendarDays, MapPin, Info, UserCheck, UserX,
  Filter, Search, Settings, Loader2
} from 'lucide-react';
import { formatDate, formatTime } from "../../api/config";

// 참석 상태 한글명
const ATTENDANCE_STATUS_NAMES: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PENDING]: "미정",
  [AttendanceStatus.CONFIRMED]: "참석",
  [AttendanceStatus.DECLINED]: "불참",
  [AttendanceStatus.TENTATIVE]: "미확정"
};

const Schedule: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isRaidLeader } = usePermission();

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<RaidSchedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showPastSchedules, setShowPastSchedules] = useState(false);

  // 내 공대 목록 조회
  const { data: myGroups } = useQuery({
    queryKey: ['myRaidGroups'],
    queryFn: () => raidGroupApi.myGroups()
  });

  // 선택된 공대의 일정 목록 조회
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules', selectedGroupId, showPastSchedules],
    queryFn: () => {
      if (!selectedGroupId) return Promise.resolve([]);

      const today = new Date();
      const params = showPastSchedules
        ? { to_date: today.toISOString().split('T')[0] }
        : { from_date: today.toISOString().split('T')[0] };
      
      return scheduleApi.list(selectedGroupId, params);
    },
    enabled: !!selectedGroupId
  });

  // 선택된 공대의 멤버 목록 조회
  const { data: members } = useQuery({
    queryKey: ['raidGroupMembers', selectedGroupId],
    queryFn: () => selectedGroupId ? raidGroupApi.members(selectedGroupId) : Promise.resolve([]),
    enabled: !!selectedGroupId
  });

  // 일정 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: ({ groupId, scheduleId }: { groupId: number; scheduleId: number }) =>
      scheduleApi.delete(groupId, scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    }
  });

  // 내 참석 상태 업데이트 mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: ({ groupId, scheduleId, status, reason }: {
      groupId: number;
      scheduleId: number;
      status: AttendanceStatus;
      reason?: string;
    }) => scheduleApi.updateMyAttendance(groupId, scheduleId, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    }
  });

  // 선택된 공대 정보
  const selectedGroup = myGroups?.find(g => g.id === selectedGroupId);
  const currentMember = members?.find(m => m.user_id === user?.id);
  const canManageSchedule = isRaidLeader(selectedGroup?.leader_id || 0) || currentMember?.can_manage_schedule;

  // 날짜별 일정 그룹화
  const schedulesByDate = React.useMemo(() => {
    if (!schedules) return new Map();

    const grouped = new Map<string, RaidSchedule[]>();

    schedules.forEach(schedule => {
      const date = schedule.scheduled_date;
      const existing = grouped.get(date) || [];
      grouped.set(date, [...existing, schedule]);
    });

    // 날짜순 정렬
    return new Map([...grouped.entries()].sort((a, b) =>
      showPastSchedules
        ? b[0].localeCompare(a[0])
        : a[0].localeCompare(b[0])
    ));
  }, [schedules, showPastSchedules]);

  if (!selectedGroupId && myGroups && myGroups.length > 0) {
    setSelectedGroupId(myGroups[0].id);
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary-400" />
            일정 관리
          </h1>
          <p className="text-gray-400 mt-1">
            공대 일정을 확인하고 참석 여부를 관리하세요
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/schedule/calendar"
            className="btn btn-secondary flex items-center gap-2"
          >
            <CalendarDays className="w-5 h-5" />
            <span className="hidden sm:inline">달력 보기</span>
          </Link>
          {canManageSchedule && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">일정 생성</span>
            </button>
          )}
        </div>
      </div>

      {/* 공대 선택 */}
      {myGroups && myGroups.length > 0 && (
        <div className="game-panel p-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            {myGroups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`tab-game whitespace-nowrap ${
                  selectedGroupId === group.id ? 'tab-active' : ''
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 필터 옵션 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowPastSchedules(!showPastSchedules)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showPastSchedules 
                ? 'bg-primary-600/20 text-primary-400 border border-primary-600/50' 
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            {showPastSchedules ? '지난 일정' : '예정된 일정'}
          </button>
        </div>

        <div className="text-sm text-gray-500">
          총 {schedulesByDate.size}개의 날짜, {schedules?.length || 0}개의 일정
        </div>
      </div>

      {/* 일정 목록 */}
      {isLoading ? (
        <PageLoading title="일정을 불러오는 중..." />
      ) : schedulesByDate.size === 0 ? (
        <div className="game-panel p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {showPastSchedules ? '지난 일정이 없습니다.' : '예정된 일정이 없습니다.'}
          </p>
          {canManageSchedule && !showPastSchedules && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary mt-4"
            >
              첫 일정 만들기
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(schedulesByDate.entries()).map(([date, dateSchedules]) => (
            <div key={date} className="game-panel">
              <div className="game-panel-header">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary-400" />
                  {formatDate(date)}
                </h3>
              </div>

              <div className="p-6 space-y-4">
                {dateSchedules.map(schedule => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    groupId={selectedGroupId!}
                    canManage={canManageSchedule}
                    onEdit={() => setEditingSchedule(schedule)}
                    onDelete={() => {
                      if (window.confirm('정말 이 일정을 삭제하시겠습니까?')) {
                        deleteMutation.mutate({
                          groupId: selectedGroupId!,
                          scheduleId: schedule.id
                        });
                      }
                    }}
                    onUpdateAttendance={(status, reason) => {
                      updateAttendanceMutation.mutate({
                        groupId: selectedGroupId!,
                        scheduleId: schedule.id,
                        status,
                        reason
                      });
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 일정 생성/수정 모달 */}
      {(showCreateModal || editingSchedule) && (
        <ScheduleModal
          groupId={selectedGroupId!}
          schedule={editingSchedule}
          onClose={() => {
            setShowCreateModal(false);
            setEditingSchedule(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            setShowCreateModal(false);
            setEditingSchedule(null);
          }}
        />
      )}
    </div>
  );
};

// 일정 카드 컴포넌트
const ScheduleCard: React.FC<{
  schedule: RaidSchedule;
  groupId: number;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateAttendance: (status: AttendanceStatus, reason?: string) => void;
}> = ({ schedule, groupId, canManage, onEdit, onDelete, onUpdateAttendance }) => {
  const [showAttendance, setShowAttendance] = useState(false);
  const [attendanceReason, setAttendanceReason] = useState("");

  const isConfirmed = schedule.is_confirmed;
  const isCompleted = schedule.is_completed;
  const isCancelled = schedule.is_cancelled;

  const getStatusBadge = () => {
    if (isCancelled) return { text: '취소됨', color: 'bg-red-600/20 text-red-400' };
    if (isCompleted) return { text: '완료됨', color: 'bg-gray-600/20 text-gray-400' };
    if (isConfirmed) return { text: '확정', color: 'bg-green-600/20 text-green-400' };
    return { text: '미확정', color: 'bg-yellow-600/20 text-yellow-400' };
  };

  const status = getStatusBadge();

  return (
    <div className={`p-6 bg-dark-700 rounded-lg ${isCancelled ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-lg font-semibold">{schedule.title}</h4>
            <span className={`px-2 py-1 rounded text-xs ${status.color}`}>
              {status.text}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(schedule.start_time)}
              {schedule.end_time && ` - ${formatTime(schedule.end_time)}`}
            </span>
            {schedule.target_floors && (
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {schedule.target_floors}
              </span>
            )}
          </div>
        </div>

        {canManage && !isCompleted && !isCancelled && (
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 hover:bg-dark-600 rounded transition-colors"
              title="수정"
            >
              <Edit2 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 hover:bg-dark-600 rounded transition-colors"
              title="삭제"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}
      </div>

      {/* 참석 현황 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-green-400">
            <UserCheck className="w-4 h-4" />
            참석 {schedule.confirmed_count || 0}
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <UserX className="w-4 h-4" />
            불참 {schedule.declined_count || 0}
          </span>
        </div>

        {!isCompleted && !isCancelled && (
          <button
            onClick={() => setShowAttendance(!showAttendance)}
            className="text-sm text-primary-400 hover:text-primary-300"
          >
            내 참석 여부 {showAttendance ? '닫기' : '설정'}
          </button>
        )}
      </div>

      {/* 참석 여부 선택 */}
      {showAttendance && (
        <div className="mt-4 p-4 bg-dark-600 rounded-lg">
          <p className="text-sm text-gray-400 mb-3">참석 여부를 선택해주세요:</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {Object.values(AttendanceStatus).map(status => (
              <button
                key={status}
                onClick={() => onUpdateAttendance(status, attendanceReason)}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  getAttendanceButtonStyle(status)
                }`}
              >
                {ATTENDANCE_STATUS_NAMES[status]}
              </button>
            ))}
          </div>

          {/* 사유 입력 (불참 시) */}
          <input
            type="text"
            placeholder="사유를 입력해주세요 (선택)"
            value={attendanceReason}
            onChange={(e) => setAttendanceReason(e.target.value)}
            className="input-game text-sm"
          />
        </div>
      )}

      {/* 추가 정보 */}
      {(schedule.description || schedule.notes) && (
        <div className="mt-4 p-3 bg-dark-600 rounded text-sm text-gray-400">
          {schedule.description && <p>{schedule.description}</p>}
          {schedule.notes && <p className="mt-2">{schedule.notes}</p>}
        </div>
      )}
    </div>
  );
};

// 참석 버튼 스타일
const getAttendanceButtonStyle = (status: AttendanceStatus): string => {
  switch (status) {
    case AttendanceStatus.CONFIRMED:
      return 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/50';
    case AttendanceStatus.DECLINED:
      return 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50';
    case AttendanceStatus.TENTATIVE:
      return 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-600/50';
    default:
      return 'bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 border border-gray-600/50';
  }
};

// 일정 생성/수정 모달
const ScheduleModal: React.FC<{
  groupId: number;
  schedule?: RaidSchedule | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ groupId, schedule, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: schedule?.title || '',
    description: schedule?.description || '',
    scheduled_date: schedule?.scheduled_date || '',
    start_time: schedule?.start_time || '20:00',
    end_time: schedule?.end_time || '',
    target_floors: schedule?.target_floors || '',
    minimum_members: schedule?.minimum_members || 8,
    notes: schedule?.notes || ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      if (schedule) {
        await scheduleApi.update(groupId, schedule.id, formData);
      } else {
        await scheduleApi.create(groupId, formData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Failed to save schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="game-panel max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">
          {schedule ? '일정 수정' : '새 일정 생성'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 제목 */}
          <div>
            <label className="label-game">제목</label>
            <input
              type="text"
              required
              className="input-game"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* 날짜 */}
          <div>
            <label className="label-game">날짜</label>
            <input
              type="date"
              required
              className="input-game"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
            />
          </div>

          {/* 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-game">시작 시간</label>
              <input
                type="time"
                required
                className="input-game"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div>
              <label className="label-game">종료 시간 (선택)</label>
              <input
                type="time"
                className="input-game"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          {/* 목표 층 */}
          <div>
            <label className="label-game">목표 층 (선택)</label>
            <input
              type="text"
              className="input-game"
              placeholder="예: 1-4층"
              value={formData.target_floors}
              onChange={(e) => setFormData({ ...formData, target_floors: e.target.value })}
            />
          </div>

          {/* 최소 인원 */}
          <div>
            <label className="label-game">최소 인원</label>
            <input
              type="number"
              min="1"
              max="8"
              className="input-game"
              value={formData.minimum_members}
              onChange={(e) => setFormData({ ...formData, minimum_members: Number(e.target.value) })}
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="label-game">설명 (선택)</label>
            <textarea
              className="input-game"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary flex-1"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  저장 중...
                </span>
              ) : (
                schedule ? '수정' : '생성'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Schedule;