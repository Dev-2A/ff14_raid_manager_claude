import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { raidApi, raidGroupApi } from "../../api/endpoints";
import { Raid, RaidGroup } from '../../types';
import { PageLoading } from "../../components/Common/LoadingScreen";
import { 
  Users, Plus, Search, Filter, ChevronRight, 
  Crown, Clock, MapPin, Target, AlertCircle,
  Shield, UserPlus, X
} from 'lucide-react';

const RaidGroups: React.FC = () => {
  const [selectedRaid, setSelectedRaid] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    showRecruiting: false,
    showMyGroups: false,
    showFullGroups: false
  });

  // 레이드 목록 조회
  const { data: raids, isLoading: raidsLoading } = useQuery({
    queryKey: ['raids'],
    queryFn: () => raidApi.list({ is_active: true })
  });

  // 내가 속한 공대 목록 조회
  const { data: myGroups } = useQuery({
    queryKey: ['myRaidGroups'],
    queryFn: () => raidGroupApi.myGroups()
  });

  // 선택된 레이드의 공대 목록 조회
  const { data: raidGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ['raidGroups', selectedRaid],
    queryFn: () => selectedRaid ? raidGroupApi.list(selectedRaid, { is_active : true }) : Promise.resolve([]),
    enabled: !!selectedRaid
  });

  // 필터링된 공대 목록
  const filteredGroups = React.useMemo(() => {
    if (!raidGroups) return [];

    let filtered = [...raidGroups];

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 모집 중인 공대만
    if (filterOptions.showRecruiting) {
      filtered = filtered.filter(group => group.is_recruiting);
    }

    // 내 공대만
    if (filterOptions.showMyGroups && myGroups) {
      const myGroupIds = new Set(myGroups.map(g => g.id));
      filtered = filtered.filter(group => myGroupIds.has(group.id));
    }

    // 가득 찬 공대 제외
    if (!filterOptions.showFullGroups) {
      filtered = filtered.filter(group => (group.member_count || 0) < 8);
    }

    return filtered;
  }, [raidGroups, searchTerm, filterOptions, myGroups]);

  if (raidsLoading) {
    return <PageLoading title="레이드 정보를 불러오는 중..." />
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">공대 관리</h1>
          <p className="text-gray-400">레이드 공대를 찾거나 생성하세요</p>
        </div>
        <Link to="/raid-groups/create" className="btn btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          공대 생성
        </Link>
      </div>

      {/* 레이드 선택 탭 */}
      <div className="game-panel p-4">
        <div className="flex items-center gap-4 overflow-x-auto">
          <button
            onClick={() => setSelectedRaid(null)}
            className={`tab-game whitespace-nowrap ${!selectedRaid ? 'active' : ''}`}
          >
            전체 공대
          </button>
          {raids?.map(raid => (
            <button
              key={raid.id}
              onClick={() => setSelectedRaid(raid.id)}
              className={`tab-game whitespace-nowrap ${selectedRaid === raid.id ? 'active' : ''}`}
            >
              {raid.name}
            </button>
          ))}
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="game-panel p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="공대 이름으로 검색..."
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
          </div>

          {/* 필터 토글 */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`btn ${showFilter ? 'btn-primary' : 'btn-secondary'} min-w-[120px]`}
          >
            <Filter className="w-5 h-5 mr-2" />
            필터
          </button>
        </div>

        {/* 필터 옵션 */}
        {showFilter && (
          <div className="mt-4 pt-4 border-t border-dark-600">
            <div className="flex flex-wrap gap-4">
              <FilterCheckbox
                label="모집 중인 공대만"
                checked={filterOptions.showRecruiting}
                onChange={(checked) => setFilterOptions(prev => ({ ...prev, showRecruiting: checked }))}
              />
              <FilterCheckbox
                label="내 공대만"
                checked={filterOptions.showMyGroups}
                onChange={(checked) => setFilterOptions(prev => ({ ...prev, showMyGroups: checked }))}
              />
              <FilterCheckbox
                label="가득 찬 공대 포함"
                checked={filterOptions.showFullGroups}
                onChange={(checked) => setFilterOptions(prev => ({ ...prev, showFullGroups: checked }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* 공대 목록 */}
      {selectedRaid || !selectedRaid ? (
        groupsLoading ? (
          <PageLoading title="공대 목록을 불러오는 중..." />
        ) : filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map(group => (
              <RaidGroupCard key={group.id} group={group} isMyGroup={myGroups?.some(g => g.id === group.id)} />
            ))}
          </div>
        ) : (
          <EmptyState 
            searchTerm={searchTerm}
            hasFilters={filterOptions.showRecruiting || filterOptions.showMyGroups || !filterOptions.showFullGroups}
          />
        )
      ) : null}
    </div>
  );
};

// 필터 체크박스 컴포넌트
const FilterCheckbox: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 bg-dark-800 border-dark-600 rounded focus:ring-2 focus:ring-primary-500"
      />
      <span className="text-sm text-gray-300">{label}</span>
    </label>
  );
};

