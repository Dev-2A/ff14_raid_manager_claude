import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Calendar, Users, Package, TrendingUp, Clock, ChevronRight, 
  Sword, Shield, Heart, AlertCircle, Trophy, Target
} from 'lucide-react';
import { authService, raidService, scheduleService, distributionService } from '../services';
import { User, RaidGroup, RaidSchedule, DistributionHistory, ResourceRequirement, AttendanceStatus } from '../types';

interface DashboardStats {
  totalRaidGroups: number;
  upcomingSchedules: number;
  completedRaids: number;
  averageItemLevel: number;
}

export const DashboardPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myRaidGroups, setMyRaidGroups] = useState<RaidGroup[]>([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState<RaidSchedule[]>([]);
  const [recentDistributions, setRecentDistributions] = useState<DistributionHistory[]>([]);
  const [resourceProgress, setResourceProgress] = useState<ResourceRequirement[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRaidGroups: 0,
    upcomingSchedules: 0,
    completedRaids: 0,
    averageItemLevel: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // 현재 사용자 정보
      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      // 내가 속한 공대 목록
      const groups = await raidService.getMyRaidGroups();
      setMyRaidGroups(groups);

      // 일정 대시보드
      const dashboard = await scheduleService.getScheduleDashboard({
        days_ahead: 7,
        days_behind: 0
      });
      setUpcomingSchedules(dashboard.upcoming_schedules.slice(0, 5));

      // 최근 분배 내역 (첫 번째 공대 기준)
      if (groups.length > 0) {
        const distributions = await distributionService.getDistributionHistory(groups[0].id, {
          limit: 5
        });
        setRecentDistributions(distributions);

        // 재화 진행도
        const resources = await distributionService.getResourceRequirements(groups[0].id);
        setResourceProgress(resources);
      }

      // 통계
      setStats({
        totalRaidGroups: groups.length,
        upcomingSchedules: dashboard.upcoming_schedules.length,
        completedRaids: 0, //TODO - 실제 데이터로 변경
        averageItemLevel: 0 //TODO - 실제 데이터로 변경
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">대시보드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div className="bg-gradient-to-r from-primary-900/30 to-secondary-900/30 rounded-xl p-6 border border-primary-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              환영합니다, {currentUser?.character_name}님!
            </h1>
            <p className="text-gray-400">
              {currentUser?.server} 서버 · {currentUser?.job || '직업 미설정'} · 
              <span className="text-primary-300 ml-2">
                {myRaidGroups.length}개의 공대 활동 중
              </span>
            </p>
          </div>
          <div className="hidden md:block">
            <Trophy className="w-16 h-16 text-accent-gold opacity-50" />
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-game">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">활동 중인 공대</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalRaidGroups}</p>
            </div>
            <Users className="w-10 h-10 text-primary-400 opacity-50" />
          </div>
        </div>

        <div className="card-game">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">예정된 레이드</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.upcomingSchedules}</p>
            </div>
            <Calendar className="w-10 h-10 text-secondary-400 opacity-50" />
          </div>
        </div>

        <div className="card-game">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">완료한 레이드</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.completedRaids}</p>
            </div>
            <Trophy className="w-10 h-10 text-accent-gold opacity-50" />
          </div>
        </div>

        <div className="card-game">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">평균 아이템 레벨</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats.averageItemLevel || '-'}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-400 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 내 공대 목록 */}
        <div className="lg:col-span-1">
          <div className="card-game h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary-300">내 공대</h2>
              <Link to="/raids" className="text-sm text-primary-400 hover:text-primary-300">
                전체 보기 <ChevronRight className="inline w-4 h-4" />
              </Link>
            </div>

            {myRaidGroups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">아직 가입한 공대가 없습니다</p>
                <Link to="/raids" className="btn-game-secondary text-sm">
                  공대 찾기
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myRaidGroups.map((group) => (
                  <Link
                    key={group.id}
                    to={`/raids/${group.id}`}
                    className="block p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-primary-600/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{group.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {group.raid?.name} · {group.member_count || 0}/8명
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    </div>
                    {group.target_item_level && (
                      <div className="mt-2">
                        <span className="badge-game badge-primary text-xs">
                          목표 IL {group.target_item_level}
                        </span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 다가오는 일정 */}
        <div className="lg:col-span-2">
          <div className="card-game h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary-300">다가오는 레이드 일정</h2>
              <Link to="/schedule" className="text-sm text-primary-400 hover:text-primary-300">
                전체 보기 <ChevronRight className="inline w-4 h-4" />
              </Link>
            </div>

            {upcomingSchedules.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">예정된 레이드가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{schedule.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(schedule.scheduled_date).toLocaleDateString('ko-KR')}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {schedule.start_time}
                          </span>
                          {schedule.target_floors && (
                            <span className="flex items-center">
                              <Target className="w-4 h-4 mr-1" />
                              {schedule.target_floors}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-gray-400">
                          {scheduleService.getTimeUntilSchedule(
                            schedule.scheduled_date,
                            schedule.start_time
                          )}
                        </p>
                        <div className="mt-2">
                          <span className={`badge-game text-xs ${
                            schedule.confirmed_count! >= 8 
                              ? 'badge-primary' 
                              : 'bg-yellow-900/30 text-yellow-400 border-yellow-600/50'
                          }`}>
                            참석 {schedule.confirmed_count}/8
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 최근 분배 내역 & 재화 진행도 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 분배 내역 */}
        <div className="card-game">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary-300">최근 아이템 분배</h2>
            <Link to="/distribution" className="text-sm text-primary-400 hover:text-primary-300">
              전체 보기 <ChevronRight className="inline w-4 h-4" />
            </Link>
          </div>

          {recentDistributions.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">최근 분배 내역이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDistributions.map((dist) => (
                <div key={dist.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      getRoleClass(dist.user?.job)
                    }`}>
                      {getRoleIcon(dist.user?.job)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {dist.item_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {dist.user?.character_name} · {dist.week_number}주차
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(dist.distributed_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 재화 진행도 */}
        <div className="card-game">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary-300">재화 진행도</h2>
            <Link to="/equipment" className="text-sm text-primary-400 hover:text-primary-300">
              상세 보기 <ChevronRight className="inline w-4 h-4" />
            </Link>
          </div>

          {resourceProgress.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">재화 요구량을 계산해주세요</p>
              <Link to="/equipment" className="btn-game-secondary text-sm">
                장비 세트 설정
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {resourceProgress.slice(0, 3).map((resource) => {
                const mainResources = ['석판', '경화약', '강화섬유'];
                const topResources = Object.entries(resource.remaining_resources)
                  .filter(([key]) => mainResources.includes(key))
                  .slice(0, 3);

                return (
                  <div key={resource.id}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white">
                        {resource.user_id === currentUser?.id ? '내 진행도' : '공대원 진행도'}
                      </p>
                      <span className="text-sm text-primary-300">
                        {resource.completion_percentage}%
                      </span>
                    </div>
                    <div className="progress-bar-game mb-3">
                      <div 
                        className="progress-bar-fill"
                        style={{ width: `${resource.completion_percentage}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {topResources.map(([name, value]) => (
                        <div key={name} className="text-center">
                          <p className="text-gray-400">{distributionService.getResourceName(name)}</p>
                          <p className="text-white font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/raids/create" className="btn-game-secondary text-center">
          <Users className="w-5 h-5 mx-auto mb-1" />
          공대 생성
        </Link>
        <Link to="/schedule/create" className="btn-game-secondary text-center">
          <Calendar className="w-5 h-5 mx-auto mb-1" />
          일정 추가
        </Link>
        <Link to="/equipment/sets" className="btn-game-secondary text-center">
          <Package className="w-5 h-5 mx-auto mb-1" />
          장비 세트
        </Link>
        <Link to="/distribution/history" className="btn-game-secondary text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-1" />
          분배 내역
        </Link>
      </div>
    </div>
  );
};