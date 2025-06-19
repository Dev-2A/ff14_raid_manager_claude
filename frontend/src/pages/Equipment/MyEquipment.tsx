import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { equipmentSetApi, raidGroupApi } from "../../api/endpoints";
import { EquipmentSet, EquipmentSlot, EQUIPMENT_SLOT_NAMES } from "../../types";
import { PageLoading } from "../../components/Common/LoadingScreen";
import { 
  Shield, Plus, Edit2, Trash2, Crown, Sword,
  Package, ChevronRight, AlertCircle, Check,
  X, Loader2, Target, TrendingUp, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MyEquipment: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [editingSet, setEditingSet] = useState<EquipmentSet | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 내가 속한 공대 목록 조회
  const { data: myGroups } = useQuery({
    queryKey: ['myRaidGroups'],
    queryFn: () => raidGroupApi.myGroups()
  });

  // 장비 세트 목록 조회
  const { data: equipmentSets, isLoading } = useQuery({
    queryKey: ['myEquipmentSets', selectedGroupId],
    queryFn: () => equipmentSetApi.mySets(selectedGroupId || undefined)
  });

  // 장비 세트 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: (setId: number) => equipmentSetApi.delete(setId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEquipmentSets'] });
    }
  });

  // 공대별 세트 그룹화
  const setsByGroup = React.useMemo(() => {
    if (!equipmentSets || !myGroups) return new Map();

    const grouped = new Map<number, EquipmentSet[]>();

    equipmentSets.forEach(set => {
      const existing = grouped.get(set.raid_group_id) || [];
      grouped.set(set.raid_group_id, [...existing, set]);
    });

    return grouped;
  }, [equipmentSets, myGroups]);

  if (isLoading) {
    return <PageLoading title="장비 세트를 불러오는 중..." />;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">내 장비 관리</h1>
          <p className="text-gray-400">공대별 장비 세트를 관리하고 진행 상황을 확인하세요</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          세트 생성
        </button>
      </div>

      {/* 공대 필터 */}
      {myGroups && myGroups.length > 0 && (
        <div className="game-panel p-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            <button
              onClick={() => setSelectedGroupId(null)}
              className={`tab-game whitespace-nowrap ${!selectedGroupId ? 'active' : ''}`}
            >
              전체 공대
            </button>
            {myGroups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`tab-game whitespace-nowrap ${selectedGroupId === group.id ? 'active' : ''}`}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 장비 세트 목록 */}
      {equipmentSets && equipmentSets.length > 0 ? (
        <div className="space-y-6">
          {Array.from(setsByGroup.entries()).map(([groupId, sets]) => {
            const group = myGroups?.find(g => g.id === groupId);
            if (!group) return null;

            return (
              <div key={groupId} className="space-y-4">
                {/* 공대 헤더 */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-400" />
                    {group.name}
                  </h2>
                  <Link
                    to={`/raid-groups/${groupId}`}
                    className="text-sm text-primary-400 hover:text-primary-300"
                  >
                    공대 페이지 <ChevronRight className="inline w-4 h-4" />
                  </Link>
                </div>

                {/* 세트 카드들 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sets.map((set: EquipmentSet) => (
                    <EquipmentSetCard
                      key={set.id}
                      set={set}
                      onEdit={() => setEditingSet(set)}
                      onDelete={() => {
                        if (window.confirm('정말로 이 장비 세트를 삭제하시겠습니까?')) {
                          deleteMutation.mutate(set.id);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState onCreateClick={() => setShowCreateModal(true)} />
      )}

      {/* 세트 생성 모달 */}
      {showCreateModal && (
        <CreateSetModal
          groups={myGroups || []}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['myEquipmentSets'] });
          }}
        />
      )}
    </div>
  );
};

// 장비 세트 카드 컴포넌트
const EquipmentSetCard: React.FC<{
  set: EquipmentSet;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ set, onEdit, onDelete }) => {
  const obtainedCount = set.items?.filter(item => item.is_obtained).length || 0;
  const totalCount = set.items?.length || 0;
  const progress = totalCount > 0 ? (obtainedCount / totalCount) * 100 : 0;

  const getSetTypeIcon = () => {
    if (set.is_bis_set) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (set.is_starting_set) return <Shield className="w-4 h-4 text-blue-400" />;
    if (set.is_current_set) return <Sword className="w-4 h-4 text-green-400" />;
    return <Package className="w-4 h-4 text-gray-400" />;
  };

  const getSetTypeLabel = () => {
    if (set.is_bis_set) return 'BIS 세트';
    if (set.is_starting_set) return '출발 세트';
    if (set.is_current_set) return '현재 세트';
    return '일반 세트';
  };

  return (
    <div className="game-panel p-6 hover:border-primary-500 transition-all duration-200">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {getSetTypeIcon()}
          <div>
            <h3 className="font-bold">{set.name}</h3>
            <p className="text-xs text-gray-400">{getSetTypeLabel()}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1 hover:bg-dark-700 rounded transition-colors"
            aria-label="수정"
            title="수정"
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-dark-700 rounded transition-colors"
            aria-label="삭제"
            title="삭제"
          >
            <Trash2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* 아이템 레벨 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-400">평균 아이템 레벨</span>
          <span className="font-bold text-lg">{set.total_item_level || 0}</span>
        </div>
      </div>

      {/* 진행도 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">획득 진행도</span>
          <span className="text-primary-400">{obtainedCount}/{totalCount}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 액션 버튼 */}
      <Link
        to={`/equipment/sets/${set.id}`}
        className="btn btn-secondary w-full text-center"
      >
        세트 상세 보기
      </Link>
    </div>
  );
};

// 빈 상태 컴포넌트
const EmptyState: React.FC<{ onCreateClick: () => void }> = ({ onCreateClick }) => {
  return (
    <div className="game-panel p-12 text-center">
      <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2 text-gray-300">
        장비 세트가 없습니다
      </h3>
      <p className="text-gray-400 mb-6">
        첫 번째 장비 세트를 생성하여 관리를 시작하세요
      </p>
      <button onClick={onCreateClick} className="btn btn-primary mx-auto">
        <Plus className="w-5 h-5 mr-2" />
        첫 세트 생성하기
      </button>
    </div>
  );
};

// 세트 생성 모달
const CreateSetModal: React.FC<{
  groups: any[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ groups, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    raid_group_id: groups[0]?.id || 0,
    is_starting_set: false,
    is_bis_set: false,
    is_current_set: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      await equipmentSetApi.create(formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create set:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="game-panel max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4">새 장비 세트 생성</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 세트 이름 */}
          <div>
            <label htmlFor="set-name" className="label-game">
              세트 이름
            </label>
            <input
              id="set-name"
              type="text"
              required
              className="input-game"
              placeholder="예: 영웅 4층 BIS"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* 공대 선택 */}
          <div>
            <label htmlFor="raid-group" className="label-game">
              공대 선택
            </label>
            <select
              id="raid-group"
              className="input-game"
              value={formData.raid_group_id}
              onChange={(e) => setFormData({ ...formData, raid_group_id: Number(e.target.value) })}
            >
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* 세트 타입 */}
          <div className="space-y-2">
            <p className="label-game">세트 타입</p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_starting_set}
                onChange={(e) => setFormData({ ...formData, is_starting_set: e.target.checked })}
              />
              <span>출발 세트</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_bis_set}
                onChange={(e) => setFormData({ ...formData, is_bis_set: e.target.checked })}
              />
              <span>최종 BIS 세트</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_current_set}
                onChange={(e) => setFormData({ ...formData, is_current_set: e.target.checked })}
              />
              <span>현재 착용 세트</span>
            </label>
          </div>

          {/* 버튼 */}
          <div className="flex gap-4 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  생성 중...
                </span>
              ) : (
                '생성'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MyEquipment;