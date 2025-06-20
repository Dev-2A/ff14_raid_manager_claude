import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, Clock, Users, Target, ArrowLeft, Edit, Trash2,
  CheckCircle, XCircle, AlertCircle, HelpCircle, Repeat,
  ChevronRight, Info, Loader, User, Shield, Heart, Sword
} from 'lucide-react';
import { authService, scheduleService, raidService } from '../../services';
import { 
  User as UserType, RaidSchedule, RaidAttendance, RaidGroup, 
  AttendanceStatus, RecurrenceType, RecurringScheduleDeleteOption 
} from '../../types';

export const ScheduleDetailPage: React.FC = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [schedule, setSchedule] = useState<RaidSchedule | null>(null);
  const [raidGroup, setRaidGroup] = useState<RaidGroup | null>(null);
  const [attendances, setAttendances] = useState<RaidAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [canManage, setCanManage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOption, setDeleteOption] = useState<RecurringScheduleDeleteOption>(
    RecurringScheduleDeleteOption.THIS_ONLY
  );
  const [editingAttendance, setEditingAttendance] = useState<number | null>(null);
  const [editReason, setEditReason] = useState('');

  useEffect(() => {
    if (scheduleId) {
      loadScheduleData();
    }
  }, [scheduleId]);

  const loadScheduleData = async () => {
    if (!scheduleId) return;

    setIsLoading(true);
    try {
      // 현재 사용자 정보
      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      // 임시: 첫 번째 공대 ID 사용 (실제로는 일정에서 group_id를 가져와야 함)
      const myGroups = await raidService.getMyRaidGroups();
      if (myGroups.length === 0) {
        setError('가입한 공대가 없습니다.');
        return;
      }

      const groupId = myGroups[0].id; // TODO: 실제 구현 시 수정 필요

      // 일정 정보
      const scheduleData = await scheduleService.getRaidSchedule(groupId, parseInt(scheduleId));
      setSchedule(scheduleData);

      // 공대 정보
      const group = await raidService.getRaidGroup(scheduleData.raid_group_id);
      setRaidGroup(group);

      // 권한 확인
      const isLeader = group.leader_id === user.id;
      const member = await raidService.getRaidMembers(groupId);
      const currentMember = member.find(m => m.user_id === user.id);
      const canManageSchedule = isLeader || (currentMember?.can_manage_schedule || false);
      setCanManage(canManageSchedule);

      // 참석 현황
      const attendanceList = await scheduleService.getScheduleAttendance(groupId, parseInt(scheduleId));
      setAttendances(attendanceList);
    } catch (error) {
      console.error('Failed to load schedule data:', error);
      setError('일정 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMyAttendanceUpdate = async (status: AttendanceStatus) => {
    if (!schedule || !scheduleId) return;

    try {
      await scheduleService.updateMyAttendance(
        schedule.raid_group_id,
        parseInt(scheduleId),
        { status, reason: editReason }
      );
      await loadScheduleData();
      setEditingAttendance(null);
      setEditReason('');
    } catch (error) {
      console.error('Failed to update attendance:', error);
    }
  };

  const handleMemberAttendanceUpdate = async (userId: number, status: AttendanceStatus) => {
    if (!schedule || !scheduleId) return;

    try {
      await scheduleService.updateMemberAttendance(
        schedule.raid_group_id,
        parseInt(scheduleId),
        userId,
        { status }
      );
      await loadScheduleData();
    } catch (error) {
      console.error('Failed to update member attendance:', error);
    }
  };

  const handleDelete = async () => {
    if (!schedule || !scheduleId) return;

    try {
      await scheduleService.deleteRaidSchedule(
        schedule.raid_group_id,
        parseInt(scheduleId),
        schedule.recurrence_type !== RecurrenceType.NONE ? deleteOption : undefined
      );
      navigate(`/schedule?groupId=${schedule.raid_group_id}`);
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  const getAttendanceStats = () => {
    const stats = {
      confirmed: 0,
      declined: 0,
      tentative: 0,
      pending: 0
    };

    attendances.forEach(att => {
      switch (att.status) {
        case AttendanceStatus.CONFIRMED:
          stats.confirmed++;
          break;
        case AttendanceStatus.DECLINED:
          stats.declined++;
          break;
        case AttendanceStatus.TENTATIVE:
          stats.tentative++;
          break;
        default:
          stats.pending++;
      }
    });

    return stats;
  };

  const getAttendanceIcon = (status: AttendanceStatus) => {
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

  const getRoleIcon = (job?: string) => {
    // 직업을 기반으로 역할 추정
    const tankJobs = ['PLD', 'WAR', 'DRK', 'GNB'];
    const healerJobs = ['WHM', 'SCH', 'AST', 'SGE'];
    
    if (tankJobs.includes(job || '')) {
      return <Shield className="w-5 h-5" />;
    } else if (healerJobs.includes(job || '')) {
      return <Heart className="w-5 h-5" />;
    } else {
      return <Sword className="w-5 h-5" />;
    }
  };

  const getRoleClass = (job?: string) => {
    const tankJobs = ['PLD', 'WAR', 'DRK', 'GNB'];
    const healerJobs = ['WHM', 'SCH', 'AST', 'SGE'];
    
    if (tankJobs.includes(job || '')) {
      return 'role-tank';
    } else if (healerJobs.includes(job || '')) {
      return 'role-healer';
    } else {
      return 'role-dps';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="animate-spin text-primary-400" size={32} />
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="card-game text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">{error || '일정을 찾을 수 없습니다.'}</p>
        <Link to="/schedule" className="btn-game-secondary mt-4 inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const stats = getAttendanceStats();
  const myAttendance = attendances.find(att => att.user_id === currentUser?.id);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={`/schedule?groupId=${schedule.raid_group_id}`}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              {schedule.title}
              {schedule.recurrence_type !== RecurrenceType.NONE && (
                <span className="badge-game badge-primary">
                  <Repeat className="w-4 h-4 mr-1" />
                  {scheduleService.getRecurrenceTypeName(schedule.recurrence_type)}
                </span>
              )}
            </h1>
            <p className="text-gray-400 mt-1">{raidGroup?.name}</p>
          </div>
        </div>

        {canManage && !schedule.is_completed && !schedule.is_cancelled && (
          <div className="flex gap-2">
            <button className="btn-game-secondary flex items-center">
              <Edit className="mr-2" size={18} />
              수정
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-game-secondary flex items-center text-red-400 hover:text-red-300"
            >
              <Trash2 className="mr-2" size={18} />
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 일정 정보 */}
      <div className="card-game">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">일시</p>
              <div className="flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5 text-primary-400" />
                <span>{new Date(schedule.scheduled_date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}</span>
              </div>
              <div className="flex items-center gap-2 text-white mt-2">
                <Clock className="w-5 h-5 text-primary-400" />
                <span>{schedule.start_time}{schedule.end_time && ` - ${schedule.end_time}`}</span>
              </div>
            </div>

            {schedule.target_floors && (
              <div>
                <p className="text-sm text-gray-400 mb-1">목표</p>
                <div className="flex items-center gap-2 text-white">
                  <Target className="w-5 h-5 text-primary-400" />
                  <span>{schedule.target_floors}</span>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-400 mb-1">상태</p>
              <div className="flex gap-2">
                {schedule.is_confirmed && (
                  <span className="badge-game badge-gold">확정</span>
                )}
                {schedule.is_completed && (
                  <span className="badge-game badge-primary">완료</span>
                )}
                {schedule.is_cancelled && (
                  <span className="badge-game bg-red-900/30 text-red-400 border-red-600/50">취소됨</span>
                )}
                {!schedule.is_confirmed && !schedule.is_completed && !schedule.is_cancelled && (
                  <span className="badge-game badge-silver">예정</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">참석 현황</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 bg-green-900/20 rounded-lg border border-green-600/50">
                  <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-400">{stats.confirmed}</p>
                  <p className="text-xs text-gray-400">참석</p>
                </div>
                <div className="p-3 bg-red-900/20 rounded-lg border border-red-600/50">
                  <XCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-400">{stats.declined}</p>
                  <p className="text-xs text-gray-400">불참</p>
                </div>
                <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-600/50">
                  <HelpCircle className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-yellow-400">{stats.tentative}</p>
                  <p className="text-xs text-gray-400">미정</p>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-400">{stats.pending}</p>
                  <p className="text-xs text-gray-400">미응답</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-2">최소 인원</p>
              <div className="progress-bar-game">
                <div 
                  className={`progress-bar-fill ${
                    stats.confirmed >= schedule.minimum_members 
                      ? 'bg-gradient-to-r from-green-600 to-green-400' 
                      : 'bg-gradient-to-r from-yellow-600 to-yellow-400'
                  }`}
                  style={{ width: `${Math.min((stats.confirmed / schedule.minimum_members) * 100, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-1 text-right">
                {stats.confirmed} / {schedule.minimum_members}명
              </p>
            </div>
          </div>
        </div>

        {(schedule.description || schedule.notes) && (
          <div className="mt-6 pt-6 border-t border-gray-700 space-y-4">
            {schedule.description && (
              <div>
                <p className="text-sm text-gray-400 mb-2">설명</p>
                <p className="text-gray-300">{schedule.description}</p>
              </div>
            )}
            {schedule.notes && (
              <div>
                <p className="text-sm text-gray-400 mb-2">메모</p>
                <p className="text-gray-300">{schedule.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 내 참석 상태 */}
      {!schedule.is_completed && !schedule.is_cancelled && (
        <div className="card-game">
          <h2 className="text-lg font-semibold text-primary-300 mb-4">내 참석 상태</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                getRoleClass(currentUser?.job)
              }`}>
                {getRoleIcon(currentUser?.job)}
              </div>
              <div>
                <p className="font-semibold text-white">{currentUser?.character_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getAttendanceIcon(myAttendance?.status || AttendanceStatus.PENDING)}
                  <span className="text-sm text-gray-400">
                    {scheduleService.getAttendanceStatusName(myAttendance?.status || AttendanceStatus.PENDING)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleMyAttendanceUpdate(AttendanceStatus.CONFIRMED)}
                className={`btn-game-secondary ${
                  myAttendance?.status === AttendanceStatus.CONFIRMED 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : ''
                }`}
              >
                참석
              </button>
              <button
                onClick={() => handleMyAttendanceUpdate(AttendanceStatus.DECLINED)}
                className={`btn-game-secondary ${
                  myAttendance?.status === AttendanceStatus.DECLINED 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : ''
                }`}
              >
                불참
              </button>
              <button
                onClick={() => handleMyAttendanceUpdate(AttendanceStatus.TENTATIVE)}
                className={`btn-game-secondary ${
                  myAttendance?.status === AttendanceStatus.TENTATIVE 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : ''
                }`}
              >
                미정
              </button>
            </div>
          </div>

          {myAttendance?.reason && (
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400">사유: {myAttendance.reason}</p>
            </div>
          )}
        </div>
      )}

      {/* 참석자 목록 */}
      <div className="card-game">
        <h2 className="text-lg font-semibold text-primary-300 mb-4">참석자 현황</h2>
        
        <div className="space-y-2">
          {attendances.map((attendance) => (
            <div
              key={attendance.id}
              className="p-3 bg-gray-800/50 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  getRoleClass(attendance.user?.job)
                }`}>
                  {getRoleIcon(attendance.user?.job)}
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {attendance.user?.character_name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {attendance.user?.job || '직업 미설정'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {attendance.reason && (
                  <p className="text-sm text-gray-500 max-w-xs truncate">
                    {attendance.reason}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  {getAttendanceIcon(attendance.status)}
                  <span className="text-sm text-gray-400">
                    {scheduleService.getAttendanceStatusName(attendance.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <>
          <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="card-game max-w-md w-full">
              <h3 className="text-lg font-semibold text-white mb-4">일정 삭제</h3>
              
              {schedule.recurrence_type !== RecurrenceType.NONE && (
                <div className="mb-4 space-y-3">
                  <p className="text-gray-400">반복 일정을 어떻게 삭제하시겠습니까?</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="deleteOption"
                        value={RecurringScheduleDeleteOption.THIS_ONLY}
                        checked={deleteOption === RecurringScheduleDeleteOption.THIS_ONLY}
                        onChange={(e) => setDeleteOption(e.target.value as RecurringScheduleDeleteOption)}
                        className="text-primary-600"
                      />
                      <span className="text-sm">이 일정만 삭제</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="deleteOption"
                        value={RecurringScheduleDeleteOption.THIS_AND_FUTURE}
                        checked={deleteOption === RecurringScheduleDeleteOption.THIS_AND_FUTURE}
                        onChange={(e) => setDeleteOption(e.target.value as RecurringScheduleDeleteOption)}
                        className="text-primary-600"
                      />
                      <span className="text-sm">이 일정과 이후 모든 반복 일정 삭제</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="deleteOption"
                        value={RecurringScheduleDeleteOption.ALL}
                        checked={deleteOption === RecurringScheduleDeleteOption.ALL}
                        onChange={(e) => setDeleteOption(e.target.value as RecurringScheduleDeleteOption)}
                        className="text-primary-600"
                      />
                      <span className="text-sm">모든 반복 일정 삭제</span>
                    </label>
                  </div>
                </div>
              )}
              
              <p className="text-gray-400 mb-6">
                {schedule.recurrence_type === RecurrenceType.NONE 
                  ? '정말로 이 일정을 삭제하시겠습니까?' 
                  : '선택한 옵션에 따라 일정이 삭제됩니다.'}
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-game-secondary"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-game bg-red-600 hover:bg-red-700"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};