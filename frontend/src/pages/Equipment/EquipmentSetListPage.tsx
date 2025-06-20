import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, Star, Target, CheckCircle, Edit, Trash2, Copy, Loader } from 'lucide-react';
import { EquipmentSet, RaidGroup } from '../../types';
import { equipmentService } from '../../services/equipment.service';
import { raidService } from '../../services/raid.service';

const EquipmentSetListPage: React.FC = () => {
  const [equipmentSets, setEquipmentSets] = useState<EquipmentSet[]>([]);
  const [raidGroups, setRaidGroups] = useState<RaidGroup[]>([]);
  const [selectedRaidGroup, setSelectedRaidGroup] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedRaidGroup]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // 공대 목록 로드
      const groups = await raidService.getMyRaidGroups();
      setRaidGroups(groups);
      
      // 장비 세트 로드
      const sets = await equipmentService.getMyEquipmentSets(selectedRaidGroup || undefined);
      setEquipmentSets(sets);
    } catch (error: any) {
      setError(error.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSet = async (setId: number) => {
    try {
      await equipmentService.deleteEquipmentSet(setId);
      await loadData();
      setDeleteConfirm(null);
    } catch (error: any) {
      alert(error.message || '장비 세트 삭제에 실패했습니다.');
    }
  };

  const handleDuplicateSet = async (set: EquipmentSet) => {
    try {
      // 세트 복제 (이름에 "복사본" 추가)
      const newSet = await equipmentService.createEquipmentSet({
        name: `${set.name} (복사본)`,
        raid_group_id: set.raid_group_id,
        is_starting_set: false,
        is_bis_set: false,
        is_current_set: false
      });

      // 기존 세트의 아이템들도 복제
      if (set.items) {
        for (const item of set.items) {
          await equipmentService.addItemToSet(newSet.id, {
            equipment_id: item.equipment_id,
            slot: item.slot
          });
        }
      }

      await loadData();
    } catch (error: any) {
      alert(error.message || '장비 세트 복제에 실패했습니다.');
    }
  };

  const getSetTypeIcon = (set: EquipmentSet) => {
    if (set.is_bis_set) return <Star className="w-5 h-5 text-yellow-400" />;
    if (set.is_current_set) return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (set.is_starting_set) return <Target className="w-5 h-5 text-blue-400" />;
    return <Package className="w-5 h-5 text-gray-400" />;
  };

  const getSetTypeName = (set: EquipmentSet) => {
    if (set.is_bis_set) return 'BiS (최종)';
    if (set.is_current_set) return '현재 장비';
    if (set.is_starting_set) return '시작 장비';
    return '일반 세트';
  };

  const getSetTypeClass = (set: EquipmentSet) => {
    if (set.is_bis_set) return 'border-yellow-400 bg-yellow-400/10';
    if (set.is_current_set) return 'border-green-400 bg-green-400/10';
    if (set.is_starting_set) return 'border-blue-400 bg-blue-400/10';
    return '';
  };

  const calculateProgress = (set: EquipmentSet): number => {
    if (!set.items || set.items.length === 0) return 0;
    const obtained = set.items.filter(item => item.is_obtained).length;
    return Math.round((obtained / set.items.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-primary-400" size={32} />
      </div>
    );
  }
  
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">내 장비 세트</h1>
          <p className="text-gray-400 mt-1">장비 세트를 관리하고 진행도를 확인하세요</p>
        </div>
        <Link to="/equipment/sets/create" className="btn-game flex items-center">
          <Plus className="mr-2" size={20} />
          세트 생성
        </Link>
      </div>

      {/* 공대 필터 */}
      {raidGroups.length > 0 && (
        <div className="card-game p-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            <button
              onClick={() => setSelectedRaidGroup(null)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedRaidGroup === null
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              전체
            </button>
            {raidGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedRaidGroup(group.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedRaidGroup === group.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 장비 세트 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipmentSets.map((set) => {
          const progress = calculateProgress(set);
          const raidGroup = raidGroups.find(g => g.id === set.raid_group_id);
          
          return (
            <div
              key={set.id}
              className={`card-game hover:shadow-game transition-all ${getSetTypeClass(set)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-800">
                    {getSetTypeIcon(set)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{set.name}</h3>
                    <p className="text-sm text-gray-400">{getSetTypeName(set)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{set.total_item_level}</div>
                  <div className="text-xs text-gray-400">평균 아이템 레벨</div>
                </div>
              </div>

              {/* 공대 정보 */}
              {raidGroup && (
                <div className="mb-3 text-sm text-gray-400">
                  공대: {raidGroup.name}
                </div>
              )}

              {/* 진행도 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">획득 진행도</span>
                  <span className="text-sm font-medium text-white">{progress}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {set.items && (
                  <div className="text-xs text-gray-500 mt-1">
                    {set.items.filter(item => item.is_obtained).length} / {set.items.length} 개 획득
                  </div>
                )}
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-2">
                <Link
                  to={`/equipment/sets/${set.id}`}
                  className="btn-secondary flex-1 flex items-center justify-center text-sm"
                >
                  <Package className="mr-1" size={16} />
                  상세보기
                </Link>
                <button
                  onClick={() => handleDuplicateSet(set)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="세트 복제"
                >
                  <Copy className="text-gray-400" size={16} />
                </button>
                <Link
                  to={`/equipment/sets/${set.id}/edit`}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="세트 수정"
                >
                  <Edit className="text-gray-400" size={16} />
                </Link>
                <button
                  onClick={() => setDeleteConfirm(set.id)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="세트 삭제"
                >
                  <Trash2 className="text-gray-400" size={16} />
                </button>
              </div>

              {/* 삭제 확인 */}
              {deleteConfirm === set.id && (
                <div className="absolute inset-0 bg-gray-900/95 rounded-lg flex items-center justify-center p-4">
                  <div className="text-center">
                    <p className="text-white mb-4">정말 이 세트를 삭제하시겠습니까?</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleDeleteSet(set.id)}
                        className="btn-danger text-sm"
                      >
                        삭제
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="btn-secondary text-sm"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {equipmentSets.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 mb-4">아직 생성한 장비 세트가 없습니다.</p>
          <Link to="/equipment/sets/create" className="btn-game inline-flex items-center">
            <Plus className="mr-2" size={20} />
            첫 세트 만들기
          </Link>
        </div>
      )}

      {/* 세트 타입 설명 */}
      <div className="card-game bg-gray-800/50">
        <h3 className="text-lg font-semibold text-white mb-3">세트 타입 안내</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-3">
            <Target className="text-blue-400" size={20} />
            <div>
              <span className="font-medium text-white">시작 장비</span>
              <span className="text-gray-400 ml-2">레이드 입문 시 목표 장비</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-400" size={20} />
            <div>
              <span className="font-medium text-white">현재 장비</span>
              <span className="text-gray-400 ml-2">현재 착용 중인 장비</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Star className="text-yellow-400" size={20} />
            <div>
              <span className="font-medium text-white">BiS (최종)</span>
              <span className="text-gray-400 ml-2">최종 목표 장비 세트</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Package className="text-gray-400" size={20} />
            <div>
              <span className="font-medium text-white">일반 세트</span>
              <span className="text-gray-400 ml-2">기타 장비 조합</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentSetListPage;