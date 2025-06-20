import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, ArrowLeft, Info, AlertCircle, Loader,
  Shield, Heart, Sword, Target, FileText
} from 'lucide-react';
import { raidService } from '../../services';
import { Raid, RaidGroupCreate, DistributionMethod } from '../../types';

export const CreateRaidGroupPage: React.FC = () => {
  const navigate = useNavigate();
  const [raids, setRaids] = useState<Raid[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<RaidGroupCreate & { raid_id: number }>({
    raid_id: 0,
    name: '',
    distribution_method: DistributionMethod.PRIORITY,
    target_item_level: undefined,
    description: ''
  });

  useEffect(() => {
    loadRaids();
  }, []);

  const loadRaids = async () => {
    try {
      const raidList = await raidService.getRaids({ is_active: true });
      setRaids(raidList);
      if (raidList.length > 0) {
        setFormData(prev => ({ ...prev, raid_id: raidList[0].id }));
      }
    } catch (error) {
      console.error('Failed to load raids:', error);
      setError('레이드 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'target_item_level' && value ? parseInt(value) : value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.raid_id) {
      setError('레이드를 선택해주세요.');
      return false;
    }
    if (!formData.name || formData.name.length < 2) {
      setError('공대명은 2자 이상 입력해주세요.');
      return false;
    }
    if (formData.name.length > 100) {
      setError('공대명은 100자 이하로 입력해주세요.');
      return false;
    }
    if (formData.target_item_level && (formData.target_item_level < 1 || formData.target_item_level > 999)) {
      setError('목표 아이템 레벨은 1~999 사이의 값을 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { raid_id, ...createData } = formData;
      const newGroup = await raidService.createRaidGroup(raid_id, createData);
      navigate(`/raids/${newGroup.id}`);
    } catch (err: any) {
      setError(err.message || '공대 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRaid = raids.find(raid => raid.id === formData.raid_id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/raids"
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">공대 생성</h1>
            <p className="text-gray-400 mt-1">새로운 레이드 공대를 만들어보세요</p>
          </div>
        </div>
      </div>

      {/* 생성 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 flex items-start">
            <AlertCircle className="text-red-400 mr-2 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="card-game">
          <h2 className="text-lg font-semibold text-primary-300 mb-4">기본 정보</h2>
          
          {/* 레이드 선택 */}
          <div className="space-y-4">
            <div>
              <label htmlFor="raid_id" className="label-game">
                레이드 선택
              </label>
              <select
                id="raid_id"
                name="raid_id"
                value={formData.raid_id}
                onChange={handleChange}
                className="input-game w-full appearance-none"
                required
              >
                <option value="">레이드를 선택하세요</option>
                {raids.map(raid => (
                  <option key={raid.id} value={raid.id}>
                    {raid.name} - {raid.tier}
                  </option>
                ))}
              </select>
              {selectedRaid && (
                <div className="mt-2 p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-sm text-gray-400">
                    <span className="text-primary-300">층수:</span> {selectedRaid.total_floors}층 |{' '}
                    <span className="text-primary-300">최소 IL:</span> {selectedRaid.min_item_level || '없음'}
                  </p>
                  {selectedRaid.description && (
                    <p className="text-sm text-gray-400 mt-1">{selectedRaid.description}</p>
                  )}
                </div>
              )}
            </div>

            {/* 공대명 */}
            <div>
              <label htmlFor="name" className="label-game">
                공대명
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="input-game w-full"
                placeholder="예: 초보자 환영 공대"
                required
              />
              <p className="text-xs text-gray-500 mt-1">2~100자 사이로 입력해주세요</p>
            </div>

            {/* 분배 방식 */}
            <div>
              <label htmlFor="distribution_method" className="label-game">
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
                  <div className="card-game cursor-pointer border-2 border-transparent peer-checked:border-primary-500 peer-checked:bg-primary-900/20 transition-all">
                    <div className="flex items-center gap-3">
                      <Target className="w-8 h-8 text-primary-400" />
                      <div>
                        <p className="font-semibold text-white">우선순위 분배</p>
                        <p className="text-sm text-gray-400">사전에 정한 순서대로 분배</p>
                      </div>
                    </div>
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
                  <div className="card-game cursor-pointer border-2 border-transparent peer-checked:border-primary-500 peer-checked:bg-primary-900/20 transition-all">
                    <div className="flex items-center gap-3">
                      <Users className="w-8 h-8 text-secondary-400" />
                      <div>
                        <p className="font-semibold text-white">선착순 분배</p>
                        <p className="text-sm text-gray-400">먼저 신청하는 순서대로</p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* 목표 아이템 레벨 */}
            <div>
              <label htmlFor="target_item_level" className="label-game">
                목표 아이템 레벨 (선택사항)
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
              <p className="text-xs text-gray-500 mt-1">공대가 목표로 하는 평균 아이템 레벨</p>
            </div>

            {/* 공대 설명 */}
            <div>
              <label htmlFor="description" className="label-game">
                공대 설명 (선택사항)
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
          </div>
        </div>

        {/* 안내 사항 */}
        <div className="card-game bg-primary-900/20 border-primary-700/50">
          <div className="flex items-start gap-3">
            <Info className="text-primary-400 flex-shrink-0 mt-1" size={20} />
            <div className="text-sm text-gray-300">
              <p className="font-semibold text-primary-300 mb-2">공대 생성 시 안내사항</p>
              <ul className="space-y-1 text-gray-400">
                <li>• 공대를 생성하면 자동으로 공대장이 됩니다.</li>
                <li>• 공대장은 멤버 관리, 일정 관리, 분배 관리 권한을 가집니다.</li>
                <li>• 최대 8명까지 공대원을 모집할 수 있습니다.</li>
                <li>• 분배 방식은 나중에 변경할 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex gap-4 justify-end">
          <Link
            to="/raids"
            className="btn-game-secondary"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-game flex items-center"
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin mr-2" size={20} />
                생성 중...
              </>
            ) : (
              <>
                <Users className="mr-2" size={20} />
                공대 생성
              </>
            )}
          </button>
        </div>
      </form>

      {/* 역할 구성 안내 */}
      <div className="card-game">
        <h3 className="text-lg font-semibold text-primary-300 mb-4">권장 역할 구성</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-900/20 rounded-lg border border-blue-600/50">
            <Shield className="w-10 h-10 text-blue-400 mx-auto mb-2" />
            <p className="font-semibold text-white">탱커</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">2명</p>
          </div>
          <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-600/50">
            <Heart className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="font-semibold text-white">힐러</p>
            <p className="text-2xl font-bold text-green-400 mt-1">2명</p>
          </div>
          <div className="text-center p-4 bg-red-900/20 rounded-lg border border-red-600/50">
            <Sword className="w-10 h-10 text-red-400 mx-auto mb-2" />
            <p className="font-semibold text-white">딜러</p>
            <p className="text-2xl font-bold text-red-400 mt-1">4명</p>
          </div>
        </div>
      </div>
    </div>
  );
};