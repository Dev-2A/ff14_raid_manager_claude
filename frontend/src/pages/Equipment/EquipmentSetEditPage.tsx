import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Package, Star, Target, CheckCircle, X, Loader } from 'lucide-react';
import { 
  EquipmentSet,
  EquipmentSetUpdate,
  Equipment, 
  EquipmentSlot, 
  RaidGroup,
  EquipmentSetItem,
  EquipmentSetItemCreate 
} from '../../types';
import { equipmentService } from '../../services/equipment.service';
import { raidService } from '../../services/raid.service';

interface SlotEquipment {
  slot: EquipmentSlot;
  equipment?: Equipment;
  existingItem?: EquipmentSetItem;
}

const EquipmentSetEditPage: React.FC = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [equipmentSet, setEquipmentSet] = useState<EquipmentSet | null>(null);
  const [raidGroup, setRaidGroup] = useState<RaidGroup | null>(null);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [formData, setFormData] = useState<EquipmentSetUpdate>({
    name: '',
    is_starting_set: false,
    is_bis_set: false,
    is_current_set: false
  });
  const [selectedEquipments, setSelectedEquipments] = useState<SlotEquipment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showEquipmentModal, setShowEquipmentModal] = useState<EquipmentSlot | null>(null);

  // 모든 슬롯 정의
  const allSlots = Object.values(EquipmentSlot);

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
      
      // 폼 데이터 초기화
      setFormData({
        name: set.name,
        is_starting_set: set.is_starting_set,
        is_bis_set: set.is_bis_set,
        is_current_set: set.is_current_set
      });
      
      // 공대 정보 로드
      if (set.raid_group_id) {
        const group = await raidService.getRaidGroup(set.raid_group_id);
        setRaidGroup(group);
      }
      
      // 장비 목록 로드
      const equipmentList = await equipmentService.getEquipmentList();
      setEquipments(equipmentList);
      
      // 기존 장비 세팅 초기화
      initializeSlots(set);
    } catch (error: any) {
      alert(error.message || '데이터를 불러오는데 실패했습니다.');
      navigate('/equipment/sets');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeSlots = (set: EquipmentSet) => {
    const slots: SlotEquipment[] = allSlots.map(slot => {
      const existingItem = set.items?.find(item => item.slot === slot);
      return {
        slot,
        equipment: existingItem?.equipment,
        existingItem
      };
    });
    setSelectedEquipments(slots);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = '세트 이름은 필수입니다.';
    }

    // 최소 1개 이상의 장비가 선택되어야 함
    const hasEquipment = selectedEquipments.some(se => se.equipment);
    if (!hasEquipment) {
      newErrors.equipment = '최소 1개 이상의 장비를 선택해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !setId || !equipmentSet) {
      return;
    }

    try {
      setIsSaving(true);
      
      // 세트 정보 업데이트
      await equipmentService.updateEquipmentSet(parseInt(setId), formData);
      
      // 장비 변경사항 처리
      for (const slotEquip of selectedEquipments) {
        // 기존 아이템이 있는 경우
        if (slotEquip.existingItem) {
          if (!slotEquip.equipment) {
            // 장비가 제거된 경우
            await equipmentService.removeItemFromSet(
              equipmentSet.id, 
              slotEquip.existingItem.id
            );
          } else if (slotEquip.equipment.id !== slotEquip.existingItem.equipment_id) {
            // 장비가 변경된 경우
            await equipmentService.updateSetItem(
              equipmentSet.id,
              slotEquip.existingItem.id,
              { equipment_id: slotEquip.equipment.id }
            );
          }
        } else if (slotEquip.equipment) {
          // 새로운 장비가 추가된 경우
          const itemData: EquipmentSetItemCreate = {
            equipment_id: slotEquip.equipment.id,
            slot: slotEquip.slot
          };
          await equipmentService.addItemToSet(equipmentSet.id, itemData);
        }
      }
      
      navigate(`/equipment/sets/${setId}`);
    } catch (error: any) {
      alert(error.message || '장비 세트 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetTypeChange = (type: 'starting' | 'current' | 'bis' | 'normal') => {
    setFormData(prev => ({
      ...prev,
      is_starting_set: type === 'starting',
      is_current_set: type === 'current',
      is_bis_set: type === 'bis'
    }));
  };

  const getSetType = () => {
    if (formData.is_bis_set) return 'bis';
    if (formData.is_current_set) return 'current';
    if (formData.is_starting_set) return 'starting';
    return 'normal';
  };

  const handleEquipmentSelect = (equipment: Equipment) => {
    setSelectedEquipments(prev => 
      prev.map(se => 
        se.slot === showEquipmentModal 
          ? { ...se, equipment } 
          : se
      )
    );
    setShowEquipmentModal(null);
    
    // 장비 에러 메시지 제거
    if (errors.equipment) {
      setErrors(prev => ({ ...prev, equipment: '' }));
    }
  };

  const handleRemoveEquipment = (slot: EquipmentSlot) => {
    setSelectedEquipments(prev => 
      prev.map(se => 
        se.slot === slot 
          ? { ...se, equipment: undefined } 
          : se
      )
    );
  };

  const getSlotEquipments = (slot: EquipmentSlot) => {
    return equipments.filter(eq => eq.slot === slot);
  };

  const calculateAverageItemLevel = (): number => {
    const equippedItems = selectedEquipments.filter(se => se.equipment);
    if (equippedItems.length === 0) return 0;
    
    const totalItemLevel = equippedItems.reduce((sum, se) => sum + (se.equipment?.item_level || 0), 0);
    return Math.round(totalItemLevel / equippedItems.length);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-primary-400" size={32} />
      </div>
    );
  }
  
  if (!equipmentSet) return <div className="error-message">세트를 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/equipment/sets/${setId}`} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">장비 세트 수정</h1>
            <p className="text-gray-400 mt-1">{equipmentSet.name}</p>
          </div>
        </div>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="card-game">
          <h2 className="text-lg font-semibold text-white mb-4">기본 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 세트 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                세트 이름 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="예: 7.1 BiS 세트"
                className={`w-full px-3 py-2 bg-gray-800 border ${
                  errors.name ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
            </div>

            {/* 공대 정보 (읽기 전용) */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">공대</label>
              <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400">
                {raidGroup?.name || '공대 정보 없음'}
              </div>
              <p className="mt-1 text-xs text-gray-500">공대는 변경할 수 없습니다</p>
            </div>
          </div>

          {/* 세트 타입 */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-400 mb-3">세트 타입</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleSetTypeChange('starting')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  getSetType() === 'starting'
                    ? 'border-blue-400 bg-blue-400/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <Target className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                <div className="text-sm text-white">시작 장비</div>
              </button>
              
              <button
                type="button"
                onClick={() => handleSetTypeChange('current')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  getSetType() === 'current'
                    ? 'border-green-400 bg-green-400/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-400" />
                <div className="text-sm text-white">현재 장비</div>
              </button>
              
              <button
                type="button"
                onClick={() => handleSetTypeChange('bis')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  getSetType() === 'bis'
                    ? 'border-yellow-400 bg-yellow-400/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <Star className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
                <div className="text-sm text-white">BiS (최종)</div>
              </button>
              
              <button
                type="button"
                onClick={() => handleSetTypeChange('normal')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  getSetType() === 'normal'
                    ? 'border-gray-400 bg-gray-400/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <Package className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                <div className="text-sm text-white">일반 세트</div>
              </button>
            </div>
          </div>
        </div>

        {/* 장비 선택 */}
        <div className="card-game">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">장비 구성</h2>
            <div className="text-sm text-gray-400">
              평균 아이템 레벨: <span className="text-white font-semibold">{calculateAverageItemLevel()}</span>
            </div>
          </div>
          
          {errors.equipment && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
              {errors.equipment}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedEquipments.map((slotEquip) => (
              <div key={slotEquip.slot} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-400 mb-1">
                    {equipmentService.getSlotName(slotEquip.slot)}
                  </div>
                  {slotEquip.equipment ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white">{slotEquip.equipment.name}</div>
                        <div className={`text-sm font-semibold ${equipmentService.getItemLevelColorClass(slotEquip.equipment.item_level)}`}>
                          IL {slotEquip.equipment.item_level}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {slotEquip.existingItem?.is_obtained && (
                          <span className="text-green-400 text-xs mr-2">획득</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveEquipment(slotEquip.slot)}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowEquipmentModal(slotEquip.slot)}
                      className="w-full py-2 border-2 border-dashed border-gray-600 rounded text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <Plus className="w-4 h-4 mx-auto" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-game flex-1 flex items-center justify-center"
          >
            {isSaving ? (
              <div className="flex items-center">
                <Loader className="animate-spin mr-2" size={20} />
                <span>저장 중...</span>
              </div>
            ) : (
              <>
                <Save className="mr-2" size={20} />
                변경사항 저장
              </>
            )}
          </button>
          <Link
            to={`/equipment/sets/${setId}`}
            className="btn-secondary flex-1 text-center"
          >
            취소
          </Link>
        </div>
      </form>

      {/* 장비 선택 모달 */}
      {showEquipmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {equipmentService.getSlotName(showEquipmentModal)} 선택
              </h3>
              <button
                onClick={() => setShowEquipmentModal(null)}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
              >
                <X className="text-gray-400" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
              <div className="grid grid-cols-1 gap-2">
                {getSlotEquipments(showEquipmentModal).map((equipment) => {
                  const isCurrentEquipment = selectedEquipments
                    .find(se => se.slot === showEquipmentModal)
                    ?.equipment?.id === equipment.id;
                  
                  return (
                    <button
                      key={equipment.id}
                      onClick={() => handleEquipmentSelect(equipment)}
                      disabled={isCurrentEquipment}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        isCurrentEquipment
                          ? 'bg-primary-600/20 border border-primary-600 cursor-not-allowed'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">
                            {equipment.name}
                            {isCurrentEquipment && <span className="ml-2 text-xs text-primary-400">(현재 선택)</span>}
                          </div>
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
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentSetEditPage;