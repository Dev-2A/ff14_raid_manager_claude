import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Users, ArrowLeft, UserPlus, Crown, Shield, Heart, Sword,
  Settings, Calendar, Package, UserX, AlertCircle, Loader,
  Search, Filter, ChevronDown, Check, X
} from 'lucide-react';
import { authService, raidService } from '../../services';
import { User, RaidGroup, RaidMember, RaidMemberUpdate } from '../../types';

interface MemberWithUser extends RaidMember {
  user: User;
}

export const RaidGroupMembersPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [raidGroup, setRaidGroup] = useState<RaidGroup | null>(null);
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberWithUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<RaidMemberUpdate>({});
  const [showKickConfirm, setShowKickConfirm] = useState<number | null>(null);

  // 역할 옵션
  const roles = [
    { value: 'tank', label: '탱커', icon: Shield, class: 'role-tank' },
    { value: 'healer', label: '힐러', icon: Heart, class: 'role-healer' },
    { value: 'dps', label: '딜러', icon: Sword, class: 'role-dps' }
  ];

  // 직업 목록
  const jobs = {
    tank: ['PLD', 'WAR', 'DRK', 'GNB'],
    healer: ['WHM', 'SCH', 'AST', 'SGE'],
    dps: ['MNK', 'DRG', 'NIN', 'SAM', 'RPR', 'VPR', 'BRD', 'MCH', 'DNC', 'BLM', 'SMN', 'RDM', 'PCT']
  };

  useEffect(() => {
    if (groupId) {
      loadData();
    }
  }, [groupId]);

  useEffect(() => {
    filterMembers();
  }, [members, searchQuery, roleFilter]);

  const loadData = async () => {
    if (!groupId) return;

    setIsLoading(true);
    try {
      // 현재 사용자 정보
      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      // 공대 정보
      const group = await raidService.getRaidGroup(parseInt(groupId));
      
      // 공대장 권한 확인
      if (group.leader_id !== user.id) {
        setError('멤버 관리 권한이 없습니다.');
        return;
      }

      setRaidGroup(group);

      // 멤버 목록
      const memberList = await raidService.getRaidMembers(parseInt(groupId));
      setMembers(memberList as MemberWithUser[]);

      // TODO: 전체 유저 목록 API가 필요함
      // 임시로 빈 배열 설정
      setAllUsers([]);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = [...members];

    // 검색 필터
    if (searchQuery) {
      filtered = filtered.filter(member =>
        member.user?.character_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.job?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 역할 필터
    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    setFilteredMembers(filtered);
  };

  const handleEditMember = (member: MemberWithUser) => {
    setEditingMember(member.id);
    setEditForm({
      role: member.role,
      job: member.job,
      can_manage_schedule: member.can_manage_schedule,
      can_manage_distribution: member.can_manage_distribution
    });
  };

  const handleSaveEdit = async (memberId: number) => {
    if (!groupId) return;

    try {
      await raidService.updateRaidMember(parseInt(groupId), memberId, editForm);
      await loadData();
      setEditingMember(null);
    } catch (error: any) {
      alert(error.message || '멤버 정보 수정에 실패했습니다.');
    }
  };

  const handleKickMember = async (memberId: number) => {
    if (!groupId) return;

    try {
      await raidService.removeRaidMember(parseInt(groupId), memberId);
      await loadData();
      setShowKickConfirm(null);
    } catch (error: any) {
      alert(error.message || '멤버 추방에 실패했습니다.');
    }
  };

  const handleAddMember = async () => {
    if (!groupId || !selectedUserId) return;

    try {
      await raidService.addRaidMember(parseInt(groupId), {
        user_id: selectedUserId
      });
      await loadData();
      setShowAddMember(false);
      setSelectedUserId(null);
    } catch (error: any) {
      alert(error.message || '멤버 추가에 실패했습니다.');
    }
  };

  const getRoleIcon = (role?: string) => {
    const roleData = roles.find(r => r.value === role || r.label === role);
    return roleData ? <roleData.icon className="w-5 h-5" /> : <Sword className="w-5 h-5" />;
  };

  const getRoleClass = (role?: string) => {
    const roleData = roles.find(r => r.value === role || r.label === role);
    return roleData?.class || 'role-dps';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="animate-spin text-primary-400" size={32} />
      </div>
    );
  }

  if (error && !raidGroup) {
    return (
      <div className="card-game text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">{error}</p>
        <Link to="/raids" className="btn-game-secondary mt-4 inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={`/raids/${groupId}`}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">멤버 관리</h1>
            <p className="text-gray-400 mt-1">{raidGroup?.name}</p>
          </div>
        </div>

        {members.length < 8 && (
          <button
            onClick={() => setShowAddMember(true)}
            className="btn-game flex items-center"
          >
            <UserPlus className="mr-2" size={20} />
            멤버 추가
          </button>
        )}
      </div>

      {/* 필터 */}
      <div className="card-game">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="캐릭터명 또는 직업으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-game pl-10 w-full"
              />
            </div>
          </div>

          {/* 역할 필터 */}
          <div className="flex gap-2">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                roleFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              전체 ({members.length})
            </button>
            {roles.map(role => {
              const count = members.filter(m => m.role === role.value || m.role === role.label).length;
              return (
                <button
                  key={role.value}
                  onClick={() => setRoleFilter(role.value)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    roleFilter === role.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <role.icon size={18} />
                  {count}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 멤버 목록 */}
      <div className="card-game">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-700">
              <tr className="text-left">
                <th className="pb-3 text-sm font-semibold text-gray-400">멤버</th>
                <th className="pb-3 text-sm font-semibold text-gray-400">역할/직업</th>
                <th className="pb-3 text-sm font-semibold text-gray-400">권한</th>
                <th className="pb-3 text-sm font-semibold text-gray-400">가입일</th>
                <th className="pb-3 text-sm font-semibold text-gray-400 text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        getRoleClass(member.role)
                      }`}>
                        {getRoleIcon(member.role)}
                      </div>
                      <div>
                        <p className="font-semibold text-white flex items-center gap-2">
                          {member.user?.character_name}
                          {member.user_id === raidGroup?.leader_id && (
                            <Crown className="w-4 h-4 text-accent-gold" />
                          )}
                        </p>
                        <p className="text-sm text-gray-400">
                          {member.user?.server}
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4">
                    {editingMember === member.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editForm.role || ''}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          className="input-game text-sm py-1 px-2"
                        >
                          <option value="">역할 선택</option>
                          {roles.map(role => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={editForm.job || ''}
                          onChange={(e) => setEditForm({ ...editForm, job: e.target.value })}
                          className="input-game text-sm py-1 px-2"
                        >
                          <option value="">직업 선택</option>
                          {editForm.role && jobs[editForm.role as keyof typeof jobs]?.map(job => (
                            <option key={job} value={job}>{job}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <p className="text-white">{member.role || '-'}</p>
                        <p className="text-sm text-gray-400">{member.job || member.user?.job || '-'}</p>
                      </div>
                    )}
                  </td>
                  
                  <td className="py-4">
                    {editingMember === member.id ? (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editForm.can_manage_schedule || false}
                            onChange={(e) => setEditForm({ ...editForm, can_manage_schedule: e.target.checked })}
                            className="rounded text-primary-600"
                          />
                          <Calendar className="w-4 h-4" />
                          일정 관리
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editForm.can_manage_distribution || false}
                            onChange={(e) => setEditForm({ ...editForm, can_manage_distribution: e.target.checked })}
                            className="rounded text-primary-600"
                          />
                          <Package className="w-4 h-4" />
                          분배 관리
                        </label>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {member.can_manage_schedule && (
                          <span className="badge-game badge-silver text-xs">일정</span>
                        )}
                        {member.can_manage_distribution && (
                          <span className="badge-game badge-silver text-xs">분배</span>
                        )}
                        {!member.can_manage_schedule && !member.can_manage_distribution && (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </div>
                    )}
                  </td>
                  
                  <td className="py-4">
                    <p className="text-sm text-gray-400">
                      {new Date(member.joined_at).toLocaleDateString('ko-KR')}
                    </p>
                  </td>
                  
                  <td className="py-4">
                    <div className="flex items-center justify-end gap-2">
                      {member.user_id !== raidGroup?.leader_id && (
                        <>
                          {editingMember === member.id ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(member.id)}
                                className="p-2 text-green-400 hover:bg-green-900/30 rounded-lg transition-colors"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => setEditingMember(null)}
                                className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                              >
                                <X size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditMember(member)}
                                className="p-2 text-gray-400 hover:text-primary-300 hover:bg-gray-800 rounded-lg transition-colors"
                              >
                                <Settings size={18} />
                              </button>
                              <button
                                onClick={() => setShowKickConfirm(member.id)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                              >
                                <UserX size={18} />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 멤버 추가 모달 */}
      {showAddMember && (
        <>
          <div className="modal-backdrop" onClick={() => setShowAddMember(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="card-game max-w-md w-full">
              <h3 className="text-lg font-semibold text-white mb-4">멤버 추가</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="label-game">사용자 선택</label>
                  <p className="text-sm text-gray-400 mb-3">
                    추가할 사용자의 ID를 입력하거나 검색하세요
                  </p>
                  {/* TODO: 사용자 검색 기능 구현 필요 */}
                  <input
                    type="number"
                    placeholder="사용자 ID 입력"
                    onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
                    className="input-game w-full"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => {
                    setShowAddMember(false);
                    setSelectedUserId(null);
                  }}
                  className="btn-game-secondary"
                >
                  취소
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={!selectedUserId}
                  className="btn-game"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 추방 확인 모달 */}
      {showKickConfirm && (
        <>
          <div className="modal-backdrop" onClick={() => setShowKickConfirm(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="card-game max-w-md w-full">
              <h3 className="text-lg font-semibold text-white mb-4">멤버 추방</h3>
              <p className="text-gray-400 mb-6">
                정말로 이 멤버를 공대에서 추방하시겠습니까?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowKickConfirm(null)}
                  className="btn-game-secondary"
                >
                  취소
                </button>
                <button
                  onClick={() => handleKickMember(showKickConfirm)}
                  className="btn-game bg-red-600 hover:bg-red-700"
                >
                  추방
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};