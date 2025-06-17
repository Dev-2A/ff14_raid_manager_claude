import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { raidGroupApi, scheduleApi } from "../../api/endpoints";
import { 
  Users, Calendar, Shield, TrendingUp, 
  Clock, Target, Award, Activity, Crown,
  ChevronRight, CalendarDays, UserPlus
} from 'lucide-react';
import { formatDate, formatTime } from "../../api/config";
import { PageLoading } from "../../components/Common/LoadingScreen";
import { AttendanceStatus, ScheduleDashboard, RaidSchedule, RaidGroup } from "../../types";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // 내 공대 목록 조회
  const { data: myGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ['myRaidGroups'],
    queryFn: () => raidGroupApi.myGroups()
  });

  // 일정 대시보드 조회
  const { data: scheduleDashboard, isLoading: scheduleLoading } = useQuery<ScheduleDashboard>({
    queryKey: ['scheduleDashboard'],
    queryFn: () => scheduleApi.dashboard({ days_ahead: 7, days_behind: 7 })
  });

  if (groupsLoading || scheduleLoading) {
    return <PageLoading title="대시보드를 불러오는 중..." />;
  }

  const upcomingSchedules = scheduleDashboard?.upcoming_schedules || [];
  const todaySchedules = upcomingSchedules.filter(
    schedule => new Date(schedule.scheduled_date).toDateString() === new Date().toDateString()
  );

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div className="game-panel p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-gradient">환영합니다, {user?.character_name}님!</span>
            </h1>
            <p className="text-gray-400">
              오늘도 성공적인 레이드를 위해 화이팅!
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-sm text-gray-500">서버</p>
              <p className="font-semibold">{user?.server}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          title="참여 공대"
          value={myGroups?.length || 0}
          unit="개"
          color="text-blue-400"
          bgColor="bg-blue-900/20"
        />
        <StatCard
          icon={Calendar}
          title="이번 주 일정"
          value={upcomingSchedules.length}
          unit="개"
          color="text-green-400"
          bgColor="bg-green-900/20"
        />
        <StatCard
          icon={Shield}
          title="평균 아이템 레벨"
          value={730}
          unit=""
          color="text-purple-400"
          bgColor="bg-purple-900/20"
        />
        <StatCard
          icon={TrendingUp}
          title="출석률"
          value={92}
          unit="%"
          color="text-orange-400"
          bgColor="bg-orange-900/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 오늘의 일정 */}
        <div className="lg:col-span-2">
          <div className="game-panel">
            <div className="game-panel-header flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary-400" />
                오늘의 레이드 일정
              </h2>
              <Link to="/schedule" className="text-sm text-primary-400 hover:text-primary-300">
                전체 일정 보기 <ChevronRight className="inline w-4 h-4" />
              </Link>
            </div>
            <div className="p-6">
              {todaySchedules.length > 0 ? (
                <div className="space-y-3">
                  {todaySchedules.map(schedule => (
                    <ScheduleCard key={schedule.id} schedule={schedule} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">오늘은 예정된 레이드가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 내 공대 목록 */}
        <div>
          <div className="game-panel h-full">
            <div className="game-panel-header flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-400" />
                내 공대
              </h2>
              <Link to="/raid-groups" className="text-sm text-primary-400 hover:text-primary-300">
                전체 보기 <ChevronRight className="inline w-4 h-4" />
              </Link>
            </div>
            <div className="p-6">
              {myGroups && myGroups.length > 0 ? (
                <div className="space-y-3">
                  {myGroups.slice(0, 3).map(group => (
                    <RaidGroupCard key={group.id} group={group} />
                  ))}
                  {myGroups.length === 0 && (
                    <Link
                      to="/raid-groups/create"
                      className="block p-4 border-2 border-dashed border-dark-600 rounded-lg text-center hover:border-primary-600 transition-colors"
                    >
                      <UserPlus className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">공대 생성하기</p>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">참여 중인 공대가 없습니다.</p>
                  <Link to="/raid-groups" className="btn btn-primary btn-sm">
                    공대 찾기
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="game-panel p-6">
        <h2 className="text-xl font-bold mb-4">빠른 메뉴</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionCard
            to="/equipment/sets"
            icon={Shield}
            title="장비 세트 관리"
            color="text-purple-400"
          />
          <QuickActionCard
            to="/schedule"
            icon={Calendar}
            title="일정 확인"
            color="text-green-400"
          />
          <QuickActionCard
            to="/raid-groups"
            icon={Users}
            title="공대 관리"
            color="text-blue-400"
          />
          <QuickActionCard
            to="/profile"
            icon={Target}
            title="프로필 설정"
            color="text-orange-400"
          />
        </div>
      </div>
    </div>
  );
};

// 통계 카드 컴포넌트
const StatCard: React.FC<{
  icon: React.ElementType;
  title: string;
  value: number;
  unit: string;
  color: string;
  bgColor: string;
}> = ({ icon: Icon, title, value, unit, color, bgColor }) => {
  return (
    <div className="game-panel p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold">
            {value}<span className="text-lg font-normal text-gray-400">{unit}</span>
          </p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
};

// 일정 카드 컴포넌트
const ScheduleCard: React.FC<{ schedule: RaidSchedule }> = ({ schedule }) => {
  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.CONFIRMED: return 'text-green-400';
      case AttendanceStatus.DECLINED: return 'text-red-400';
      case AttendanceStatus.TENTATIVE: return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{schedule.title}</h3>
        <span className="text-sm text-gray-400">
          {formatTime(schedule.start_time)}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-gray-400">
            참석: {schedule.confirmed_count || 0}/8
          </span>
          {schedule.target_floors && (
            <span className="text-gray-500">
              {schedule.target_floors}
            </span>
          )}
        </div>
        <span className={`${getStatusColor(AttendanceStatus.PENDING)}`}>
          응답 필요
        </span>
      </div>
    </div>
  );
};

// 공대 카드 컴포넌트
const RaidGroupCard: React.FC<{ group: RaidGroup }> = ({ group }) => {
  const { user } = useAuth(); // user 정보 가져오기

  return (
    <Link
      to={`/raid-groups/${group.id}`}
      className="block p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{group.name}</h3>
        {group.leader_id === user?.id && (
          <Crown className="w-4 h-4 text-yellow-400" />
        )}
      </div>
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>멤버: {group.member_count || 0}/8</span>
        <span className="text-xs px-2 py-1 bg-primary-900/30 text-primary-400 rounded">
          {group.raid?.name || '레이드'}
        </span>
      </div>
    </Link>
  );
};

// 빠른 액션 카드 컴포넌트
const QuickActionCard: React.FC<{
  to: string;
  icon: React.ElementType;
  title: string;
  color: string;
}> = ({ to, icon: Icon, title, color }) => {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center p-6 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors group"
    >
      <Icon className={`w-8 h-8 ${color} mb-2 group-hover:scale-110 transition-transform`} />
      <span className="text-sm font-medium">{title}</span>
    </Link>
  );
};

export default Dashboard;