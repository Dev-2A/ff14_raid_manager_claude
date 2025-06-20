import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, Plus, Package, Star, Target, 
  CheckCircle, Check, X, Calendar, TrendingUp, Loader
} from 'lucide-react';
import { 
  EquipmentSet, 
  EquipmentSetItem, 
  Equipment,
  EquipmentSlot,
  RaidGroup 
} from '../../types';
import { equipmentService } from '../../services/equipment.service';
import { raidService } from '../../services/raid.service';

const EquipmentSetDetailPage: React.FC = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const [equipmentSet, setEquipmentSet] = useState<EquipmentSet | null>(null);
  const [raidGroup, setRaidGroup] = useState<RaidGroup | null>(null);
  const [availableEquipments, setAvailableEquipments] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showAddEquipment, setShowAddEquipment] = useState<EquipmentSlot | null>(null);

  useEffect(() => {
    if (setId) {
      loadData();
    }
  }, [setId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // 세트 정보 로드
      const set = await equipmentService.getEquipmentSet(parseInt(setId!));
      setEquipmentSet(set);
      
      // 공대 정보 로드
      if (set.raid_group_id) {
        const group = await raidService.getRaidGroup(set.raid_group_id);
        setRaidGroup(group);
      }
      
      // 전체 장비 목록 로드 (장비 추가용)
      const equipments = await equipmentService.getEquipmentList();
      setAvailableEquipments(equipments);
    } catch (error: any) {
      setError(error.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleObtained = async (item: EquipmentSetItem) => {
    if (!equipmentSet) return;

    try {
      await equipmentService.updateSetItem(equipmentSet.id, item.id, {
        is_obtained: !item.is_obtained
      });
      await loadData();
    } catch (error: any) {
      alert(error.message || '상태 변경에 실패했습니다.');
    }
  };

  const handleAddEquipment = async (equipment: Equipment) => {
    if (!equipmentSet || !showAddEquipment) return;

    try {
      await equipmentService.addItemToSet(equipmentSet.id, {
        equipment_id: equipment.id,
        slot: showAddEquipment
      });
      await loadData();
      setShowAddEquipment(null);
    } catch (error: any) {
      alert(error.message || '장비 추가에 실패했습니다.');
    }
  };

  const handleRemoveEquipment = async (itemId: number) => {
    if (!equipmentSet) return;

    try {
      await equipmentService.removeItemFromSet(equipmentSet.id, itemId);
      await loadData();
    } catch (error: any) {
      alert(error.message || '장비 제거에 실패했습니다.');
    }
  };

  const handleDeleteSet = async () => {
    if (!equipmentSet) return;

    try {
      await equipmentService.deleteEquipmentSet(equipmentSet.id);
      navigate('/equipment/sets');
    } catch (error: any) {
      alert(error.message || '세트 삭제에 실패했습니다.');
    }
  };

  const getSetTypeIcon = () => {
    if (!equipmentSet) return null;
    if (equipmentSet.is_bis_set) return <Star className="w-6 h-6 text-yellow-400" />;
    if (equipmentSet.is_current_set) return <CheckCircle className="w-6 h-6 text-green-400" />;
    if (equipmentSet.is_starting_set) return <Target className="w-6 h-6 text-blue-400" />;
    return <Package className="w-6 h-6 text-gray-400" />;
  };

  const getSetTypeName = () => {
    if (!equipmentSet) return '';
    if (equipmentSet.is_bis_set) return 'BiS (최종)';
    if (equipmentSet.is_current_set) return '현재 장비';
    if (equipmentSet.is_starting_set) return '시작 장비';
    return '일반 세트';
  };

  const calculateProgress = () => {
    if (!equipmentSet?.items || equipmentSet.items.length === 0) return 0;
    const obtained = equipmentSet.items.filter(item => item.is_obtained).length;
    return Math.round((obtained / equipmentSet.items.length) * 100);
  };

  const getSlotItems = (slot: EquipmentSlot) => {
    return equipmentSet?.items?.filter(item => item.slot === slot) || [];
  };

  const getAvailableEquipmentsForSlot = (slot: EquipmentSlot) => {
    const existingIds = equipmentSet?.items?.map(item => item.equipment_id) || [];
    return availableEquipments.filter(eq => 
      eq.slot === slot && !existingIds.includes(eq.id)
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-primary-400" size={32} />
      </div>
    );
  }
  
  if (error) return <div className="error-message">{error}</div>;
  if (!equipmentSet) return <div className="error-message">세트를 찾을 수 없습니다.</div>;

  const progress = calculateProgress();
  const allSlots = Object.values(EquipmentSlot);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/equipment/sets" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="text-gray-400" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-800 rounded-lg">
              {getSetTypeIcon()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{equipmentSet.name}</h1>
              <p className="text-gray-400 mt-1">{getSetTypeName()}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link
            to={`/equipment/sets/${equipmentSet.id}/edit`}
            className="btn-secondary flex items-center"
          >
            <Edit className="mr-2" size={18} />
            수정
          </Link>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="btn-danger flex items-center"
          >
            <Trash2 className="mr-2" size={18} />
            삭제
          </button>
        </div>
      </div>

      {/* 세트 정보 */}
      <div className="card-game">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 공대 정보 */}
          {raidGroup && (
            <div>
              <div className="text-sm text-gray-400 mb-1">공대</div>
              <div className="text-white font-medium">{raidGroup.name}</div>
            </div>
          )}
          
          {/* 평균 아이템 레벨 */}
          <div>
            <div className="text-sm text-gray-400 mb-1">평균 아이템 레벨</div>
            <div className="text-2xl font-bold text-white">{equipmentSet.total_item_level}</div>
          </div>
          
          {/* 생성일 */}
          <div>
            <div className="text-sm text-gray-400 mb-1">생성일</div>
            <div className="text-white flex items-center">
              <Calendar className="mr-2" size={16} />
              {new Date(equipmentSet.created_at).toLocaleDateString('ko-KR')}
            </div>
          </div>
        </div>

        {/* 진행도 */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-primary-400" size={20} />
              <span className="font-medium text-white">획득 진행도</span>
            </div>
            <span className="text-lg font-bold text-white">{progress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-gray-400 mt-2">
            {equipmentSet.items?.filter(item => item.is_obtained).length || 0} / {equipmentSet.items?.length || 0} 개 획득
          </div>
        </div>
      </div>

      {/* 장비 목록 */}
      <div className="card-game">
        <h2 className="text-lg font-semibold text-white mb-4">장비 구성</h2>
        
        <div className="space-y-4">
          {allSlots.map(slot => {
            const items = getSlotItems(slot);
            const hasItems = items.length > 0;
            
            return (
              <div key={slot} className="border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-white">
                    {equipmentService.getSlotName(slot)}
                  </h3>
                  {!hasItems && (
                    <button
                      onClick={() => setShowAddEquipment(slot)}
                      className="text-sm text-primary-400 hover:text-primary-300 flex items-center"
                    >
                      <Plus className="mr-1" size={16} />
                      장비 추가
                    </button>
                  )}
                </div>
                
                {hasItems ? (
                  <div className="space-y-2">
                    {items.map(item => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                          item.is_obtained 
                            ? 'bg-green-500/10 border border-green-500/30' 
                            : 'bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleObtained(item)}
                            className={`p-1 rounded transition-colors ${
                              item.is_obtained
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                          >
                            <Check size={16} />
                          </button>
                          
                          <div>
                            <div className="font-medium text-white">
                              {item.equipment?.name || 'Unknown Equipment'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {item.equipment && (
                                <>
                                  <span className={equipmentService.getItemLevelColorClass(item.equipment.item_level)}>
                                    IL {item.equipment.item_level}
                                  </span>
                                  <span className="mx-2">·</span>
                                  <span>{equipmentService.getEquipmentTypeName(item.equipment.equipment_type)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {item.is_obtained && item.obtained_at && (
                            <span className="text-xs text-gray-500">
                              {new Date(item.obtained_at).toLocaleDateString('ko-KR')}
                            </span>
                          )}
                          <button
                            onClick={() => handleRemoveEquipment(item.id)}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                          >
                            <X className="text-gray-400" size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    이 슬롯에 장비가 없습니다
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">세트 삭제</h3>
            <p className="text-gray-400 mb-6">
              정말로 "{equipmentSet.name}" 세트를 삭제하시겠습니까? 
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteSet}
                className="btn-danger flex-1"
              >
                삭제
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="btn-secondary flex-1"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 장비 추가 모달 */}
      {showAddEquipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {equipmentService.getSlotName(showAddEquipment)} 추가
              </h3>
              <button
                onClick={() => setShowAddEquipment(null)}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
              >
                <X className="text-gray-400" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
              <div className="grid grid-cols-1 gap-2">
                {getAvailableEquipmentsForSlot(showAddEquipment).map((equipment) => (
                  <button
                    key={equipment.id}
                    onClick={() => handleAddEquipment(equipment)}
                    className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{equipment.name}</div>
                        <div className="text-sm text-gray-400">
                          {equipmentService.getEquipmentTypeName(equipment.equipment_type)}
                          {equipment.source && ` · ${equipment.source}`}
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${equipmentService.getItemLevelColorClass(equipment.item_level)}`}>
                        {equipment.item_level}
                      </div>
                    </div>
                  </button>
                ))}
                
                {getAvailableEquipmentsForSlot(showAddEquipment).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    추가할 수 있는 장비가 없습니다
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentSetDetailPage;