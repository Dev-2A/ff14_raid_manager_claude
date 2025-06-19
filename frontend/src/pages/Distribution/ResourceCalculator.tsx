import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { distributionApi, raidGroupApi, equipmentSetApi } from "../../api/endpoints";
import { useAuth } from "../../contexts/AuthContext";
import {
  RaidGroup, ResourceRequirement, EquipmentSet,
  EQUIPMENT_TYPE_NAMES, EquipmentType
} from "../../types";
import { PageLoading } from "../../components/Common/LoadingScreen";
import { 
  Calculator, Package, TrendingUp, Target, 
  ChevronRight, RefreshCw, Download, Info,
  Check, X, AlertCircle, Shield
} from 'lucide-react';

interface ResourceData {
  name: string;
  required: number;
  obtained: number;
  remaining: number;
  percentage: number;
}

const ResourceCalculator: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedSetId, setSelectedSetId] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // 공대 정보 조회
  const { data: raidGroup } = useQuery<RaidGroup>({
    queryKey: ['raidGroup', groupId],
    queryFn: () => raidGroupApi.get(Number(groupId)),
    enabled: !!groupId
  });

  // 내 장비 세트 목록 조회
  const { data: mySets } = useQuery<EquipmentSet[]>({
    queryKey: ['myEquipmentSets', groupId],
    queryFn: () => equipmentSetApi.mySets(Number(groupId)),
    enabled: !!groupId
  });

  // 자원 요구사항 조회
  const { data: resourceRequirement, isLoading } = useQuery<ResourceRequirement>({
    queryKey: ['resourceRequirement', groupId, user?.id],
    queryFn: () => distributionApi.myResource(Number(groupId)),
    enabled: !!groupId
  });

  // 자원 계산 업데이트
  const calculateMutation = useMutation({
    mutationFn: () =>
      distributionApi.calculateResource(Number(groupId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resourceRequirement'] });
    }
  });

  // 선택된 세트가 있으면 자동 계산
  useEffect(() => {
    if (selectedSetId && !calculateMutation.isPending) {
      calculateMutation.mutate();
    }
  }, [selectedSetId]);

  if (isLoading) {
    return <PageLoading title="자원 정보를 불러오는 중..." />;
  }

  // 자원 데이터 가공
  const resourceData: ResourceData[] = resourceRequirement ?
    Object.entries(resourceRequirement.required_resources).map(([key, value]) => ({
      name: key,
      required: value,
      obtained: resourceRequirement.obtained_resources[key] || 0,
      remaining: resourceRequirement.remaining_resources[key] || value,
      percentage: value > 0 ? ((resourceRequirement.obtained_resources[key] || 0) / value) * 100 : 0
    })) : [];
  
  const totalPercentage = resourceRequirement?.completion_percentage || 0;


return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link to="/raid-groups" className="hover:text-primary-400 transition-colors">
              공대 목록
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link 
              to={`/raid-groups/${groupId}`}
              className="hover:text-primary-400 transition-colors"
            >
              {raidGroup?.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link 
              to={`/distribution/${groupId}`}
              className="hover:text-primary-400 transition-colors"
            >
              분배 관리
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-300">자원 계산기</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calculator className="w-8 h-8 text-primary-400" />
            자원 계산기
          </h1>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">내보내기</span>
          </button>
        </div>
      </div>

      {/* 장비 세트 선택 */}
      <div className="game-panel p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          장비 세트 선택
        </h2>

        {mySets && mySets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mySets.map((set) => (
              <button
                key={set.id}
                onClick={() => setSelectedSetId(set.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all text-left
                  ${selectedSetId === set.id 
                    ? 'border-primary-500 bg-primary-900/20' 
                    : 'border-dark-600 bg-dark-700 hover:border-primary-600'
                  }
                `}
              >
                <h3 className="font-semibold mb-2">{set.name}</h3>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>평균 아이템 레벨: {set.total_item_level}</p>
                  <div className="flex gap-2 mt-2">
                    {set.is_bis_set && (
                      <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 rounded text-xs">
                        BiS
                      </span>
                    )}
                    {set.is_current_set && (
                      <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded text-xs">
                        현재
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">등록된 장비 세트가 없습니다.</p>
            <Link
              to="/equipment/sets"
              className="btn btn-primary"
            >
              장비 세트 만들기
            </Link>
          </div>
        )}
      </div>

      {/* 계산 결과 */}
      {selectedSetId && resourceData.length > 0 && (
        <>
          {/* 전체 진행률 */}
          <div className="game-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                전체 진행률
              </h2>
              <button
                onClick={() => calculateMutation.mutate()}
                disabled={calculateMutation.isPending}
                className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
              >
                <RefreshCw className={`w-4 h-4 ${calculateMutation.isPending ? 'animate-spin' : ''}`} />
                재계산
              </button>
            </div>

            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                    진행률
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold inline-block text-green-400">
                    {totalPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-dark-700">
                <div
                  style={{ width: `${totalPercentage}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                ></div>
              </div>
            </div>

            {resourceRequirement?.last_calculated_at && (
              <p className="text-xs text-gray-500 text-right">
                마지막 계산: {new Date(resourceRequirement.last_calculated_at).toLocaleString()}
              </p>
            )}
          </div>

          {/* 자원별 상세 내역 */}
          <div className="game-panel">
            <div className="game-panel-header flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-400" />
                자원별 상세 내역
              </h2>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-primary-400 hover:text-primary-300"
              >
                {showDetails ? '간단히 보기' : '자세히 보기'}
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {resourceData.map((resource) => (
                  <div key={resource.name} className="bg-dark-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{resource.name}</h3>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">
                          {resource.obtained} / {resource.required}
                        </span>
                        {resource.percentage >= 100 ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <span className="text-sm font-semibold text-orange-400">
                            {resource.remaining} 필요
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 진행률 바 */}
                    <div className="w-full bg-dark-600 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          resource.percentage >= 100 
                            ? 'bg-green-500' 
                            : 'bg-primary-500'
                        }`}
                        style={{ width: `${Math.min(resource.percentage, 100)}%` }}
                      ></div>
                    </div>

                    {/* 상세 정보 */}
                    {showDetails && (
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">필요량</p>
                          <p className="font-semibold">{resource.required}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">획득량</p>
                          <p className="font-semibold text-green-400">{resource.obtained}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">부족량</p>
                          <p className="font-semibold text-orange-400">{resource.remaining}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 도움말 */}
          <div className="game-panel p-6">
            <div className="flex gap-4">
              <Info className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-400 space-y-2">
                <p>• 장비 세트를 선택하면 필요한 자원이 자동으로 계산됩니다.</p>
                <p>• 획득한 아이템은 분배 이력에서 자동으로 반영됩니다.</p>
                <p>• 재계산 버튼을 눌러 최신 정보로 업데이트할 수 있습니다.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ResourceCalculator;