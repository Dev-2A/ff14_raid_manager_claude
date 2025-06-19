import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { distributionApi, raidGroupApi } from "../../api/endpoints";
import { useAuth, usePermission } from "../../contexts/AuthContext";
import {
  DistributionHistory, RaidGroup, RaidMember, ItemType,
  ITEM_TYPE_NAMES
} from "../../types"
import { PageLoading } from "../../components/Common/LoadingScreen";
import { 
  Calendar, Package, User, ChevronRight, Trash2,
  Filter, Download, TrendingUp, Clock,
  AlertCircle, Search, X
} from 'lucide-react';
import { formatDate } from "../../api/config";

const DistributionHistoryPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isRaidLeader } = usePermission();

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<ItemType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 공대 정보 조회
  const { data: raidGroup } = useQuery<RaidGroup>({
    queryKey: ['raidGroup', groupId],
    queryFn: () => raidGroupApi.get(Number(groupId)),
    enabled: !!groupId
  });

  // 공대원 목록 조회
  const { data: members } = useQuery<RaidMember[]>({
    queryKey: ['raidGroupMembers', groupId],
    queryFn: () => raidGroupApi.members(Number(groupId)),
    enabled: !!groupId
  });

  // 분배 이력 조회
  const { data: history, isLoading } = useQuery<DistributionHistory[]>({
    queryKey: ['distributionHistory', groupId, selectedWeek, selectedUserId, selectedItemType],
    queryFn: () => distributionApi.history(Number(groupId), {
      week_number: selectedWeek || undefined,
      user_id: selectedUserId || undefined,
      item_type: selectedItemType || undefined
    }),
    enabled: !!groupId
  });

  // 이력 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: (historyId: number) =>
      distributionApi.deleteHistory(Number(groupId), historyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributionHistory'] });
    }
  });

  // 권한 확인
  const currentMember = members?.find(m => m.user_id === user?.id);
  const canManage = isRaidLeader(raidGroup?.leader_id || 0) || currentMember?.can_manage_distribution;

  // 필터링된 이력
  const filteredHistory = React.useMemo(() => {
    if (!history) return [];

    return history.filter(h =>
      h.item_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  // 주차별 그룹화
  const historyByWeek = React.useMemo(() => {
    if (!filteredHistory) return new Map();

    const grouped = new Map<number, DistributionHistory[]>();

    filteredHistory.forEach(h => {
      const existing = grouped.get(h.week_number) || [];
      grouped.set(h.week_number, [...existing, h]);
    });

    // 주차 내림차순 정렬
    return new Map([...grouped.entries()].sort((a, b) => b[0] - a[0]));
  }, [filteredHistory]);

  // 통계 계산
  const statistics = React.useMemo(() => {
    if (!filteredHistory) return { totalItems: 0, byUser: {}, byType: {} };

    const byUser: Record<number, number> = {};
    const byType: Record<string, number> = {};

    filteredHistory.forEach(h => {
      byUser[h.user_id] = (byUser[h.user_id] || 0) + 1;
      byType[h.item_type] = (byType[h.item_type] || 0) + 1;
    });

    return {
      totalItems: filteredHistory.length,
      byUser,
      byType
    };
  }, [filteredHistory]);

  if (!groupId) {
    return (
      <div className="game-panel p-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">공대를 선택해주세요</h2>
        <Link to="/raid-groups" className="btn btn-primary mt-4">
          공대 목록으로
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <PageLoading title="분배 이력을 불러오는 중..." />;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to={`/distribution/${groupId}`}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            aria-label="뒤로 가기"
            title="뒤로 가기"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">분배 이력</h1>
            <p className="text-gray-400">{raidGroup?.name}</p>
          </div>
        </div>
        
        <button className="btn btn-secondary">
          <Download className="w-5 h-5 mr-2" />
          내보내기
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Package}
          label="총 분배 아이템"
          value={statistics.totalItems}
          color="text-blue-400"
        />
        <StatCard
          icon={User}
          label="참여 인원"
          value={Object.keys(statistics.byUser).length}
          color="text-green-400"
        />
        <StatCard
          icon={TrendingUp}
          label="이번 주 분배"
          value={historyByWeek.get(getCurrentWeek())?.length || 0}
          color="text-purple-400"
        />
      </div>

      {/* 필터 및 검색 */}
      <div className="game-panel p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="아이템 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-game pl-12 w-full"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                aria-label="검색어 지우기"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* 필터 */}
          <div className="flex gap-2">
            {/* 주차 필터 */}
            <select
              value={selectedWeek || ''}
              onChange={(e) => setSelectedWeek(e.target.value ? Number(e.target.value) : null)}
              className="input-game"
            >
              <option value="">모든 주차</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(week => (
                <option key={week} value={week}>{week}주차</option>
              ))}
            </select>

            {/* 멤버 필터 */}
            <select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
              className="input-game"
            >
              <option value="">모든 멤버</option>
              {members?.map(member => (
                <option key={member.id} value={member.user_id}>
                  {member.user?.character_name}
                </option>
              ))}
            </select>

            {/* 아이템 타입 필터 */}
            <select
              value={selectedItemType || ''}
              onChange={(e) => setSelectedItemType(e.target.value as ItemType || null)}
              className="input-game"
            >
              <option value="">모든 타입</option>
              {Object.entries(ITEM_TYPE_NAMES).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 이력 목록 */}
      {historyByWeek.size > 0 ? (
        <div className="space-y-6">
          {Array.from(historyByWeek.entries()).map(([week, items]) => (
            <WeekSection
              key={week}
              week={week}
              items={items}
              members={members || []}
              canManage={canManage || false}
              onDelete={(id) => {
                if (window.confirm('정말로 이 분배 기록을 삭제하시겠습니까?')) {
                  deleteMutation.mutate(id);
                }
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

// 통계 카드 컴포넌트
const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}> = ({ icon: Icon, label, value, color }) => {
  return (
    <div className="game-panel p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${color} opacity-50`} />
      </div>
    </div>
  );
};

// 주차별 섹션 컴포넌트
const WeekSection: React.FC<{
  week: number;
  items: DistributionHistory[];
  members: RaidMember[];
  canManage: boolean;
  onDelete: (id: number) => void;
}> = ({ week, items, members, canManage, onDelete }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary-400" />
        {week}주차
      </h2>
      
      <div className="grid gap-2">
        {items.map(item => (
          <HistoryItem
            key={item.id}
            item={item}
            member={members.find(m => m.user_id === item.user_id)}
            canManage={canManage}
            onDelete={() => onDelete(item.id)}
          />
        ))}
      </div>
    </div>
  );
};

// 이력 아이템 컴포넌트
const HistoryItem: React.FC<{
  item: DistributionHistory;
  member?: RaidMember;
  canManage: boolean;
  onDelete: () => void;
}> = ({ item, member, canManage, onDelete }) => {
  const getItemTypeColor = (type: ItemType) => {
    switch (type) {
      case ItemType.WEAPON_COFFER: return 'bg-red-900/30 border-red-600';
      case ItemType.EQUIPMENT_COFFER: return 'bg-blue-900/30 border-blue-600';
      case ItemType.UPGRADE_ITEM: return 'bg-purple-900/30 border-purple-600';
      case ItemType.TOME_MATERIAL: return 'bg-green-900/30 border-green-600';
      case ItemType.TOKEN: return 'bg-yellow-900/30 border-yellow-600';
      case ItemType.MOUNT: return 'bg-orange-900/30 border-orange-600';
      default: return 'bg-gray-900/30 border-gray-600';
    }
  };

  return (
    <div className={`game-panel p-4 ${getItemTypeColor(item.item_type)} border-l-4`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h4 className="font-bold">{item.item_name}</h4>
            <span className="text-sm text-gray-400">
              {ITEM_TYPE_NAMES[item.item_type]}
            </span>
            {item.floor_number && (
              <span className="text-sm text-gray-500">{item.floor_number}층</span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {member?.user?.character_name || 'Unknown'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDate(item.distributed_at)}
            </span>
          </div>
          
          {item.notes && (
            <p className="mt-2 text-sm text-gray-500 italic">{item.notes}</p>
          )}
        </div>
        
        {canManage && (
          <button
            onClick={onDelete}
            className="p-2 hover:bg-dark-700 rounded transition-colors ml-4"
            aria-label="삭제"
            title="삭제"
          >
            <Trash2 className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
};

// 빈 상태 컴포넌트
const EmptyState: React.FC = () => {
  return (
    <div className="game-panel p-12 text-center">
      <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2 text-gray-300">
        분배 이력이 없습니다
      </h3>
      <p className="text-gray-400">
        아직 기록된 아이템 분배가 없습니다
      </p>
    </div>
  );
};

// 현재 주차 계산 함수
const getCurrentWeek = (): number => {
  // 실제로는 레이드 시작일 기준으로 계산해야 함
  const startDate = new Date('2024-01-02'); // 예시: 레이드 시작일
  const now = new Date();
  const diff = now.getTime() - startDate.getTime();
  const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  return weeks + 1;
};

export default DistributionHistoryPage;