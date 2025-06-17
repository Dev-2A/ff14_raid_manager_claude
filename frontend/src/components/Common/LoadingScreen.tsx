import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = '로딩 중...' }) => {
  return (
    <div className="fixed inset-0 bg-dark-900/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        {/* 로딩 애니메이션 - FF14 스타일 */}
        <div className="relative mb-8">
          <div className="loader-game mx-auto"></div>
          
          {/* 추가 이펙트 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-4 border-primary-500/20 rounded-full animate-ping"></div>
          </div>
        </div>

        {/* 로딩 메시지 */}
        <h3 className="text-xl font-bold text-primary-300 mb-2 animate-pulse">
          {message}
        </h3>
        
        {/* 로딩 팁 (선택적) */}
        <div className="mt-8 max-w-md mx-auto">
          <p className="text-sm text-gray-500">
            💡 알고 계셨나요?
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {getRandomTip()}
          </p>
        </div>
      </div>
    </div>
  );
};

// 랜덤 팁 생성 함수
const getRandomTip = (): string => {
  const tips = [
    "영웅 레이드 장비는 일반 레이드 장비보다 아이템 레벨이 높습니다.",
    "석판 장비는 강화 재료를 사용하여 업그레이드할 수 있습니다.",
    "공대원들과 아이템 분배 우선순위를 미리 정하면 원활한 진행이 가능합니다.",
    "출발 세트와 최종 BIS 세트를 등록하면 필요한 재화를 자동으로 계산해줍니다.",
    "일정 참석률이 높은 공대원에게 우선순위를 주는 것도 좋은 방법입니다.",
    "매주 화요일은 주간 초기화 날입니다. 잊지 마세요!",
    "장비 세트를 미리 계획하면 효율적인 아이템 획득이 가능합니다.",
    "공대 일정은 가능한 한 일찍 확정하는 것이 좋습니다."
  ];

  return tips[Math.floor(Math.random() * tips.length)];
};

// 작은 로딩 스피너 컴포넌트
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`inline-block ${sizeClasses[size]}`}>
      <div className={`loader-game ${sizeClasses[size]}`}></div>
    </div>
  );
};

// 버튼 로딩 상태 컴포넌트
export const ButtonLoading: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <LoadingSpinner size="sm" />
      <span className="ml-2">처리 중...</span>
    </div>
  );
};

// 페이지 로딩 컴포넌트
export const PageLoading: React.FC<{ title?: string }> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" />
      {title && (
        <h3 className="mt-4 text-lg font-semibold text-gray-300">
          {title}
        </h3>
      )}
    </div>
  );
};

// 스켈레톤 로더 컴포넌트
export const SkeletonLoader: React.FC<{ 
  rows?: number; 
  className?: string;
}> = ({ rows = 3, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-dark-700 rounded w-full"></div>
          {i === 0 && (
            <div className="h-4 bg-dark-700 rounded w-3/4 mt-2"></div>
          )}
        </div>
      ))}
    </div>
  );
};

// 데이터 로딩 상태 컴포넌트
export const DataLoading: React.FC<{ 
  message?: string;
  showSkeleton?: boolean;
}> = ({ message = '데이터를 불러오는 중...', showSkeleton = true }) => {
  return (
    <div className="p-8">
      <div className="text-center mb-6">
        <LoadingSpinner size="md" />
        <p className="mt-3 text-gray-400">{message}</p>
      </div>
      {showSkeleton && (
        <div className="max-w-2xl mx-auto">
          <SkeletonLoader rows={5} />
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;