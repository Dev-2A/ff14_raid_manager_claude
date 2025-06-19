import React, { useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { equipmentSetApi, equipmentApi, raidGroupApi } from "../../api/endpoints";
import {
  EquipmentSet, EquipmentSlot, Equipment, RaidGroup,
  EQUIPMENT_SLOT_NAMES, EQUIPMENT_TYPE_NAMES,
  EquipmentType
} from "../../types";
import { PageLoading } from "../../components/Common/LoadingScreen";
import { 
  Shield, Crown, Sword, Plus, Check, X, 
  Search, Filter, Package, Target, TrendingUp,
  ChevronRight, AlertCircle, Edit2, Save
} from 'lucide-react';

const EquipmentSets: React.FC = () => {
  const { setId } = useParams<{ setId: string }>();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');

  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<EquipmentType | null>(null);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);

  // 장비 세트 상세 조회
  const { data: equipmentSet, isLoading: setLoading } = useQuery<EquipmentSet>({
  queryKey: ['equipmentSet', setId],
  queryFn: () => equipmentSetApi.get(Number(setId)),
  enabled: !!setId
  });

  // 공대 정보 조회
  const { data: raidGroup } = useQuery<RaidGroup>({
  queryKey: ['raidGroup', equipmentSet?.raid_group_id],
  queryFn: () => raidGroupApi.get(equipmentSet!.raid_group_id),
  enabled: !!equipmentSet?.raid_group_id
  });

  // 장비 목록 조회 (모달용)
  const { data: availableEquipment } = useQuery<Equipment[]>({
    queryKey: ['equipment', selectedSlot, filterType],
    queryFn: () => equipmentApi.list({
      slot: selectedSlot || undefined,
      equipment_type: filterType || undefined,
      is_active: true
    }),
    enabled: showEquipmentModal && !!selectedSlot
  });

  // 필터링된 장비 목록
  const filteredEquipment = React.useMemo(() => {
    if (!availableEquipment) return [];

    return availableEquipment.filter(eq =>
      eq.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableEquipment, searchTerm]);

  if (!setId) {
    return <MyEquipmentSets />
  }

  if (setLoading) {
    return <PageLoading title="장비 세트를 불러오는 중..." />;
  }

  if (!equipmentSet) {
    return (
      <div className="game-panel p-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">장비 세트를 찾을 수 없습니다</h2>
        <Link to="/equipment" className="btn btn-primary mt-4">
          장비 관리로 돌아가기
        </Link>
      </div>
    );
  }

  const getSetTypeIcon = () => {
    if (equipmentSet.is_bis_set) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (equipmentSet.is_starting_set) return <Shield className="w-6 h-6 text-blue-400" />;
    if (equipmentSet.is_current_set) return <Sword className="w-6 h-6 text-green-400" />;
    return <Package className="w-6 h-6 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/equipment" 
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            aria-label="뒤로 가기"
            title="뒤로 가기"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </Link>
          <div className="flex items-center gap-3">
            {getSetTypeIcon()}
            <div>
              <h1 className="text-3xl font-bold">{equipmentSet.name}</h1>
              <p className="text-gray-400">{raidGroup?.name} • 평균 IL {equipmentSet.total_item_level}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 진행 상황 */}
      <div className="game-panel p-6">
        <h2 className="text-xl font-bold mb-4">획득 진행도</h2>
        <ProgressOverview items={equipmentSet.items || []} />
      </div>

      {/* 장비 슬롯 그리드 */}
      <div className="game-panel p-6">
        <h2 className="text-xl font-bold mb-4">장비 구성</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.values(EquipmentSlot).map(slot => {
            const item = equipmentSet.items?.find(i => i.slot === slot);
            return (
              <EquipmentSlotCard
                key={slot}
                slot={slot}
                item={item}
                onEdit={() => {
                  setSelectedSlot(slot);
                  setShowEquipmentModal(true);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* 장비 선택 모달 */}
      {showEquipmentModal && selectedSlot && (
        <EquipmentSelectModal
          slot={selectedSlot}
          currentItem={equipmentSet.items?.find(i => i.slot === selectedSlot)}
          equipment={filteredEquipment}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterType={filterType}
          onFilterChange={setFilterType}
          onSelect={async (equipment) => {
            try {
              await equipmentSetApi.addItem(equipmentSet.id, {
                equipment_id: equipment.id,
                slot: selectedSlot
              });
              // 성공 시 리프레시
              window.location.reload();
            } catch (error) {
              console.error('Failed to add item:', error);
            }
          }}
          onClose={() => {
            setShowEquipmentModal(false);
            setSelectedSlot(null);
            setSearchTerm('');
            setFilterType(null);
          }}
        />
      )}
    </div>
  );
};

// 내 장비 세트 목록 (setId가 없을 때)
const MyEquipmentSets: React.FC = () => {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');

  const { data: equipmentSets, isLoading } = useQuery({
    queryKey: ['myEquipmentSets', groupId],
    queryFn: () => equipmentSetApi.mySets(groupId ? Number(groupId) : undefined)
  });

  if (isLoading) {
    return <PageLoading title="장비 세트를 불러오는 중..." />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">장비 세트 목록</h1>
      
      {equipmentSets && equipmentSets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipmentSets.map(set => (
            <Link
              key={set.id}
              to={`/equipment/sets/${set.id}`}
              className="game-panel p-6 hover:border-primary-500 transition-all"
            >
              <h3 className="font-bold mb-2">{set.name}</h3>
              <p className="text-sm text-gray-400">평균 IL: {set.total_item_level}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="game-panel p-12 text-center">
          <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">장비 세트가 없습니다</p>
          <Link to="/equipment" className="btn btn-primary mt-4">
            장비 관리로 이동
          </Link>
        </div>
      )}
    </div>
  );
};

// 진행도 개요 컴포넌트
const ProgressOverview: React.FC<{ items: any[] }> = ({ items }) => {
  const totalSlots = Object.keys(EquipmentSlot).length;
  const filledSlots = items.length;
  const obtainedSlots = items.filter(item => item.is_obtained).length;

  const fillProgress = (filledSlots / totalSlots) * 100;
  const obtainProgress = (obtainedSlots / totalSlots) * 100;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">장비 등록</span>
          <span>{filledSlots}/{totalSlots}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${fillProgress}%` }} />
        </div>
      </div>
      
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">장비 획득</span>
          <span className="text-green-400">{obtainedSlots}/{totalSlots}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill bg-gradient-to-r from-green-600 to-green-400" 
               style={{ width: `${obtainProgress}%` }} />
        </div>
      </div>
    </div>
  );
};

// 장비 슬롯 카드 컴포넌트
const EquipmentSlotCard: React.FC<{
  slot: EquipmentSlot;
  item?: any;
  onEdit: () => void;
}> = ({ slot, item, onEdit }) => {
  const isEmpty = !item;
  const isObtained = item?.is_obtained;

  return (
    <div 
      className={`
        equipment-slot flex-col p-4 cursor-pointer
        ${isEmpty ? 'border-dashed' : ''}
        ${isObtained ? 'border-green-500 bg-green-900/20' : ''}
      `}
      onClick={onEdit}
    >
      <div className="text-xs text-gray-400 mb-2">
        {EQUIPMENT_SLOT_NAMES[slot]}
      </div>
      
      {item ? (
        <>
          <div className="text-sm font-medium mb-1 line-clamp-2">
            {item.equipment?.name || 'Unknown'}
          </div>
          <div className="text-xs text-gray-500">
            IL {item.equipment?.item_level || 0}
          </div>
          {isObtained && (
            <Check className="w-4 h-4 text-green-400 mt-2" />
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <Plus className="w-6 h-6 text-gray-600" />
        </div>
      )}
    </div>
  );
};

// 장비 선택 모달
const EquipmentSelectModal: React.FC<{
  slot: EquipmentSlot;
  currentItem?: any;
  equipment: Equipment[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterType: EquipmentType | null;
  onFilterChange: (type: EquipmentType | null) => void;
  onSelect: (equipment: Equipment) => void;
  onClose: () => void;
}> = ({ 
  slot, currentItem, equipment, searchTerm, onSearchChange,
  filterType, onFilterChange, onSelect, onClose 
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="game-panel max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-dark-600">
          <h3 className="text-xl font-bold mb-2">
            {EQUIPMENT_SLOT_NAMES[slot]} 선택
          </h3>
          
          {/* 검색 및 필터 */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="장비 이름으로 검색..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="input-game pl-10 w-full"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
            
            <select
              value={filterType || ''}
              onChange={(e) => onFilterChange(e.target.value as EquipmentType || null)}
              className="input-game"
            >
              <option value="">모든 타입</option>
              {Object.entries(EQUIPMENT_TYPE_NAMES).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* 장비 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
          {equipment.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {equipment.map(eq => (
                <EquipmentOption
                  key={eq.id}
                  equipment={eq}
                  isCurrent={currentItem?.equipment_id === eq.id}
                  onSelect={() => {
                    onSelect(eq);
                    onClose();
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">해당하는 장비가 없습니다</p>
            </div>
          )}
        </div>
        
        {/* 닫기 버튼 */}
        <div className="p-6 border-t border-dark-600">
          <button onClick={onClose} className="btn btn-secondary">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

// 장비 옵션 컴포넌트
const EquipmentOption: React.FC<{
  equipment: Equipment;
  isCurrent: boolean;
  onSelect: () => void;
}> = ({ equipment, isCurrent, onSelect }) => {
  const getTypeColor = (type: EquipmentType) => {
    switch (type) {
      case EquipmentType.RAID_HERO: return 'item-legendary';
      case EquipmentType.RAID_NORMAL: return 'item-epic';
      case EquipmentType.TOME_AUGMENTED: return 'item-rare';
      case EquipmentType.TOME: return 'item-uncommon';
      default: return 'item-common';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`
        p-4 rounded-lg cursor-pointer transition-all
        ${getTypeColor(equipment.equipment_type)}
        ${isCurrent ? 'ring-2 ring-primary-500' : ''}
        hover:scale-105
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-bold mb-1">{equipment.name}</h4>
          <p className="text-sm text-gray-400">
            {EQUIPMENT_TYPE_NAMES[equipment.equipment_type]} • IL {equipment.item_level}
          </p>
          {equipment.source && (
            <p className="text-xs text-gray-500 mt-1">{equipment.source}</p>
          )}
        </div>
        {isCurrent && (
          <Check className="w-5 h-5 text-primary-400" />
        )}
      </div>
    </div>
  );
};

export default EquipmentSets;