import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { raidGroupApi, scheduleApi } from "../../api/endpoints";
import { RaidSchedule, AttendanceStatus } from "../../types";
import { PageLoading } from "../../components/Common/LoadingScreen";
import { 
  Calendar, ChevronLeft, ChevronRight, CalendarDays,
  Clock, Users, Target, Check, X, AlertCircle,
  Filter, List
} from 'lucide-react';
import { formatTime } from "../../api/config";

interface CalendarDay {
  date: Date;
  schedules: RaidSchedule[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

const ScheduleCalendar: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<RaidSchedule | null>(null);

  // 현재 월의 시작일과 종료일 계산
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // 달력 표시를 위한 시작일과 종료일 (주 단위)
  const calendarStart = new Date(startOfMonth);
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());

  const calendarEnd = new Date(endOfMonth);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - calendarEnd.getDay()));

  // 내 공대 목록 조회
  const { data: myGroups } = useQuery({
    queryKey: ['myRaidGroups'],
    queryFn: () => raidGroupApi.myGroups()
  });

  // 선택된 공대의 일정 조회
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['calendarSchedules', selectedGroupId, currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: () => {
      if (!selectedGroupId) return Promise.resolve([]);

      return scheduleApi.list(selectedGroupId, {
        from_date: calendarStart.toISOString().split('T')[0],
        to_date: calendarEnd.toISOString().split('T')[0]
      });
    },
    enabled: !!selectedGroupId
  });

  // 달력 데이터 생성
  const calendarDays: CalendarDay[] = React.useMemo(() => {
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let date = new Date(calendarStart); date <= calendarEnd; date.setDate(date.getDate() + 1)) {
      const currentDateStr = date.toISOString().split('T')[0];
      const daySchedules = schedules?.filter(s => s.scheduled_date === currentDateStr) || [];

      days.push({
        date: new Date(date),
        schedules: daySchedules,
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        isToday: date.getTime() === today.getTime()
      });
    }

    return days;
  }, [schedules, currentDate, calendarStart, calendarEnd]);

  // 초기 공대 선택
  React.useEffect(() => {
    if (!selectedGroupId && myGroups && myGroups.length > 0) {
      setSelectedGroupId(myGroups[0].id);
    }
  }, [myGroups, selectedGroupId]);

  // 이전/다음 월 이동
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + (direction === 'prev' ? -1 : 1));
      return newDate;
    });
  };

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 월 이름 가져오기
  const getMonthName = (date: Date): string => {
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  };

  // 요일 이름
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-primary-400" />
            일정 달력
          </h1>
          <p className="text-gray-400 mt-1">
            월별 공대 일정을 한눈에 확인하세요
          </p>
        </div>

        <Link
          to="/schedule"
          className="btn btn-secondary flex items-center gap-2"
        >
          <List className="w-5 h-5" />
          <span className="hidden sm:inline">목록 보기</span>
        </Link>
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

      {/* 달력 네비게이션 */}
      <div className="game-panel p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            aria-label="이전 달"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">{getMonthName(currentDate)}</h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 rounded transition-colors"
            >
              오늘
            </button>
          </div>

          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            aria-label="다음 달"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 달력 본체 */}
      {isLoading ? (
        <PageLoading title="일정을 불러오는 중..." />
      ) : (
        <div className="game-panel overflow-hidden">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 bg-dark-700">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`p-3 text-center text-sm font-semibold ${
                  index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-gray-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <CalendarDayCell
                key={index}
                day={day}
                onScheduleClick={setSelectedSchedule}
              />
            ))}
          </div>
        </div>
      )}

      {/* 일정 상세 모달 */}
      {selectedSchedule && (
        <ScheduleDetailModal
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
        />
      )}
    </div>
  );
};

