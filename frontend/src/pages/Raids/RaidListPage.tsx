import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Users, Search, Filter, Shield, Heart, Sword, 
  Calendar, Target, ChevronRight, AlertCircle, Loader 
} from 'lucide-react';
import { raidService } from '../../services';
import { Raid, RaidGroup, DistributionMethod } from '../../types';

export const RaidListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'recruiting'>('my');
  const [raids, setRaids] = useState<Raid[]>([]);
  const [raidGroups, setRaidGroups] = useState<RaidGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<RaidGroup[]>([]);
  const [selectedRaid, setSelectedRaid] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRaids();
  }, []);

  useEffect(() => {
    if (selectedRaid) {
      loadRaidGroups(selectedRaid);
    }
  }, [selectedRaid]);

  useEffect(() => {
    filterGroups();
  }, [activeTab, raidGroups, searchQuery]);

  const loadRaids = async () => {
    try {
      const raidList = await raidService.getRaids({ is_active: true });
      setRaids(raidList);
      if (raidList.length > 0) {
        setSelectedRaid(raidList[0].id);
      }
    } catch (error) {
      console.error('Failed to load raids:', error);
      setError('레이드 목록을 불러오는데 실패했습니다.');
    }
  };

  const loadRaidGroups = async (raidId: number) => {
    setIsLoading(true);
    try {
      let groups: RaidGroup[] = [];
      
      if (activeTab === 'my') {
        // 내 공대 목록
        const myGroups = await raidService.getMyRaidGroups();
        groups = myGroups.filter(g => g.raid_id === raidId);
      } else {
        // 전체 또는 모집중인 공대
        const params = activeTab === 'recruiting' ? { is_recruiting: true } : {};
        groups = await raidService.getRaidGroups(raidId, params);
      }
      
      setRaidGroups(groups);
    } catch (error) {
      console.error('Failed to load raid groups:', error);
      setError('공대 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterGroups = () => {
    let filtered = [...raidGroups];
    
    if (searchQuery) {
      filtered = filtered.filter(group => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.leader?.character_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredGroups(filtered);
  };

  const getRoleIcon = (memberCount?: number) => {
    if (!memberCount) return null;
    // 간단한 역할 분배 추정 (실제로는 멤버 정보를 봐야 함)
    return (
      <div className="flex items-center gap-1">
        <Shield className="w-4 h-4 text-blue-400" />
        <Heart className="w-4 h-4 text-green-400" />
        <Sword className="w-4 h-4 text-red-400" />
      </div>
    );
  };

  const getDistributionMethodText = (method: DistributionMethod) => {
    return method === DistributionMethod.PRIORITY ? '우선순위' : '선착순';
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">레이드/공대 관리</h1>
          <p className="text-gray-400 mt-1">레이드 공대를 찾거나 생성하세요</p>
        </div>
        <Link to="/raids/create" className="btn-game flex items-center">
          <Plus className="mr-2" size={20} />
          공대 생성
        </Link>
      </div>

      {/* 레이드 선택 탭 */}
      <div className="card-game p-4">
        <div className="flex items-center gap-4 overflow-x-auto">
          {raids.map((raid) => (
            <button
              key={raid.id}
              onClick={() => setSelectedRaid(raid.id)}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                selectedRaid === raid.id
                  ? 'bg-primary-600 text-white shadow-game'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
              }`}
            >
              {raid.name}
              <span className="text-xs ml-2 opacity-70">{raid.tier}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="card-game">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 탭 */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('my')}
              className={`tab-game ${activeTab === 'my' ? 'tab-game-active' : ''}`}
            >
              내 공대
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`tab-game ${activeTab === 'all' ? 'tab-game-active' : ''}`}
            >
              전체
            </button>
            <button
              onClick={() => setActiveTab('recruiting')}
              className={`tab-game ${activeTab === 'recruiting' ? 'tab-game-active' : ''}`}
            >
              모집 중
            </button>
          </div>

          {/* 검색 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="공대명 또는 공대장으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-game pl-10 w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 공대 목록 */}
      {error && (
        <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 flex items-start">
          <AlertCircle className="text-red-400 mr-2 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-primary-400" size={32} />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="card-game text-center py-12">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">
            {activeTab === 'my' 
              ? '가입한 공대가 없습니다.' 
              : '검색 결과가 없습니다.'}
          </p>
          {activeTab === 'my' && (
            <button
              onClick={() => setActiveTab('recruiting')}
              className="btn-game-secondary"
            >
              모집 중인 공대 보기
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="card-game hover:border-primary-500/70 cursor-pointer transition-all hover:shadow-game-hover"
              onClick={() => navigate(`/raids/${group.id}`)}
            >
              {/* 공대 헤더 */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {group.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    공대장: {group.leader?.character_name}
                  </p>
                </div>
                {group.is_recruiting && (
                  <span className="badge-game badge-primary">
                    모집 중
                  </span>
                )}
              </div>

              {/* 공대 정보 */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">인원</span>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(group.member_count)}
                    <span className={`font-semibold ${
                      group.member_count === 8 ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {group.member_count || 0}/8
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">분배 방식</span>
                  <span className="text-white">
                    {getDistributionMethodText(group.distribution_method)}
                  </span>
                </div>

                {group.target_item_level && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">목표 IL</span>
                    <span className="text-primary-300 font-semibold">
                      {group.target_item_level}
                    </span>
                  </div>
                )}
              </div>

              {/* 설명 */}
              {group.description && (
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {group.description}
                </p>
              )}

              {/* 액션 버튼 */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <span className="text-xs text-gray-500">
                  {new Date(group.created_at).toLocaleDateString('ko-KR')} 생성
                </span>
                <ChevronRight className="text-gray-400" size={20} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};