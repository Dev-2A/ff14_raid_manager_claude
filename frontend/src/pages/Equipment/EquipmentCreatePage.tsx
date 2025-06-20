import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Package, Loader } from 'lucide-react';
import { EquipmentCreate, EquipmentSlot, EquipmentType, Raid } from '../../types';
import { equipmentService } from '../../services/equipment.service';
import { raidService } from '../../services/raid.service';

const EquipmentCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [raids, setRaids] = useState<Raid[]>([]);
  const [formData, setFormData] = useState<EquipmentCreate>({
    name: '',
    slot: EquipmentSlot.WEAPON,
    equipment_type: EquipmentType.RAID_HERO,
    item_level: 730,
    job_category: '',
    raid_id: undefined,
    source: '',
    tome_cost: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRaids();
  }, []);

  const loadRaids = async () => {
    try {
      const raidList = await raidService.getRaids();
      setRaids(raidList);
    } catch (error) {
      console.error('Failed to load raids:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '장비 이름은 필수입니다.';
    }

    if (formData.item_level < 1 || formData.item_level > 999) {
      newErrors.item_level = '아이템 레벨은 1-999 사이여야 합니다.';
    }

    if (formData.tome_cost < 0) {
      newErrors.tome_cost = '석판 비용은 0 이상이어야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      await equipmentService.createEquipment(formData);
      navigate('/equipment');
    } catch (error: any) {
      alert(error.message || '장비 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'item_level' || name === 'tome_cost' || name === 'raid_id' 
        ? (value ? parseInt(value) : 0)
        : value
    }));
    
    // 에러 메시지 초기화
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 장비 타입 변경 시 관련 필드 자동 조정
  const handleTypeChange = (type: EquipmentType) => {
    setFormData(prev => ({
      ...prev,
      equipment_type: type,
      // 석판 장비가 아니면 석판 비용을 0으로
      tome_cost: (type === EquipmentType.TOME || type === EquipmentType.TOME_AUGMENTED) ? prev.tome_cost : 0,
      // 레이드 장비가 아니면 레이드 ID를 제거
      raid_id: (type === EquipmentType.RAID_HERO || type === EquipmentType.RAID_NORMAL) ? prev.raid_id : undefined
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/equipment" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">장비 추가</h1>
            <p className="text-gray-400 mt-1">새로운 장비 정보를 등록합니다</p>
          </div>
        </div>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="card-game space-y-6">
        {/* 기본 정보 섹션 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Package className="mr-2" size={20} />
            기본 정보
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 장비 이름 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                장비 이름 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="예: 승천의 검"
                className={`w-full px-3 py-2 bg-gray-800 border ${
                  errors.name ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
            </div>

            {/* 슬롯 */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                슬롯 <span className="text-red-400">*</span>
              </label>
              <select
                name="slot"
                value={formData.slot}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                {Object.values(EquipmentSlot).map(slot => (
                  <option key={slot} value={slot}>
                    {equipmentService.getSlotName(slot)}
                  </option>
                ))}
              </select>
            </div>

            {/* 장비 타입 */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                장비 타입 <span className="text-red-400">*</span>
              </label>
              <select
                name="equipment_type"
                value={formData.equipment_type}
                onChange={(e) => handleTypeChange(e.target.value as EquipmentType)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                {Object.values(EquipmentType).map(type => (
                  <option key={type} value={type}>
                    {equipmentService.getEquipmentTypeName(type)}
                  </option>
                ))}
              </select>
            </div>

            {/* 아이템 레벨 */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                아이템 레벨 <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                name="item_level"
                value={formData.item_level}
                onChange={handleInputChange}
                min="1"
                max="999"
                className={`w-full px-3 py-2 bg-gray-800 border ${
                  errors.item_level ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500`}
              />
              {errors.item_level && <p className="mt-1 text-sm text-red-400">{errors.item_level}</p>}
            </div>

            {/* 직업군 */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                직업군
              </label>
              <input
                type="text"
                name="job_category"
                value={formData.job_category}
                onChange={handleInputChange}
                placeholder="예: 마법DPS, 근거리DPS"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* 획득 정보 섹션 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">획득 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 레이드 (레이드 장비인 경우만) */}
            {(formData.equipment_type === EquipmentType.RAID_HERO || 
              formData.equipment_type === EquipmentType.RAID_NORMAL) && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  레이드
                </label>
                <select
                  name="raid_id"
                  value={formData.raid_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">선택하세요</option>
                  {raids.map(raid => (
                    <option key={raid.id} value={raid.id}>
                      {raid.name} ({raid.tier})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 석판 비용 (석판 장비인 경우만) */}
            {(formData.equipment_type === EquipmentType.TOME || 
              formData.equipment_type === EquipmentType.TOME_AUGMENTED) && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  석판 비용
                </label>
                <input
                  type="number"
                  name="tome_cost"
                  value={formData.tome_cost}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 bg-gray-800 border ${
                    errors.tome_cost ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500`}
                />
                {errors.tome_cost && <p className="mt-1 text-sm text-red-400">{errors.tome_cost}</p>}
              </div>
            )}

            {/* 출처 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                출처
              </label>
              <textarea
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                placeholder="예: 영웅 난이도 4층 보스 드랍"
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-game flex-1 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="flex items-center">
                <Loader className="animate-spin mr-2" size={20} />
                <span>장비 추가 중...</span>
              </div>
            ) : (
              <>
                <Save className="mr-2" size={20} />
                장비 추가
              </>
            )}
          </button>
          <Link
            to="/equipment"
            className="btn-secondary flex-1 text-center"
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
};

export default EquipmentCreatePage;