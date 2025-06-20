import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, X, ChevronLeft, ChevronRight, List, Plus,
  Clock, Users, Target, CheckCircle, XCircle, 
  AlertCircle, HelpCircle, Filter
} from 'lucide-react';
import { scheduleService, raidService } from '../../services';
import { RaidSchedule, RaidGroup, AttendanceStatus, ScheduleDashboard } from '../../types';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  schedules: RaidSchedule[];
}

export const ScheduleCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [myGroups, setMyGroups] = useState<RaidGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<RaidSchedule[]>([]);
  const [dashboard, setDashboard] = useState<ScheduleDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);

  // 요일 이름
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  useEffect(() => {
    loadMyGroups();
  }, []);

  useEffect(() => {
    generateCalendar();
  }, [currentDate, schedules]);

  useEffect(() => {
    if (selectedGroupId !== null) {
      loadSchedules();
    } else {
      loadDashboard();
    }
  }, [selectedGroupId, currentDate]);

  const loadMyGroups = async () => {
    try {
      const groups = await raidService.getMyRaidGroups();
      setMyGroups(groups);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const data = await scheduleService.getScheduleDashboard({
        days_ahead: Math.ceil((lastDay.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        days_behind: Math.ceil((new Date().getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24))
      });
      
      setDashboard(data);
      setSchedules([...data.past_schedules, ...data.upcoming_schedules]);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSchedules = async () => {
    if (!selectedGroupId) return;
    
    setIsLoading(true);
    try {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const data = await scheduleService.getRaidSchedules(selectedGroupId, {
        from_date: firstDay.toISOString().split('T')[0],
        to_date: lastDay.toISOString().split('T')[0],
        is_cancelled: false
      });
      
      setSchedules(data);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);
    
    // 달력 시작일 (일요일부터 시작)
    startDate.setDate(startDate.getDate() - startDate.getDay());
    // 달력 종료일 (토요일로 끝)
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const currentDateCopy = new Date(date);
      const dateSchedules = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.scheduled_date);
        return scheduleDate.toDateString() === currentDateCopy.toDateString();
      });
      
      days.push({
        date: new Date(date),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        schedules: dateSchedules
      });
    }
    
    setCalendarDays(days);
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (day: CalendarDay) => {
    if (day.schedules.length > 0) {
      setSelectedDate(day.date);
      setShowDayDetail(true);
    }
  };

  const getMyAttendanceStatus = (schedule: RaidSchedule): AttendanceStatus | undefined => {
    if (dashboard?.my_attendance_status) {
      return dashboard.my_attendance_status[schedule.id];
    }
    return undefined;
  };

  const getAttendanceIcon = (status?: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.CONFIRMED:
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case AttendanceStatus.DECLINED:
        return <XCircle className="w-3 h-3 text-red-400" />;
      case AttendanceStatus.TENTATIVE:
        return <HelpCircle className="w-3 h-3 text-yellow-400" />;
      default:
        return <AlertCircle className="w-3 h-3 text-gray-400" />;
    }
  };

  const getDaySchedules = (date: Date) => {
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduled_date);
      return scheduleDate.toDateString() === date.toDateString();
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">일정 캘린더</h1>
          <p className="text-gray-400 mt-1">월별 레이드 일정을 한눈에 확인하세요</p>
        </div>
        
        <div className="flex gap-2">
          <Link
            to="/schedule"
            className="btn-game-secondary flex items-center"
          >
            <List className="mr-2" size={20} />
            목록 보기
          </Link>
          {selectedGroupId && (
            <Link
              to={`/schedule/create?groupId=${selectedGroupId}`}
              className="btn-game flex items-center"
            >
              <Plus className="mr-2" size={20} />
              일정 추가
            </Link>
          )}
        </div>
      </div>

      {/* 공대 선택 및 캘린더 컨트롤 */}
      <div className="card-game">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* 공대 선택 */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-400">공대 선택</label>
            <select
              value={selectedGroupId || ''}
              onChange={(e) => setSelectedGroupId(e.target.value ? parseInt(e.target.value) : null)}
              className="input-game appearance-none"
            >
              <option value="">전체 공대</option>
              {myGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* 월 네비게이션 */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => changeMonth('prev')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
            
            <div className="text-center min-w-[150px]">
              <h2 className="text-xl font-bold text-white">
                {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
              </h2>
            </div>
            
            <button
              onClick={() => changeMonth('next')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button
              onClick={goToToday}
              className="btn-game-secondary text-sm"
            >
              오늘
            </button>
          </div>
        </div>
      </div>

      {/* 캘린더 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="card-game overflow-hidden">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-gray-700">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`p-3 text-center font-semibold ${
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
              <div
                key={index}
                className={`min-h-[100px] p-2 border-r border-b border-gray-800 ${
                  !day.isCurrentMonth ? 'bg-gray-900/50' : ''
                } ${day.isToday ? 'bg-primary-900/20' : ''} ${
                  day.schedules.length > 0 ? 'cursor-pointer hover:bg-gray-800/50' : ''
                } transition-colors`}
                onClick={() => handleDateClick(day)}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  !day.isCurrentMonth ? 'text-gray-600' : 
                  day.date.getDay() === 0 ? 'text-red-400' : 
                  day.date.getDay() === 6 ? 'text-blue-400' : 
                  'text-gray-300'
                } ${day.isToday ? 'text-primary-300' : ''}`}>
                  {day.date.getDate()}
                </div>
                
                {/* 일정 표시 (최대 3개) */}
                <div className="space-y-1">
                  {day.schedules.slice(0, 3).map((schedule, idx) => {
                    const myStatus = getMyAttendanceStatus(schedule);
                    return (
                      <div
                        key={schedule.id}
                        className="text-xs p-1 bg-primary-800/30 rounded truncate flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/schedule/${schedule.id}`);
                        }}
                      >
                        {getAttendanceIcon(myStatus)}
                        <span className="truncate">{schedule.title}</span>
                      </div>
                    );
                  })}
                  {day.schedules.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{day.schedules.length - 3}개 더보기
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 범례 */}
      <div className="card-game">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">참석 상태 범례</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-gray-300">참석</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-gray-300">불참</span>
          </div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-300">미정</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">미응답</span>
          </div>
        </div>
      </div>

      {/* 날짜별 상세 모달 */}
      {showDayDetail && selectedDate && (
        <>
          <div className="modal-backdrop" onClick={() => setShowDayDetail(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="card-game max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {selectedDate.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </h3>
                <button
                  onClick={() => setShowDayDetail(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                {getDaySchedules(selectedDate).map((schedule) => {
                  const myStatus = getMyAttendanceStatus(schedule);
                  return (
                    <div
                      key={schedule.id}
                      className="p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800/70 transition-colors"
                      onClick={() => navigate(`/schedule/${schedule.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-white mb-2">{schedule.title}</h4>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {schedule.start_time}{schedule.end_time && ` - ${schedule.end_time}`}
                            </span>
                            {schedule.target_floors && (
                              <span className="flex items-center">
                                <Target className="w-4 h-4 mr-1" />
                                {schedule.target_floors}
                              </span>
                            )}
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              참석 {schedule.confirmed_count || 0}/{schedule.minimum_members}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          {getAttendanceIcon(myStatus)}
                          <span className="text-xs text-gray-400">
                            {myStatus ? scheduleService.getAttendanceStatusName(myStatus) : '미응답'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};