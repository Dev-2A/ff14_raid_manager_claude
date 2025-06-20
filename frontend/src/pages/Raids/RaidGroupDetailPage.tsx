import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Shield, Heart, Sword, Users, Calendar, Package, TrendingUp,
  Settings, UserPlus, LogOut, Crown, AlertCircle, Loader,
  Clock, Target, ChevronRight, Edit, Trash2
} from 'lucide-react';
import { authService, raidService, scheduleService, distributionService } from '../../services';
import { 
  User, RaidGroup, RaidMember, RaidSchedule, DistributionHistory,
  DistributionMethod 
} from '../../types';

export const RaidGroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [raidGroup, setRaidGroup] = useState<RaidGroup | null>(null);
  const [members, setMembers] = useState<RaidMember[]>([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState<RaidSchedule[]>([]);
  const [recentDistributions, setRecentDistributions] = useState<DistributionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLeader, setIsLeader] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  useEffect(() => {
    if (groupId) {
      loadGroupData();
    }
  }, [groupId]);

  const loadGroupData = async () => {
    if (!groupId) return;
    
    setIsLoading(true);
    try {
      // 현재 사용자 정보
      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      // 공대 정보
      const group = await raidService.getRaidGroup(parseInt(groupId));
      setRaidGroup(group);
      setIsLeader(group.leader_id === user.id);

      // 공대원 목록
      const memberList = await raidService.getRaidMembers(parseInt(groupId));
      setMembers(memberList);
      setIsMember(memberList.some(m => m.user_id === user.id));

      // 다가오는 일정 (멤버인 경우만)
      if (memberList.some(m => m.user_id === user.id)) {
        const schedules = await scheduleService.getRaidSchedules(parseInt(groupId), {
          from_date: new Date().toISOString().split('T')[0],
          is_cancelled: false,
          limit: 3
        });
        setUpcomingSchedules(schedules);

        // 최근 분배 내역
        const distributions = await distributionService.getDistributionHistory(parseInt(groupId), {
          limit: 5
        });
        setRecentDistributions(distributions);
      }
    } catch (error: any) {
      console.error('Failed to load group data:', error);
      setError('공대 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!groupId || !currentUser) return;

    try {
      await raidService.addRaidMember(parseInt(groupId), {
        user_id: currentUser.id,
        job: currentUser.job
      });
      await loadGroupData();
    } catch (error: any) {
      alert(error.message || '공대 가입에 실패했습니다.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupId || !currentUser) return;

    const member = members.find(m => m.user_id === currentUser.id);
    if (!member) return;

    try {
      await raidService.removeRaidMember(parseInt(groupId), member.id);
      navigate('/raids');
    } catch (error: any) {
      alert(error.message || '공대 탈퇴에 실패했습니다.');
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'tank':
      case '탱커':
        return <Shield className="w-5 h-5" />;
      case 'healer':
      case '힐러':
        return <Heart className="w-5 h-5" />;
      default:
        return <Sword className="w-5 h-5" />;
    }
  };

  const getRoleClass = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'tank':
      case '탱커':
        return 'role-tank';
      case 'healer':
      case '힐러':
        return 'role-healer';
      default:
        return 'role-dps';
    }
  };

  const getRoleCount = () => {
    const counts = { tank: 0, healer: 0, dps: 0 };
    members.forEach(member => {
      if (member.role?.toLowerCase() === 'tank' || member.role === '탱커') {
        counts.tank++;
      } else if (member.role?.toLowerCase() === 'healer' || member.role === '힐러') {
        counts.healer++;
      } else {
        counts.dps++;
      }
    });
    return counts;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="animate-spin text-primary-400" size={32} />
      </div>
    );
  }

  if (error || !raidGroup) {
    return (
      <div className="card-game text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">{error || '공대를 찾을 수 없습니다.'}</p>
        <Link to="/raids" className="btn-game-secondary mt-4 inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const roleCount = getRoleCount();

  return (
    <div className="space-y-6">
      {/* 공대 헤더 */}
      <div className="card-game">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{raidGroup.name}</h1>
              {raidGroup.is_recruiting && (
                <span className="badge-game badge-primary">모집 중</span>
              )}
            </div>
            <p className="text-gray-400 mb-4">
              {raidGroup.raid?.name} · {raidGroup.raid?.tier}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-400">공대장</p>
                <p className="text-white font-semibold flex items-center gap-1 mt-1">
                  <Crown className="w-4 h-4 text-accent-gold" />
                  {raidGroup.leader?.character_name}
                </p>
              </div>
              <div>
                <p className="text-gray-400">분배 방식</p>
                <p className="text-white font-semibold mt-1">
                  {raidGroup.distribution_method === DistributionMethod.PRIORITY ? '우선순위' : '선착순'}
                </p>
              </div>
              <div>
                <p className="text-gray-400">목표 IL</p>
                <p className="text-primary-300 font-semibold mt-1">
                  {raidGroup.target_item_level || '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-400">인원 현황</p>
                <p className="text-white font-semibold mt-1">
                  {members.length}/8명
                </p>
              </div>
            </div>

            {raidGroup.description && (
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-300">{raidGroup.description}</p>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col gap-2">
            {isLeader && (
              <>
                <Link
                  to={`/raids/${groupId}/settings`}
                  className="btn-game-secondary flex items-center justify-center"
                >
                  <Settings className="mr-2" size={18} />
                  공대 설정
                </Link>
                <Link
                  to={`/raids/${groupId}/members`}
                  className="btn-game-secondary flex items-center justify-center"
                >
                  <Users className="mr-2" size={18} />
                  멤버 관리
                </Link>
              </>
            )}
            
            {!isMember && members.length < 8 && (
              <button
                onClick={handleJoinGroup}
                className="btn-game flex items-center justify-center"
              >
                <UserPlus className="mr-2" size={18} />
                공대 가입
              </button>
            )}
            
            {isMember && !isLeader && (
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="btn-game-secondary flex items-center justify-center text-red-400 hover:text-red-300"
              >
                <LogOut className="mr-2" size={18} />
                공대 탈퇴
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 역할별 현황 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-game p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="role-tank w-10 h-10 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-400">탱커</p>
                <p className="text-xl font-bold text-white">{roleCount.tank}/2</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-game p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="role-healer w-10 h-10 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-400">힐러</p>
                <p className="text-xl font-bold text-white">{roleCount.healer}/2</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-game p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="role-dps w-10 h-10 rounded-full flex items-center justify-center">
                <Sword className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-400">딜러</p>
                <p className="text-xl font-bold text-white">{roleCount.dps}/4</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 공대원 목록 */}
        <div className="lg:col-span-2">
          <div className="card-game">
            <h2 className="text-lg font-semibold text-primary-300 mb-4">공대원 목록</h2>
            
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-3 bg-gray-800/50 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      getRoleClass(member.role)
                    }`}>
                      {getRoleIcon(member.role)}
                    </div>
                    <div>
                      <p className="font-semibold text-white flex items-center gap-2">
                        {member.user?.character_name}
                        {member.user_id === raidGroup.leader_id && (
                          <Crown className="w-4 h-4 text-accent-gold" />
                        )}
                      </p>
                      <p className="text-sm text-gray-400">
                        {member.user?.server} · {member.job || member.user?.job || '직업 미설정'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {member.can_manage_schedule && (
                      <span className="badge-game badge-silver text-xs">일정</span>
                    )}
                    {member.can_manage_distribution && (
                      <span className="badge-game badge-silver text-xs">분배</span>
                    )}
                  </div>
                </div>
              ))}
              
              {/* 빈 슬롯 표시 */}
              {Array.from({ length: 8 - members.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="p-3 bg-gray-800/30 rounded-lg border border-dashed border-gray-700 flex items-center justify-center text-gray-500"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  빈 자리
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 다가오는 일정 */}
          {isMember && (
            <div className="card-game">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary-300">다가오는 일정</h3>
                <Link
                  to={`/schedule?groupId=${groupId}`}
                  className="text-sm text-primary-400 hover:text-primary-300"
                >
                  전체 보기
                </Link>
              </div>
              
              {upcomingSchedules.length === 0 ? (
                <p className="text-gray-400 text-center py-4">예정된 일정이 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {upcomingSchedules.map((schedule) => (
                    <div key={schedule.id} className="text-sm">
                      <p className="font-semibold text-white">{schedule.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-gray-400">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(schedule.scheduled_date).toLocaleDateString('ko-KR')}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {schedule.start_time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 최근 분배 */}
          {isMember && (
            <div className="card-game">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary-300">최근 분배</h3>
                <Link
                  to={`/distribution?groupId=${groupId}`}
                  className="text-sm text-primary-400 hover:text-primary-300"
                >
                  전체 보기
                </Link>
              </div>
              
              {recentDistributions.length === 0 ? (
                <p className="text-gray-400 text-center py-4">분배 내역이 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {recentDistributions.map((dist) => (
                    <div key={dist.id} className="text-sm">
                      <p className="font-medium text-white">{dist.item_name}</p>
                      <p className="text-gray-400">
                        {dist.user?.character_name} · {dist.week_number}주차
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 탈퇴 확인 모달 */}
      {showLeaveConfirm && (
        <>
          <div className="modal-backdrop" onClick={() => setShowLeaveConfirm(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="card-game max-w-md w-full">
              <h3 className="text-lg font-semibold text-white mb-4">공대 탈퇴</h3>
              <p className="text-gray-400 mb-6">
                정말로 '{raidGroup.name}' 공대를 탈퇴하시겠습니까?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="btn-game-secondary"
                >
                  취소
                </button>
                <button
                  onClick={handleLeaveGroup}
                  className="btn-game bg-red-600 hover:bg-red-700"
                >
                  탈퇴
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};