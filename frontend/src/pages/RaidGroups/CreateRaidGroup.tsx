import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { raidApi, raidGroupApi } from "../../api/endpoints";
import { RaidGroupCreate, DistributionMethod } from "../../types";
import { PageLoading } from "../../components/Common/LoadingScreen";
import { 
  ChevronRight, Users, Package, Target, FileText,
  AlertCircle, Info, Loader2, Check, Shield
} from 'lucide-react';

interface FormData extends RaidGroupCreate {
  raid_id: number;
}

const CreateRaidGroup: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRaid, setSelectedRaid] = useState<number | null>(null);

  // 레이드 목록 조회
  const { data: raids, isLoading: raidsLoading } = useQuery({
    queryKey: ['raids'],
    queryFn: () => raidApi.list({ is_active: true })
  });

  // 폼 설정
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<FormData>({
    defaultValues: {
      distribution_method: DistributionMethod.PRIORITY
    }
  });

  const distributionMethod = watch('distribution_method');

  // 공대 생성 mutation
  const createMutation = useMutation({
    mutationFn: (data: FormData) => {
      const { raid_id, ...groupData } = data;
      return raidGroupApi.create(raid_id, groupData);
    },
    onSuccess: (newGroup) => {
      navigate(`/raid-groups/${newGroup.id}`);
    }
  });

  // 폼 제출 
  const onSubmit = (data: FormData) => {
    if (!selectedRaid) {
      return;
    }
    createMutation.mutate({
      ...data,
      raid_id: selectedRaid
    });
  };

  if (raidsLoading) {
    return <PageLoading title="레이드 정보를 불러오는 중..." />
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link 
          to="/raid-groups" 
          className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          aria-label="뒤로 가기"
          title="뒤로 가기"
        >
          <ChevronRight className="w-6 h-6 rotate-180" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">새 공대 생성</h1>
          <p className="text-gray-400">레이드 공대를 생성하고 멤버를 모집하세요</p>
        </div>
      </div>

      {/* 에러 메시지 */}
      {createMutation.isError && (
        <div className="p-4 bg-red-900/20 border border-red-600/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-400">
              공대 생성에 실패했습니다. 다시 시도해주세요.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 레이드 선택 */}
        <div className="game-panel p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-400" />
            레이드 선택
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {raids?.map(raid => (
              <label
                key={raid.id}
                className={`
                  relative p-4 bg-dark-700 rounded-lg cursor-pointer transition-all
                  ${selectedRaid === raid.id 
                    ? 'ring-2 ring-primary-500 bg-dark-600' 
                    : 'hover:bg-dark-600'
                  }
                `}
              >
                <input
                  type="radio"
                  name="raid"
                  value={raid.id}
                  onChange={() => setSelectedRaid(raid.id)}
                  className="sr-only"
                />
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">{raid.name}</h3>
                    <p className="text-sm text-gray-400">{raid.tier}</p>
                    {raid.min_item_level && (
                      <p className="text-xs text-gray-500 mt-1">
                        최소 IL {raid.min_item_level}
                      </p>
                    )}
                  </div>
                  {selectedRaid === raid.id && (
                    <Check className="w-5 h-5 text-primary-400" />
                  )}
                </div>
              </label>
            ))}
          </div>
          
          {!selectedRaid && errors.raid_id && (
            <p className="mt-2 text-sm text-red-400">레이드를 선택해주세요</p>
          )}
        </div>

        {/* 공대 정보 */}
        <div className="game-panel p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-400" />
            공대 정보
          </h2>

          <div className="space-y-4">
            {/* 공대 이름 */}
            <div>
              <label htmlFor="name" className="label-game">
                공대 이름
              </label>
              <input
                id="name"
                type="text"
                className={`input-game ${errors.name ? 'border-red-500' : ''}`}
                placeholder="예: 주말 저녁 고정팟"
                {...register('name', {
                  required: '공대 이름을 입력해주세요',
                  minLength: {
                    value: 1,
                    message: '공대 이름은 1자 이상이어야 합니다'
                  },
                  maxLength: {
                    value: 100,
                    message: '공대 이름은 100자 이하여야 합니다'
                  }
                })}
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

            {/* 분배 방식 */}
            <div>
              <label className="label-game mb-3">
                <Package className="inline w-4 h-4 mr-2" />
                아이템 분배 방식
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`
                  relative p-4 bg-dark-700 rounded-lg cursor-pointer transition-all
                  ${distributionMethod === DistributionMethod.PRIORITY 
                    ? 'ring-2 ring-primary-500 bg-dark-600' 
                    : 'hover:bg-dark-600'
                  }
                `}>
                  <input
                    type="radio"
                    value={DistributionMethod.PRIORITY}
                    {...register('distribution_method')}
                    className="sr-only"
                  />
                  <div>
                    <h3 className="font-semibold mb-1">우선순위 분배</h3>
                    <p className="text-sm text-gray-400">
                      사전에 정한 순서대로 아이템을 분배합니다
                    </p>
                  </div>
                </label>

                <label className={`
                  relative p-4 bg-dark-700 rounded-lg cursor-pointer transition-all
                  ${distributionMethod === DistributionMethod.FIRST_COME 
                    ? 'ring-2 ring-primary-500 bg-dark-600' 
                    : 'hover:bg-dark-600'
                  }
                `}>
                  <input
                    type="radio"
                    value={DistributionMethod.FIRST_COME}
                    {...register('distribution_method')}
                    className="sr-only"
                  />
                  <div>
                    <h3 className="font-semibold mb-1">선착순 분배</h3>
                    <p className="text-sm text-gray-400">
                      먼저 신청한 사람이 아이템을 획득합니다
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 목표 아이템 레벨 */}
            <div>
              <label htmlFor="target_item_level" className="label-game">
                <Target className="inline w-4 h-4 mr-2" />
                목표 아이템 레벨 (선택사항)
              </label>
              <input
                id="target_item_level"
                type="number"
                className={`input-game ${errors.target_item_level ? 'border-red-500' : ''}`}
                placeholder="예: 730"
                {...register('target_item_level', {
                  min: {
                    value: 1,
                    message: '아이템 레벨은 1 이상이어야 합니다'
                  },
                  max: {
                    value: 999,
                    message: '아이템 레벨은 999 이하여야 합니다'
                  }
                })}
              />
              {errors.target_item_level && (
                <p className="mt-2 text-sm text-red-400">{errors.target_item_level.message}</p>
              )}
            </div>

            {/* 공대 설명 */}
            <div>
              <label htmlFor="description" className="label-game">
                <FileText className="inline w-4 h-4 mr-2" />
                공대 소개 (선택사항)
              </label>
              <textarea
                id="description"
                rows={4}
                className="input-game resize-none"
                placeholder="공대 소개, 활동 시간, 규칙 등을 자유롭게 작성해주세요"
                {...register('description')}
              />
            </div>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="p-4 bg-blue-900/20 border border-blue-600/50 rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p>공대 생성 후 다음과 같은 기능을 사용할 수 있습니다:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>레이드 일정 관리 및 출석 체크</li>
              <li>아이템 분배 규칙 설정 및 이력 관리</li>
              <li>공대원 장비 세트 및 재화 계산</li>
              <li>공대원 모집 및 권한 관리</li>
            </ul>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-4 justify-end">
          <Link to="/raid-groups" className="btn btn-secondary">
            취소
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending || !selectedRaid}
            className={`btn btn-primary ${
              (createMutation.isPending || !selectedRaid) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {createMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                생성 중...
              </span>
            ) : (
              '공대 생성'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateRaidGroup;