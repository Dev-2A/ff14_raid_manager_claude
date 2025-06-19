import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { distributionApi, raidGroupApi } from "../../api/endpoints";
import { useAuth, usePermission } from "../../contexts/AuthContext";
import {
  ItemDistribution, ItemType, RaidGroup, RaidMember,
  ITEM_TYPE_NAMES
} from "../../types"
import { PageLoading } from "../../components/Common/LoadingScreen";
import { 
  Package, Plus, Edit2, Trash2, Users, Crown,
  ChevronRight, AlertCircle, Filter, Search,
  Layers, TrendingUp, Calendar, Settings,
  ArrowUp, ArrowDown, Loader2, Check
} from 'lucide-react';

const Distribution: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isRaidLeader } = usePermission();

  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<ItemType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ItemDistribution | null>(null);

  // 공대 정보 조회
  const { data: raidGroup } = useQuery<RaidGroup>({
    queryKey: ['raidGroup', groupId],
    queryFn: () => raidGroupApi.get(Number(groupId)),
    enabled: !!groupId
  });

  // 공대원 목록 조회
  const { data: members } = useQuery<RaidMember[]>({
    queryKey: ['raidGroupMembers', groupId],
    queryFn: () => raidGroupApi.members(Number(groupId)),
    enabled: !!groupId
  });

  // 분배 규칙 목록 조회
  const { data: rules, isLoading } = useQuery<ItemDistribution[]>({
    queryKey: ['distributionRules', groupId, selectedFloor, selectedItemType],
    queryFn: () => distributionApi.rules(Number(groupId), {
      floor_number: selectedFloor || undefined,
      item_type: selectedItemType || undefined,
      is_active: true
    }),
    enabled: !!groupId
  });

  // 규칙 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: (ruleId: number) =>
      distributionApi.deleteRule(Number(groupId), ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributionRules'] });
    }
  });

  // 우선순위 자동 계산 mutation
  const calculatePriorityMutation = useMutation({
    mutationFn: () => distributionApi.calculatePriority(Number(groupId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributionRules'] });
    }
  });

  // 현재 멤버의 권한 확인
  const currentMember = members?.find(m => m.user_id === user?.id);
  const canManage = isRaidLeader(raidGroup?.leader_id || 0) || currentMember?.can_manage_distribution;

  // 필터링된 규칙 목록
  const filteredRules = React.useMemo(() => {
    if (!rules) return [];

    return rules.filter(rule =>
      rule.item_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rules, searchTerm]);

  if (!groupId) {
    return (
      <div className="game-panel p-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">공대를 선택해주세요</h2>
        <Link to="/raid-groups" className="btn btn-primary mt-4">
          공대 목록으로
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <PageLoading title="분배 규칙을 불러오는 중..." />;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to={`/raid-groups/${groupId}`}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            aria-label="뒤로 가기"
            title="뒤로 가기"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">아이템 분배 관리</h1>
            <p className="text-gray-400">{raidGroup?.name}</p>
          </div>
        </div>
        
        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => calculatePriorityMutation.mutate()}
              disabled={calculatePriorityMutation.isPending}
              className="btn btn-secondary"
            >
              {calculatePriorityMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <TrendingUp className="w-5 h-5 mr-2" />
              )}
              우선순위 자동 계산
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              규칙 추가
            </button>
          </div>
        )}
      </div>

      {/* 빠른 메뉴 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickLink
          to={`/distribution/${groupId}/history`}
          icon={Calendar}
          title="분배 이력"
          description="지금까지의 아이템 분배 기록"
          color="text-green-400"
        />
        <QuickLink
          to={`/distribution/${groupId}/calculator`}
          icon={TrendingUp}
          title="재화 계산기"
          description="필요한 재화량 자동 계산"
          color="text-purple-400"
        />
        <QuickLink
          to={`/raid-groups/${groupId}/settings`}
          icon={Settings}
          title="분배 설정"
          description="분배 방식 및 규칙 설정"
          color="text-gray-400"
        />
      </div>

      {/* 필터 및 검색 */}
      <div className="game-panel p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="아이템 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-game pl-12 w-full"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          </div>

          {/* 필터 */}
          <div className="flex gap-2">
            {/* 층 필터 */}
            <select
              value={selectedFloor || ''}
              onChange={(e) => setSelectedFloor(e.target.value ? Number(e.target.value) : null)}
              className="input-game"
            >
              <option value="">모든 층</option>
              {[1, 2, 3, 4].map(floor => (
                <option key={floor} value={floor}>{floor}층</option>
              ))}
            </select>

            {/* 아이템 타입 필터 */}
            <select
              value={selectedItemType || ''}
              onChange={(e) => setSelectedItemType(e.target.value as ItemType || null)}
              className="input-game"
            >
              <option value="">모든 타입</option>
              {Object.entries(ITEM_TYPE_NAMES).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 분배 규칙 목록 */}
      {filteredRules.length > 0 ? (
        <div className="space-y-4">
          {filteredRules.map(rule => (
            <DistributionRuleCard
              key={rule.id}
              rule={rule}
              members={members || []}
              canManage={canManage || false}
              onEdit={() => setEditingRule(rule)}
              onDelete={() => {
                if (window.confirm('정말로 이 분배 규칙을 삭제하시겠습니까?')) {
                  deleteMutation.mutate(rule.id);
                }
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState onCreateClick={() => setShowCreateModal(true)} />
      )}

      {/* 규칙 생성/수정 모달 */}
      {(showCreateModal || editingRule) && (
        <DistributionRuleModal
          rule={editingRule}
          groupId={Number(groupId)}
          members={members || []}
          onClose={() => {
            setShowCreateModal(false);
            setEditingRule(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingRule(null);
            queryClient.invalidateQueries({ queryKey: ['distributionRules'] });
          }}
        />
      )}
    </div>
  );
};

// 빠른 링크 컴포넌트
const QuickLink: React.FC<{
  to: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}> = ({ to, icon: Icon, title, description, color }) => {
  return (
    <Link to={to} className="game-panel p-6 hover:border-primary-500 transition-all group">
      <div className="flex items-start gap-4">
        <div className={`p-3 bg-dark-700 rounded-lg group-hover:scale-110 transition-transform`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-1">{title}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-primary-400 transition-colors" />
      </div>
    </Link>
  );
};

// 분배 규칙 카드 컴포넌트
const DistributionRuleCard: React.FC<{
  rule: ItemDistribution;
  members: RaidMember[];
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ rule, members, canManage, onEdit, onDelete }) => {
  const getItemTypeColor = (type: ItemType) => {
    switch (type) {
      case ItemType.WEAPON_COFFER: return 'text-red-400';
      case ItemType.EQUIPMENT_COFFER: return 'text-blue-400';
      case ItemType.UPGRADE_ITEM: return 'text-purple-400';
      case ItemType.TOME_MATERIAL: return 'text-green-400';
      case ItemType.TOKEN: return 'text-yellow-400';
      case ItemType.MOUNT: return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="game-panel p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold mb-2">{rule.item_name}</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className={`${getItemTypeColor(rule.item_type)}`}>
              {ITEM_TYPE_NAMES[rule.item_type]}
            </span>
            <span className="text-gray-400">{rule.floor_number}층</span>
            {rule.completed_users.length > 0 && (
              <span className="text-green-400">
                {rule.completed_users.length}명 획득 완료
              </span>
            )}
          </div>
        </div>
        
        {canManage && (
          <div className="flex items-center gap-2">
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

      {/* 우선순위 목록 */}
      {rule.priority_order.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400 mb-2">우선순위</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {rule.priority_order.map((userId, index) => {
              const member = members.find(m => m.user_id === userId);
              const isCompleted = rule.completed_users.includes(userId);
              
              return (
                <div
                  key={userId}
                  className={`
                    flex items-center gap-2 p-2 bg-dark-700 rounded
                    ${isCompleted ? 'opacity-50' : ''}
                  `}
                >
                  <span className="text-xs font-bold text-primary-400">
                    {index + 1}
                  </span>
                  <span className={`text-sm ${isCompleted ? 'line-through' : ''}`}>
                    {member?.user?.character_name || 'Unknown'}
                  </span>
                  {isCompleted && <Check className="w-4 h-4 text-green-400 ml-auto" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 메모 */}
      {rule.notes && (
        <p className="mt-4 text-sm text-gray-400 italic">
          {rule.notes}
        </p>
      )}
    </div>
  );
};

// 빈 상태 컴포넌트
const EmptyState: React.FC<{ onCreateClick: () => void }> = ({ onCreateClick }) => {
  return (
    <div className="game-panel p-12 text-center">
      <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2 text-gray-300">
        분배 규칙이 없습니다
      </h3>
      <p className="text-gray-400 mb-6">
        첫 분배 규칙을 생성하여 아이템 분배를 시작하세요
      </p>
      <button onClick={onCreateClick} className="btn btn-primary">
        <Plus className="w-5 h-5 mr-2" />
        첫 규칙 만들기
      </button>
    </div>
  );
};

// 분배 규칙 모달 (간단 버전)
const DistributionRuleModal: React.FC<{
  rule: ItemDistribution | null;
  groupId: number;
  members: RaidMember[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ rule, groupId, members, onClose, onSuccess }) => {
  // 실제 구현은 더 복잡하지만 간단하게 작성
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="game-panel max-w-2xl w-full p-6">
        <h3 className="text-xl font-bold mb-4">
          {rule ? '분배 규칙 수정' : '새 분배 규칙'}
        </h3>
        <p className="text-gray-400">분배 규칙 폼 구현 필요</p>
        <div className="flex gap-4 justify-end mt-6">
          <button onClick={onClose} className="btn btn-secondary">
            취소
          </button>
          <button onClick={onSuccess} className="btn btn-primary">
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default Distribution;