// 공대 카드 컴포넌트
const RaidGroupCard: React.FC<{ group: RaidGroup; isMyGroup?: boolean }> = ({ group, isMyGroup }) => {
  const memberCount = group.member_count || 0;
  const isFull = memberCount >= 8;

  return (
    <Link
      to={`/raid-groups/${group.id}`}
      className="game-panel p-6 hover:border-primary-500 transition-all duration-200 group relative overflow-hidden"
    >
      {/* 배경 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      {/* 상태 배지 */}
      <div className="relative flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold mb-1 group-hover:text-primary-300 transition-colors">
            {group.name}
          </h3>
          <p className="text-sm text-gray-400">{group.raid?.name}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isMyGroup && (
            <span className="badge badge-primary text-xs">내 공대</span>
          )}
          {group.is_recruiting && !isFull && (
            <span className="badge badge-success text-xs animate-pulse">모집중</span>
          )}
        </div>
      </div>

      {/* 공대 정보 */}
      <div className="relative space-y-3">
        {/* 공대장 */}
        <div className="flex items-center gap-2 text-sm">
          <Crown className="w-4 h-4 text-yellow-400" />
          <span className="text-gray-300">{group.leader?.character_name || '공대장'}</span>
        </div>

        {/* 멤버 수 */}
        <div className="flex items-center gap-2 text-sm">
          <Users className={`w-4 h-4 ${isFull ? 'text-red-400' : 'text-green-400'}`} />
          <span className={isFull ? 'text-red-400' : 'text-gray-300'}>
            {memberCount}/8 멤버
          </span>
          {!isFull && group.is_recruiting && (
            <span className="text-xs text-green-400">({8 - memberCount}자리 남음)</span>
          )}
        </div>

        {/* 목표 레벨 */}
        {group.target_item_level && (
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-gray-300">목표 IL {group.target_item_level}</span>
          </div>
        )}

        {/* 분배 방식 */}
        <div className="flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="text-gray-300">
            {group.distribution_method === 'priority' ? '우선순위 분배' : '선착순 분배'}
          </span>
        </div>
      </div>

      {/* 설명 */}
      {group.description && (
        <p className="relative mt-4 text-sm text-gray-400 line-clamp-2">
          {group.description}
        </p>
      )}

      {/* 호버 시 화살표 */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-6 h-6 text-primary-400" />
      </div>
    </Link>
  );
};

// 빈 상태 컴포넌트
const EmptyState: React.FC<{ searchTerm: string; hasFilters: boolean }> = ({ searchTerm, hasFilters }) => {
  return (
    <div className="game-panel p-12 text-center">
      <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2 text-gray-300">
        {searchTerm ? '검색 결과가 없습니다' : '공대를 찾을 수 없습니다'}
      </h3>
      <p className="text-gray-400 mb-6">
        {searchTerm && `"${searchTerm}"에 대한 검색 결과가 없습니다.`}
        {hasFilters && !searchTerm && '필터 조건에 맞는 공대가 없습니다.'}
        {!searchTerm && !hasFilters && '아직 생성된 공대가 없습니다.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/raid-groups/create" className="btn btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          새 공대 생성
        </Link>
        {hasFilters && (
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-secondary"
          >
            필터 초기화
          </button>
        )}
      </div>
    </div>
  );
};

export default RaidGroups;