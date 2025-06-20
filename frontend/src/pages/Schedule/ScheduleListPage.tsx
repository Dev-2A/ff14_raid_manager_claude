import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Calendar, Plus, Clock, Users, Target, Filter, 
  ChevronLeft, ChevronRight, CalendarDays, List,
  CheckCircle, XCircle, AlertCircle, HelpCircle
} from 'lucide-react';
import { scheduleService, raidService } from '../../services';
import { RaidSchedule, RaidGroup, AttendanceStatus, ScheduleDashboard } from '../../types';

type ViewMode = 'list' | 'calendar';

export const ScheduleListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupIdParam = searchParams.get('groupId');
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [myGroups, setMyGroups] = useState<RaidGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(
    groupIdParam ? parseInt(groupIdParam) : null
  );
  const [dashboard, setDashboard] = useState<ScheduleDashboard | null>(null);
  const [schedules, setSchedules] = useState<RaidSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    loadMyGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId !== null) {
      loadSchedules();
    } else {
      loadDashboard();
    }
  }, [selectedGroupId, filter]);

  const loadMyGroups = async () => {
    try {
      const groups = await raidService.getMyRaidGroups();
      setMyGroups(groups);
      
      // URL 파라미터에 groupId가 없고 공대가 있으면 첫 번째 공대 선택
      if (!groupIdParam && groups.length > 0) {
        setSelectedGroupId(groups[0].id);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await scheduleService.getScheduleDashboard({
        days_ahead: 30,
        days_behind: 30
      });
      setDashboard(data);
      
      // 필터에 따라 일정 설정
      if (filter === 'upcoming') {
        setSchedules(data.upcoming_schedules);
      } else if (filter === 'past') {
        setSchedules(data.past_schedules);
      } else {
        setSchedules([...data.past_schedules, ...data.upcoming_schedules]);
      }
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
      const today = new Date();
      const params: any = {
        is_cancelled: false
      };
      
      if (filter === 'upcoming') {
        params.from_date = today.toISOString().split('T')[0];
      } else if (filter === 'past') {
        params.to_date = today.toISOString().split('T')[0];
        params.is_completed = true;
      }
      
      const data = await scheduleService.getRaidSchedules(selectedGroupId, params);
      setSchedules(data);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttendanceUpdate = async (scheduleId: number, status: AttendanceStatus) => {
    if (!selectedGroupId) return;
    
    try {
      await scheduleService.updateMyAttendance(selectedGroupId, scheduleId, { status });
      // 일정 새로고침
      if (selectedGroupId) {
        loadSchedules();
      } else {
        loadDashboard();
      }
    } catch (error) {
      console.error('Failed to update attendance:', error);
    }
  };

  const getAttendanceIcon = (status?: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.CONFIRMED:
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case AttendanceStatus.DECLINED:
        return <XCircle className="w-5 h-5 text-red-400" />;
      case AttendanceStatus.TENTATIVE:
        return <HelpCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getMyAttendanceStatus = (schedule: RaidSchedule): AttendanceStatus | undefined => {
    if (dashboard?.my_attendance_status) {
      return dashboard.my_attendance_status[schedule.id];
    }
    return undefined;
  };

  const formatScheduleTime = (date: string, time: string) => {
    const scheduleDate = new Date(`${date}T${time}`);
    const today = new Date();
    const diffDays = Math.floor((scheduleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '오늘';
    } else if (diffDays === 1) {
      return '내일';
    } else if (diffDays === -1) {
      return '어제';
    } else if (diffDays > 0 && diffDays <= 7) {
      return `${diffDays}일 후`;
    } else if (diffDays < 0 && diffDays >= -7) {
      return `${Math.abs(diffDays)}일 전`;
    } else {
      return scheduleDate.toLocaleDateString('ko-KR');
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">일정 관리</h1>
          <p className="text-gray-400 mt-1">레이드 일정을 확인하고 참석 여부를 관리하세요</p>
        </div>
        
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

      {/* 공대 선택 및 뷰 모드 */}
      <div className="card-game">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
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

          {/* 뷰 모드 전환 */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <List size={18} />
              목록
            </button>
            <button
              onClick={() => navigate('/schedule/calendar')}
              className="px-4 py-2 rounded-lg font-semibold bg-gray-800 text-gray-400 hover:bg-gray-700 transition-all flex items-center gap-2"
            >
              <CalendarDays size={18} />
              캘린더
            </button>
          </div>
        </div>

        {/* 필터 */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setFilter('upcoming')}
            className={`tab-game ${filter === 'upcoming' ? 'tab-game-active' : ''}`}
          >
            다가오는 일정
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`tab-game ${filter === 'past' ? 'tab-game-active' : ''}`}
          >
            지난 일정
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`tab-game ${filter === 'all' ? 'tab-game-active' : ''}`}
          >
            전체
          </button>
        </div>
      </div>

      {/* 일정 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : schedules.length === 0 ? (
        <div className="card-game text-center py-12">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">
            {filter === 'upcoming' ? '예정된 일정이 없습니다.' : '일정이 없습니다.'}
          </p>
          {selectedGroupId && (
            <Link
              to={`/schedule/create?groupId=${selectedGroupId}`}
              className="btn-game-secondary inline-block"
            >
              일정 만들기
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => {
            const myStatus = getMyAttendanceStatus(schedule);
            const isRecurring = schedule.recurrence_type !== 'none';
            
            return (
              <div
                key={schedule.id}
                className="card-game hover:border-primary-500/70 transition-all cursor-pointer"
                onClick={() => navigate(`/schedule/${schedule.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {schedule.title}
                      </h3>
                      {isRecurring && (
                        <span className="badge-game badge-primary text-xs">
                          반복
                        </span>
                      )}
                      {schedule.is_confirmed && (
                        <span className="badge-game badge-gold text-xs">
                          확정
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(schedule.scheduled_date).toLocaleDateString('ko-KR')} ({formatScheduleTime(schedule.scheduled_date, schedule.start_time)})
                      </span>
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

                    {schedule.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {schedule.description}
                      </p>
                    )}
                  </div>

                  {/* 내 참석 상태 */}
                  <div className="ml-4">
                    <div className="flex flex-col items-center gap-2">
                      {getAttendanceIcon(myStatus)}
                      <span className="text-xs text-gray-400">
                        {myStatus ? scheduleService.getAttendanceStatusName(myStatus) : '미응답'}
                      </span>
                    </div>
                    
                    {!schedule.is_completed && !schedule.is_cancelled && (
                      <div className="flex flex-col gap-1 mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAttendanceUpdate(schedule.id, AttendanceStatus.CONFIRMED);
                          }}
                          className={`px-3 py-1 text-xs rounded ${
                            myStatus === AttendanceStatus.CONFIRMED
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-green-600 hover:text-white'
                          } transition-colors`}
                        >
                          참석
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAttendanceUpdate(schedule.id, AttendanceStatus.DECLINED);
                          }}
                          className={`px-3 py-1 text-xs rounded ${
                            myStatus === AttendanceStatus.DECLINED
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white'
                          } transition-colors`}
                        >
                          불참
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};