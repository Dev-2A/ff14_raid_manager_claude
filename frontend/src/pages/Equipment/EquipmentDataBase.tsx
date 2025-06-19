import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { equipmentApi, raidApi } from "../../api/endpoints";
import { usePermission } from "../../contexts/AuthContext";
import {
  Equipment, EquipmentSlot, EquipmentType, Raid,
  EQUIPMENT_SLOT_NAMES, EQUIPMENT_TYPE_NAMES
} from "../../types";
import { PageLoading } from "../../components/Common/LoadingScreen";
import { 
  Shield, Plus, Search, Filter, Edit2, Trash2,
  ChevronDown, Database, X, Loader2, AlertCircle,
  Sword, Crown, Package, Target
} from 'lucide-react';

const EquipmentDatabase: React.FC = () => {
  const queryClient = useQueryClient();
  const { isAdmin } = usePermission();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSlot, setFilterSlot] = useState<EquipmentSlot | ''>('');
  const [filterType, setFilterType] = useState<EquipmentType | ''>('');
  const [filterRaid, setFilterRaid] = useState<number | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  // 레이드 목록 조회
  const { data: raids } = useQuery({
    queryKey: ['raids'],
    queryFn: () => raidApi.list({ is_active: true })
  });

  // 장비 목록 조회
  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment', filterSlot, filterType, filterRaid],
    queryFn: () => equipmentApi.list({
      slot: filterSlot || undefined,
      equipment_type: filterType || undefined,
      raid_id: filterRaid || undefined,
      is_active: true
    })
  });

  // 장비 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => equipmentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    }
  });

  // 필터링된 장비 목록
  const filteredEquipment = React.useMemo(() => {
    if (!equipment) return [];

    return equipment.filter(eq =>
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.source?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.item_level - a.item_level); // 아이템 레벨 내림차순 정렬
  }, [equipment, searchTerm]);

  // 통계 계산
  const statistics = React.useMemo(() => {
    if (!filteredEquipment) return { total: 0, byType: {}, avgItemLevel: 0 };

    const byType = filteredEquipment.reduce((acc, eq) => {
      acc[eq.equipment_type] = (acc[eq.equipment_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalItemLevel = filteredEquipment.reduce((sum, eq) => sum + eq.item_level, 0);
    const avgItemLevel = filteredEquipment.length > 0
      ? Math.round(totalItemLevel / filteredEquipment.length)
      : 0;
    
      return {
        total: filteredEquipment.length,
        byType,
        avgItemLevel
      };
  }, [filteredEquipment]);

  if (isLoading) {
    return <PageLoading title="장비 데이터베이스를 불러오는 중..." />;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Database className="w-8 h-8 text-primary-400" />
            장비 데이터베이스
          </h1>
          <p className="text-gray-400">레이드 장비 정보를 확인하고 관리하세요</p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            장비 추가
          </button>
        )}
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Shield}
          label="총 장비 수"
          value={statistics.total}
          color="text-blue-400"
        />
        <StatCard
          icon={Crown}
          label="영웅 장비"
          value={statistics.byType[EquipmentType.RAID_HERO] || 0}
          color="text-yellow-400"
        />
        <StatCard
          icon={Package}
          label="석판 장비"
          value={statistics.byType[EquipmentType.TOME] || 0}
          color="text-purple-400"
        />
        <StatCard
          icon={Target}
          label="평균 IL"
          value={statistics.avgItemLevel}
          color="text-green-400"
        />
      </div>

      {/* 필터 및 검색 */}
      <div className="game-panel p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="장비 이름 또는 획득처로 검색..."
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

          {/* 필터들 */}
          <div className="flex flex-wrap gap-2">
            {/* 슬롯 필터 */}
            <select
              value={filterSlot}
              onChange={(e) => setFilterSlot(e.target.value as EquipmentSlot | '')}
              className="input-game"
            >
              <option value="">모든 부위</option>
              {Object.entries(EQUIPMENT_SLOT_NAMES).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>

            {/* 타입 필터 */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as EquipmentType | '')}
              className="input-game"
            >
              <option value="">모든 타입</option>
              {Object.entries(EQUIPMENT_TYPE_NAMES).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>

            {/* 레이드 필터 */}
            <select
              value={filterRaid}
              onChange={(e) => setFilterRaid(e.target.value ? Number(e.target.value) : '')}
              className="input-game"
            >
              <option value="">모든 레이드</option>
              {raids?.map(raid => (
                <option key={raid.id} value={raid.id}>{raid.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 장비 목록 */}
      {filteredEquipment.length > 0 ? (
        <div className="space-y-2">
          {filteredEquipment.map(eq => (
            <EquipmentRow
              key={eq.id}
              equipment={eq}
              isAdmin={isAdmin()}
              onEdit={() => setEditingEquipment(eq)}
              onDelete={() => {
                if (window.confirm('정말로 이 장비를 삭제하시겠습니까?')) {
                  deleteMutation.mutate(eq.id);
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="game-panel p-12 text-center">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-gray-300">
            장비를 찾을 수 없습니다
          </h3>
          <p className="text-gray-400">
            다른 검색어나 필터를 시도해보세요
          </p>
        </div>
      )}

      {/* 장비 생성/수정 모달 */}
      {(showCreateModal || editingEquipment) && (
        <EquipmentFormModal
          equipment={editingEquipment}
          raids={raids || []}
          onClose={() => {
            setShowCreateModal(false);
            setEditingEquipment(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingEquipment(null);
            queryClient.invalidateQueries({ queryKey: ['equipment'] });
          }}
        />
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
    <div className="game-panel p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${color} opacity-50`} />
      </div>
    </div>
  );
};

// 장비 행 컴포넌트
const EquipmentRow: React.FC<{
  equipment: Equipment;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ equipment, isAdmin, onEdit, onDelete }) => {
  const getTypeClass = (type: EquipmentType) => {
    switch (type) {
      case EquipmentType.RAID_HERO: return 'item-legendary border-l-4 border-l-orange-500';
      case EquipmentType.RAID_NORMAL: return 'item-epic border-l-4 border-l-purple-500';
      case EquipmentType.TOME_AUGMENTED: return 'item-rare border-l-4 border-l-blue-500';
      case EquipmentType.TOME: return 'item-uncommon border-l-4 border-l-green-500';
      default: return 'item-common border-l-4 border-l-gray-500';
    }
  };

  return (
    <div className={`game-panel p-4 ${getTypeClass(equipment.equipment_type)}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h3 className="font-bold text-lg">{equipment.name}</h3>
            <span className="badge badge-primary">IL {equipment.item_level}</span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <span>{EQUIPMENT_SLOT_NAMES[equipment.slot]}</span>
            <span>{EQUIPMENT_TYPE_NAMES[equipment.equipment_type]}</span>
            {equipment.job_category && <span>{equipment.job_category}</span>}
            {equipment.source && <span>{equipment.source}</span>}
            {equipment.tome_cost > 0 && (
              <span className="text-yellow-400">석판 {equipment.tome_cost}</span>
            )}
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={onEdit}
              className="p-2 hover:bg-dark-700 rounded transition-colors"
              aria-label="수정"
              title="수정"
            >
              <Edit2 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 hover:bg-dark-700 rounded transition-colors"
              aria-label="삭제"
              title="삭제"
            >
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// 장비 폼 모달
const EquipmentFormModal: React.FC<{
  equipment: Equipment | null;
  raids: Raid[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ equipment, raids, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: equipment?.name || '',
    slot: equipment?.slot || EquipmentSlot.WEAPON,
    equipment_type: equipment?.equipment_type || EquipmentType.RAID_HERO,
    item_level: equipment?.item_level || 730,
    job_category: equipment?.job_category || '',
    raid_id: equipment?.raid_id || null,
    source: equipment?.source || '',
    tome_cost: equipment?.tome_cost || 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // null 값을 undefined로 변환하거나 제거
      const submitData = {
        name: formData.name,
        slot: formData.slot,
        equipment_type: formData.equipment_type,
        item_level: formData.item_level,
        job_category: formData.job_category || undefined,
        raid_id: formData.raid_id || undefined,  // null을 undefined로 변환
        source: formData.source || undefined,
        tome_cost: formData.tome_cost
      };
      
      if (equipment) {
        await equipmentApi.update(equipment.id, submitData);
      } else {
        await equipmentApi.create(submitData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save equipment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="game-panel max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-xl font-bold mb-4">
          {equipment ? '장비 수정' : '새 장비 추가'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 장비명 */}
          <div>
            <label htmlFor="name" className="label-game">장비명</label>
            <input
              id="name"
              type="text"
              required
              className="input-game"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 부위 */}
            <div>
              <label htmlFor="slot" className="label-game">부위</label>
              <select
                id="slot"
                className="input-game"
                value={formData.slot}
                onChange={(e) => setFormData({ ...formData, slot: e.target.value as EquipmentSlot })}
              >
                {Object.entries(EQUIPMENT_SLOT_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>

            {/* 타입 */}
            <div>
              <label htmlFor="type" className="label-game">타입</label>
              <select
                id="type"
                className="input-game"
                value={formData.equipment_type}
                onChange={(e) => setFormData({ ...formData, equipment_type: e.target.value as EquipmentType })}
              >
                {Object.entries(EQUIPMENT_TYPE_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 아이템 레벨 */}
            <div>
              <label htmlFor="item_level" className="label-game">아이템 레벨</label>
              <input
                id="item_level"
                type="number"
                required
                min="1"
                max="999"
                className="input-game"
                value={formData.item_level}
                onChange={(e) => setFormData({ ...formData, item_level: Number(e.target.value) })}
              />
            </div>

            {/* 석판 비용 */}
            <div>
              <label htmlFor="tome_cost" className="label-game">석판 비용</label>
              <input
                id="tome_cost"
                type="number"
                min="0"
                className="input-game"
                value={formData.tome_cost}
                onChange={(e) => setFormData({ ...formData, tome_cost: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* 직업군 */}
          <div>
            <label htmlFor="job_category" className="label-game">직업군 (선택)</label>
            <input
              id="job_category"
              type="text"
              className="input-game"
              placeholder="예: 탱커, 힐러, 캐스터"
              value={formData.job_category}
              onChange={(e) => setFormData({ ...formData, job_category: e.target.value })}
            />
          </div>

          {/* 레이드 */}
          <div>
            <label htmlFor="raid" className="label-game">관련 레이드 (선택)</label>
            <select
              id="raid"
              className="input-game"
              value={formData.raid_id || ''}
              onChange={(e) => setFormData({ ...formData, raid_id: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">선택 안 함</option>
              {raids.map(raid => (
                <option key={raid.id} value={raid.id}>{raid.name}</option>
              ))}
            </select>
          </div>

          {/* 획득처 */}
          <div>
            <label htmlFor="source" className="label-game">획득처 (선택)</label>
            <input
              id="source"
              type="text"
              className="input-game"
              placeholder="예: 1층 드랍, 석판 교환"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            />
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
                  저장 중...
                </span>
              ) : (
                equipment ? '수정' : '추가'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipmentDatabase;