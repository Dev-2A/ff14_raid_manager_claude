import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Package, Shield, Sword } from 'lucide-react';
import { Equipment, EquipmentSlot, EquipmentType } from '../../types';
import { equipmentService } from '../../services/equipment.service';
import { Loader } from 'lucide-react';

const EquipmentListPage: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [slotFilter, setSlotFilter] = useState<EquipmentSlot | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<EquipmentType | 'all'>('all');
  const [itemLevelMin, setItemLevelMin] = useState('');
  const [itemLevelMax, setItemLevelMax] = useState('');

  useEffect(() => {
    loadEquipments();
  }, []);

  useEffect(() => {
    filterEquipments();
  }, [equipments, searchQuery, slotFilter, typeFilter, itemLevelMin, itemLevelMax]);

  const loadEquipments = async () => {
    try {
      setIsLoading(true);
      const data = await equipmentService.getEquipmentList();
      setEquipments(data);
    } catch (error: any) {
      setError(error.message || '장비 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterEquipments = () => {
    let filtered = [...equipments];

    // 검색어 필터
    if (searchQuery) {
      filtered = filtered.filter(equipment =>
        equipment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        equipment.source?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 슬롯 필터
    if (slotFilter !== 'all') {
      filtered = filtered.filter(equipment => equipment.slot === slotFilter);
    }

    // 타입 필터
    if (typeFilter !== 'all') {
      filtered = filtered.filter(equipment => equipment.equipment_type === typeFilter);
    }

    // 아이템 레벨 필터
    if (itemLevelMin) {
      filtered = filtered.filter(equipment => equipment.item_level >= parseInt(itemLevelMin));
    }
    if (itemLevelMax) {
      filtered = filtered.filter(equipment => equipment.item_level <= parseInt(itemLevelMax));
    }

    setFilteredEquipments(filtered);
  };

  const getSlotIcon = (slot: EquipmentSlot) => {
    switch (slot) {
      case EquipmentSlot.WEAPON:
        return <Sword className="w-5 h-5" />;
      case EquipmentSlot.HEAD:
      case EquipmentSlot.BODY:
      case EquipmentSlot.HANDS:
      case EquipmentSlot.LEGS:
      case EquipmentSlot.FEET:
        return <Shield className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
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
          <h1 className="text-2xl font-bold text-white">장비 목록</h1>
          <p className="text-gray-400 mt-1">게임 내 장비 정보를 관리합니다</p>
        </div>
        <Link to="/equipment/create" className="btn-game flex items-center">
          <Plus className="mr-2" size={20} />
          장비 추가
        </Link>
      </div>

      {/* 필터 영역 */}
      <div className="card-game space-y-4">
        {/* 검색바 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="장비 이름 또는 출처로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* 필터 옵션들 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 슬롯 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">슬롯</label>
            <select
              value={slotFilter}
              onChange={(e) => setSlotFilter(e.target.value as EquipmentSlot | 'all')}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            >
              <option value="all">전체</option>
              {Object.values(EquipmentSlot).map(slot => (
                <option key={slot} value={slot}>
                  {equipmentService.getSlotName(slot)}
                </option>
              ))}
            </select>
          </div>

          {/* 타입 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">타입</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as EquipmentType | 'all')}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            >
              <option value="all">전체</option>
              {Object.values(EquipmentType).map(type => (
                <option key={type} value={type}>
                  {equipmentService.getEquipmentTypeName(type)}
                </option>
              ))}
            </select>
          </div>

          {/* 아이템 레벨 최소 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">최소 아이템 레벨</label>
            <input
              type="number"
              placeholder="예: 710"
              value={itemLevelMin}
              onChange={(e) => setItemLevelMin(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* 아이템 레벨 최대 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">최대 아이템 레벨</label>
            <input
              type="number"
              placeholder="예: 730"
              value={itemLevelMax}
              onChange={(e) => setItemLevelMax(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* 장비 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipments.map((equipment) => (
          <div
            key={equipment.id}
            className="card-game hover:shadow-game transition-all cursor-pointer"
          >
            <Link to={`/equipment/${equipment.id}`} className="block">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-800 ${equipmentService.getItemLevelColorClass(equipment.item_level)}`}>
                    {getSlotIcon(equipment.slot)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{equipment.name}</h3>
                    <p className="text-sm text-gray-400">
                      {equipmentService.getSlotName(equipment.slot)} · {equipmentService.getEquipmentTypeName(equipment.equipment_type)}
                    </p>
                  </div>
                </div>
                <div className={`text-xl font-bold ${equipmentService.getItemLevelColorClass(equipment.item_level)}`}>
                  {equipment.item_level}
                </div>
              </div>

              {/* 추가 정보 */}
              <div className="space-y-2 text-sm">
                {equipment.job_category && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">직업군</span>
                    <span className="text-gray-300">{equipment.job_category}</span>
                  </div>
                )}
                {equipment.source && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">출처</span>
                    <span className="text-gray-300">{equipment.source}</span>
                  </div>
                )}
                {equipment.tome_cost > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">석판 비용</span>
                    <span className="text-yellow-400">{equipment.tome_cost}</span>
                  </div>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>

      {filteredEquipments.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400">조건에 맞는 장비가 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default EquipmentListPage;