// 달력 날짜 셀 컴포넌트
const CalendarDayCell: React.FC<{
  day: CalendarDay;
  onScheduleClick: (schedule: RaidSchedule) => void;
}> = ({ day, onScheduleClick }) => {
  const dayOfWeek = day.date.getDay();
  const dateColor = dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : '';

  return (
    <div
      className={`
        min-h-[120px] p-2 border-r border-b border-dark-600
        ${!day.isCurrentMonth ? 'bg-dark-800/50' : ''}
        ${day.isToday ? 'bg-primary-900/20' : ''}
        hover:bg-dark-700/50 transition-colors
      `}
    >
      {/* 날짜 */}
      <div className={`text-sm font-semibold mb-1 ${day.isCurrentMonth ? dateColor : 'text-gray-600'}`}>
        {day.date.getDate()}
      </div>

      {/* 일정 목록 */}
      <div className="space-y-1">
        {day.schedules.slice(0, 3).map(schedule => (
          <ScheduleItem
            key={schedule.id}
            schedule={schedule}
            onClick={() => onScheduleClick(schedule)}
          />
        ))}
        
        {/* 더 많은 일정이 있을 경우 */}
        {day.schedules.length > 3 && (
          <div className="text-xs text-gray-500 text-center">
            +{day.schedules.length - 3}개 더
          </div>
        )}
      </div>
    </div>
  );
};

// 일정 아이템 컴포넌트
const ScheduleItem: React.FC<{
  schedule: RaidSchedule;
  onClick: () => void;
}> = ({ schedule, onClick }) => {
  const getStatusColor = () => {
    if (schedule.is_cancelled) return 'bg-red-600/80';
    if (schedule.is_completed) return 'bg-gray-600/80';
    if (schedule.is_confirmed) return 'bg-green-600/80';
    return 'bg-yellow-600/80';
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full px-2 py-1 rounded text-xs text-left
        ${getStatusColor()} hover:opacity-80 transition-opacity
        truncate
      `}
      title={schedule.title}
    >
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{formatTime(schedule.start_time)}</span>
      </div>
      <div className="truncate font-medium">{schedule.title}</div>
    </button>
  );
};

// 일정 상세 모달
const ScheduleDetailModal: React.FC<{
  schedule: RaidSchedule;
  onClose: () => void;
}> = ({ schedule, onClose }) => {
  const getStatusInfo = () => {
    if (schedule.is_cancelled) return { text: '취소됨', color: 'text-red-400', icon: X };
    if (schedule.is_completed) return { text: '완료됨', color: 'text-gray-400', icon: Check };
    if (schedule.is_confirmed) return { text: '확정', color: 'text-green-400', icon: Check };
    return { text: '미확정', color: 'text-yellow-400', icon: AlertCircle };
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="game-panel max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold mb-2">{schedule.title}</h3>
            <div className={`flex items-center gap-2 ${status.color}`}>
              <StatusIcon className="w-5 h-5" />
              <span>{status.text}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 날짜 및 시간 */}
          <div>
            <p className="text-sm text-gray-500 mb-1">일시</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{new Date(schedule.scheduled_date).toLocaleDateString('ko-KR')}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>
                {formatTime(schedule.start_time)}
                {schedule.end_time && ` - ${formatTime(schedule.end_time)}`}
              </span>
            </div>
          </div>

          {/* 목표 층 */}
          {schedule.target_floors && (
            <div>
              <p className="text-sm text-gray-500 mb-1">목표</p>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-400" />
                <span>{schedule.target_floors}</span>
              </div>
            </div>
          )}

          {/* 참석 현황 */}
          <div>
            <p className="text-sm text-gray-500 mb-1">참석 현황</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-400" />
                <span className="text-green-400">참석 {schedule.confirmed_count || 0}명</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-red-400" />
                <span className="text-red-400">불참 {schedule.declined_count || 0}명</span>
              </div>
            </div>
          </div>

          {/* 설명 */}
          {schedule.description && (
            <div>
              <p className="text-sm text-gray-500 mb-1">설명</p>
              <p className="text-gray-300">{schedule.description}</p>
            </div>
          )}

          {/* 메모 */}
          {schedule.notes && (
            <div>
              <p className="text-sm text-gray-500 mb-1">메모</p>
              <p className="text-gray-400 text-sm">{schedule.notes}</p>
            </div>
          )}

          {/* 완료 메모 */}
          {schedule.completion_notes && (
            <div>
              <p className="text-sm text-gray-500 mb-1">완료 메모</p>
              <p className="text-gray-400 text-sm">{schedule.completion_notes}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            to="/schedule"
            className="btn btn-secondary flex-1"
          >
            일정 목록
          </Link>
          <button
            onClick={onClose}
            className="btn btn-primary flex-1"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendar;