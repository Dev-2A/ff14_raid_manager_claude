import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Settings, ArrowLeft, Save, Trash2, AlertCircle, 
  Info, Loader, UserX, AlertTriangle
} from 'lucide-react';
import { authService, raidService } from '../../services';
import { RaidGroup, RaidGroupUpdate, DistributionMethod, User } from '../../types';

export const RaidGroupSettingsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [raidGroup, setRaidGroup] = useState<RaidGroup | null>(null);
  const [formData, setFormData] = useState<RaidGroupUpdate>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  useEffect(() => {
    if (groupId) {
      loadGroupData();
    }
  }, [groupId]);

  const loadGroupData = async () => {
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
        navigate(`/raids/${groupId}`);
        return;
      }

      setRaidGroup(group);
      setFormData({
        name: group.name,
        distribution_method: group.distribution_method,
        target_item_level: group.target_item_level,
        description: group.description,
        is_recruiting: group.is_recruiting
      });
    } catch (error) {
      console.error('Failed to load group data:', error);
      setError('공대 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              name === 'target_item_level' && value ? parseInt(value) : value
    }));
  };

  const validateForm = (): boolean => {
    if (formData.name && (formData.name.length < 2 || formData.name.length > 100)) {
      setError('공대명은 2~100자 사이로 입력해주세요.');
      return false;
    }
    if (formData.target_item_level !== undefined && formData.target_item_level !== null && 
        (formData.target_item_level < 1 || formData.target_item_level > 999)) {
      setError('목표 아이템 레벨은 1~999 사이의 값을 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm() || !groupId) {
      return;
    }

    setIsSaving(true);

    try {
      await raidService.updateRaidGroup(parseInt(groupId), formData);
      setSuccess('공대 설정이 저장되었습니다.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || '설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!groupId || !raidGroup) return;

    if (deleteConfirmName !== raidGroup.name) {
      setError('공대명을 정확히 입력해주세요.');
      return;
    }

    try {
      await raidService.deleteRaidGroup(parseInt(groupId));
      navigate('/raids');
    } catch (err: any) {
      setError(err.message || '공대 삭제에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="animate-spin text-primary-400" size={32} />
      </div>
    );
  }

  if (!raidGroup) {
    return (
      <div className="card-game text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">공대를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link
          to={`/raids/${groupId}`}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">공대 설정</h1>
          <p className="text-gray-400 mt-1">{raidGroup.name}</p>
        </div>
      </div>

      {/* 알림 메시지 */}
      {error && (
        <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 flex items-start">
          <AlertCircle className="text-red-400 mr-2 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-4 flex items-start">
          <Info className="text-green-400 mr-2 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      {/* 설정 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card-game">
          <h2 className="text-lg font-semibold text-primary-300 mb-4">기본 정보</h2>
          
          <div className="space-y-4">
            {/* 공대명 */}
            <div>
              <label htmlFor="name" className="label-game">
                공대명
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name || ''}
                onChange={handleChange}
                className="input-game w-full"
                placeholder="예: 초보자 환영 공대"
              />
            </div>

            {/* 분배 방식 */}
            <div>
              <label className="label-game">
                아이템 분배 방식
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative">
                  <input
                    type="radio"
                    name="distribution_method"
                    value={DistributionMethod.PRIORITY}
                    checked={formData.distribution_method === DistributionMethod.PRIORITY}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <div className="card-game cursor-pointer border-2 border-transparent peer-checked:border-primary-500 peer-checked:bg-primary-900/20 transition-all p-4">
                    <p className="font-semibold text-white">우선순위 분배</p>
                    <p className="text-sm text-gray-400 mt-1">사전에 정한 순서대로 분배</p>
                  </div>
                </label>

                <label className="relative">
                  <input
                    type="radio"
                    name="distribution_method"
                    value={DistributionMethod.FIRST_COME}
                    checked={formData.distribution_method === DistributionMethod.FIRST_COME}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <div className="card-game cursor-pointer border-2 border-transparent peer-checked:border-primary-500 peer-checked:bg-primary-900/20 transition-all p-4">
                    <p className="font-semibold text-white">선착순 분배</p>
                    <p className="text-sm text-gray-400 mt-1">먼저 신청하는 순서대로</p>
                  </div>
                </label>
              </div>
            </div>

            {/* 목표 아이템 레벨 */}
            <div>
              <label htmlFor="target_item_level" className="label-game">
                목표 아이템 레벨
              </label>
              <input
                id="target_item_level"
                name="target_item_level"
                type="number"
                value={formData.target_item_level || ''}
                onChange={handleChange}
                className="input-game w-full"
                placeholder="예: 730"
                min="1"
                max="999"
              />
            </div>

            {/* 공대 설명 */}
            <div>
              <label htmlFor="description" className="label-game">
                공대 설명
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="input-game w-full resize-none"
                rows={4}
                placeholder="공대 운영 방침, 레이드 시간, 요구사항 등을 자유롭게 작성해주세요"
              />
            </div>

            {/* 모집 상태 */}
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <p className="font-semibold text-white">공대원 모집</p>
                <p className="text-sm text-gray-400 mt-1">
                  활성화하면 다른 유저들이 공대를 찾을 수 있습니다
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="is_recruiting"
                  checked={formData.is_recruiting || false}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-game flex items-center"
          >
            {isSaving ? (
              <>
                <Loader className="animate-spin mr-2" size={20} />
                저장 중...
              </>
            ) : (
              <>
                <Save className="mr-2" size={20} />
                설정 저장
              </>
            )}
          </button>
        </div>
      </form>

      {/* 위험 구역 */}
      <div className="card-game border-red-600/50">
        <h2 className="text-lg font-semibold text-red-400 mb-4">위험 구역</h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-900/20 rounded-lg border border-red-600/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-400 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="font-semibold text-white">공대 삭제</p>
                <p className="text-sm text-gray-400 mt-1">
                  공대를 삭제하면 모든 일정, 분배 기록, 멤버 정보가 영구적으로 삭제됩니다.
                  이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-game bg-red-600 hover:bg-red-700 mt-4 flex items-center"
            >
              <Trash2 className="mr-2" size={18} />
              공대 삭제
            </button>
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <>
          <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="card-game max-w-md w-full">
              <h3 className="text-lg font-semibold text-white mb-4">공대 삭제 확인</h3>
              <div className="space-y-4">
                <div className="p-4 bg-red-900/30 rounded-lg border border-red-600/50">
                  <p className="text-sm text-red-400">
                    <strong>경고:</strong> 이 작업은 되돌릴 수 없습니다!
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    공대와 관련된 모든 데이터가 영구적으로 삭제됩니다.
                  </p>
                </div>
                
                <div>
                  <label className="label-game">
                    확인을 위해 공대명 <span className="text-red-400">"{raidGroup.name}"</span>을 입력하세요
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    className="input-game w-full"
                    placeholder="공대명 입력"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmName('');
                  }}
                  className="btn-game-secondary"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirmName !== raidGroup.name}
                  className="btn-game bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};