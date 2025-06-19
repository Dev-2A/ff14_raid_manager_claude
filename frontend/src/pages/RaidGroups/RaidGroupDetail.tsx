import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { raidGroupApi } from "../../api/endpoints";
import { useAuth, usePermission } from "../../contexts/AuthContext";
import { RaidGroup, RaidMember, DistributionMethod } from "../../types";
import { PageLoading } from "../../components/Common/LoadingScreen";
import { 
  Users, Crown, Shield, Calendar, Package, Settings,
  UserPlus, UserMinus, Edit, Trash2, AlertCircle,
  ChevronRight, Target, Clock, Info, Check, X,
  LogOut, UserCog
} from 'lucide-react';
import { formatDate } from "../../api/config";

const RaidGroupDetail: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isRaidLeader } = usePermission();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<RaidMember | null>(null);

  // 공대 정보 조회
  const { data: group, isLoading } = useQuery({
    queryKey: ['raidGroup', groupId],
    queryFn: () => raidGroupApi.get(Number(groupId)),
    enabled: !!groupId
  });

  // 공대원 목록 조회
  const { data: members } = useQuery({
    queryKey: ['raidGroupMembers', groupId],
    queryFn: () => raidGroupApi.members(Number(groupId)),
    enabled: !!groupId
  });

  // 공대 수정 mutation
  const updateGroupMutation = useMutation({
    mutationFn: (data: Partial<RaidGroup>) =>
      raidGroupApi.update(Number(groupId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raidGroup', groupId] })
    }
  });

  // 공대 삭제 mutation
  const deleteGroupMutation = useMutation({
    mutationFn: () => raidGroupApi.delete(Number(groupId)),
    onSuccess: () => {
      navigate('/raid-groups');
    }
  });

  // 멤버 제거 mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: number) =>
      raidGroupApi.removeMember(Number(groupId), memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raidGroupMembers', groupId] });
      setSelectedMember(null);
    }
  });

  // 공대 탈퇴 mutation
  const leaveGroupMutation = useMutation({
    mutationFn: () => {
      const myMember = members?.find(m => m.user_id === user?.id);
      if (!myMember) throw new Error('Member not found');
      return raidGroupApi.removeMember(Number(groupId), myMember.id);
    },
    onSuccess: () => {
      navigate('/raid-groups');
    }
  });

  if (!group) {
    return (
      <div className="game-panel p-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">공대를 찾을 수 없습니다</h2>
        <p className="text-gray-400 mb-6">요청하신 공대가 존재하지 않거나 삭제되었습니다.</p>
        <Link to="/raid-groups" className="btn btn-primary">
          공대 목록으로
        </Link>
      </div>
    );
  }

  const isLeader = isRaidLeader(group.leader_id);
  const isMember = members?.some(m => m.user_id === user?.id);
  const currentMember = members?.find(m => m.user_id === user?.id);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/raid-groups" 
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            aria-label="뒤로 가기"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <p className="text-gray-400">{group.raid?.name}</p>
          </div>
        </div>
        
        {isMember && (
          <div className="flex items-center gap-2">
            {isLeader ? (
              <>
                <Link 
                  to={`/raid-groups/${groupId}/edit`}
                  className="btn btn-secondary"
                >
                  <Edit className="w-5 h-5 mr-2" />
                  수정
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn btn-danger"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  삭제
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="btn btn-secondary"
              >
                <LogOut className="w-5 h-5 mr-2" />
                탈퇴
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 공대 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <div className="game-panel">
            <div className="game-panel-header">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Info className="w-5 h-5 text-primary-400" />
                공대 정보
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* 공대장 */}
              <InfoRow
                icon={Crown}
                label="공대장"
                value={group.leader?.character_name || 'Unknown'}
                iconColor="text-yellow-400"
              />
              
              {/* 분배 방식 */}
              <InfoRow
                icon={Package}
                label="분배 방식"
                value={group.distribution_method === DistributionMethod.PRIORITY ? '우선순위 분배' : '선착순 분배'}
                iconColor="text-orange-400"
              />
              
              {/* 목표 아이템 레벨 */}
              {group.target_item_level && (
                <InfoRow
                  icon={Target}
                  label="목표 아이템 레벨"
                  value={`${group.target_item_level}`}
                  iconColor="text-purple-400"
                />
              )}
              
              {/* 생성일 */}
              <InfoRow
                icon={Clock}
                label="생성일"
                value={formatDate(group.created_at)}
                iconColor="text-gray-400"
              />
              
              {/* 설명 */}
              {group.description && (
                <div className="pt-4 border-t border-dark-600">
                  <p className="text-gray-300">{group.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* 빠른 메뉴 */}
          {isMember && (
            <div className="game-panel p-6">
              <h2 className="text-xl font-bold mb-4">빠른 메뉴</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickMenu
                  to={`/schedule?groupId=${groupId}`}
                  icon={Calendar}
                  label="일정 관리"
                  color="text-green-400"
                />
                <QuickMenu
                  to={`/distribution/${groupId}`}
                  icon={Package}
                  label="분배 관리"
                  color="text-orange-400"
                />
                <QuickMenu
                  to={`/equipment/sets?groupId=${groupId}`}
                  icon={Shield}
                  label="장비 세트"
                  color="text-purple-400"
                />
                <QuickMenu
                  to={`/raid-groups/${groupId}/settings`}
                  icon={Settings}
                  label="설정"
                  color="text-gray-400"
                  disabled={!isLeader && !currentMember?.can_manage_schedule}
                />
              </div>
            </div>
          )}
        </div>

        {/* 멤버 목록 */}
        <div className="game-panel h-fit">
          <div className="game-panel-header flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-400" />
              공대원 ({members?.length || 0}/8)
            </h2>
            {isLeader && (members?.length || 0) < 8 && (
              <button 
                className="text-sm text-primary-400 hover:text-primary-300"
                aria-label="멤버 초대"
                title="멤버 초대"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="p-6">
            {members && members.length > 0 ? (
              <div className="space-y-2">
                {members.map(member => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    isLeader={isLeader}
                    currentUserId={user?.id}
                    onManage={() => setSelectedMember(member)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">
                아직 공대원이 없습니다
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <ConfirmModal
          title="공대 삭제"
          message="정말로 이 공대를 삭제하시겠습니까? 모든 데이터가 영구적으로 삭제됩니다."
          confirmText="삭제"
          onConfirm={() => deleteGroupMutation.mutate()}
          onCancel={() => setShowDeleteConfirm(false)}
          isLoading={deleteGroupMutation.isPending}
          variant="danger"
        />
      )}

      {/* 탈퇴 확인 모달 */}
      {showLeaveConfirm && (
        <ConfirmModal
          title="공대 탈퇴"
          message="정말로 이 공대를 탈퇴하시겠습니까?"
          confirmText="탈퇴"
          onConfirm={() => leaveGroupMutation.mutate()}
          onCancel={() => setShowLeaveConfirm(false)}
          isLoading={leaveGroupMutation.isPending}
          variant="warning"
        />
      )}

      {/* 멤버 관리 모달 */}
      {selectedMember && isLeader && (
        <MemberManageModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onRemove={() => {
            removeMemberMutation.mutate(selectedMember.id);
          }}
          isLoading={removeMemberMutation.isPending}
        />
      )}
    </div>
  );
};

// 정보 행 컴포넌트
const InfoRow: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  iconColor?: string;
}> = ({ icon: Icon, label, value, iconColor = 'text-gray-400' }) => {
  return (
    <div className="flex items-center gap-3">
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <div className="flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
};

// 빠른 메뉴 컴포넌트
const QuickMenu: React.FC<{
  to: string;
  icon: React.ElementType;
  label: string;
  color: string;
  disabled?: boolean;
}> = ({ to, icon: Icon, label, color, disabled }) => {
  const content = (
    <>
      <Icon className={`w-6 h-6 ${color} mb-2`} />
      <span className="text-sm">{label}</span>
    </>
  );

  if (disabled) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-dark-700/50 rounded-lg opacity-50 cursor-not-allowed">
        {content}
      </div>
    );
  }

  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
    >
      {content}
    </Link>
  );
};

// 멤버 카드 컴포넌트
const MemberCard: React.FC<{
  member: RaidMember;
  isLeader: boolean;
  currentUserId?: number;
  onManage: () => void;
}> = ({ member, isLeader, currentUserId, onManage }) => {
  const isMe = member.user_id === currentUserId;

  return (
    <div className={`p-3 bg-dark-700 rounded-lg flex items-center justify-between ${isMe ? 'ring-2 ring-primary-600' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          member.role === '탱커' ? 'bg-blue-900' :
          member.role === '힐러' ? 'bg-green-900' :
          'bg-red-900'
        }`}>
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium flex items-center gap-2">
            {member.user?.character_name}
            {isMe && <span className="text-xs text-primary-400">(나)</span>}
          </p>
          <p className="text-sm text-gray-400">
            {member.job || member.role || '미정'}
          </p>
        </div>
      </div>
      
      {isLeader && !isMe && (
        <button
          onClick={onManage}
          className="p-1 hover:bg-dark-600 rounded transition-colors"
          aria-label="멤버 관리"
        >
          <UserCog className="w-5 h-5 text-gray-400" />
        </button>
      )}
    </div>
  );
};

// 확인 모달 컴포넌트
const ConfirmModal: React.FC<{
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'primary';
}> = ({ title, message, confirmText, onConfirm, onCancel, isLoading, variant = 'primary' }) => {
  const buttonClass = variant === 'danger' ? 'btn-danger' : variant === 'warning' ? 'btn-secondary' : 'btn-primary';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="game-panel max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex gap-4 justify-end">
          <button
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`btn ${buttonClass}`}
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// 멤버 관리 모달
const MemberManageModal: React.FC<{
  member: RaidMember;
  onClose: () => void;
  onRemove: () => void;
  isLoading?: boolean;
}> = ({ member, onClose, onRemove, isLoading }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="game-panel max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4">멤버 관리</h3>
        <div className="mb-6">
          <p className="font-medium">{member.user?.character_name}</p>
          <p className="text-sm text-gray-400">{member.job || member.role || '미정'}</p>
        </div>
        
        <div className="space-y-4 mb-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={member.can_manage_schedule}
              disabled
              className="w-4 h-4"
            />
            <span>일정 관리 권한</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={member.can_manage_distribution}
              disabled
              className="w-4 h-4"
            />
            <span>분배 관리 권한</span>
          </label>
        </div>
        
        <div className="flex gap-4 justify-end">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            닫기
          </button>
          <button
            onClick={onRemove}
            className="btn btn-danger"
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '멤버 제거'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RaidGroupDetail;