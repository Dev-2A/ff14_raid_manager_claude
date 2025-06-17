import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Swords, ArrowLeft } from "lucide-react";

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-900 relative overflow-hidden">
      {/* 배경 효과 */}
      <div className="absolute inset-0">
        {/* 그라디언트 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-900 to-purple-900/20"></div>
        
        {/* 애니메이션 배경 요소 */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-600/10 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        {/* 패턴 배경 */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'var(--tw-bg-game-pattern)' }}></div>
      </div>

      {/* 헤더 */}
      <header className="relative z-10 p-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Swords className="w-10 h-10 text-primary-400 group-hover:text-primary-300 transition-colors" />
              <div className="absolute inset-0 w-10 h-10 bg-primary-400/20 rounded-full blur-xl group-hover:bg-primary-300/30 transition-colors"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient font-gaming">
                FF14 RAID MANAGER
              </h1>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Ultimate Raid Management System
              </p>
            </div>
          </Link>

          <Link 
            to="/"
            className="flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">홈으로</span>
          </Link>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] p-4">
        <div className="w-full max-w-md">
          {/* 게임 스타일 카드 */}
          <div className="game-panel">
            <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary-400 to-transparent"></div>
            
            {/* 상단 장식 */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="w-6 h-6 bg-primary-600 rotate-45 border-2 border-primary-400"></div>
            </div>

            {/* 컨텐츠 영역 */}
            <div className="p-8 sm:p-10">
              <Outlet />
            </div>

            {/* 하단 장식 */}
            <div className="absolute -bottom-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary-600/50 to-transparent"></div>
          </div>

          {/* 추가 정보 */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>파이널 판타지 XIV 레이드 관리의 새로운 경험</p>
            <p className="mt-2">
              © 2025 FF14 Raid Manager. All rights reserved.
            </p>
          </div>
        </div>
      </main>

      {/* 플로팅 장식 요소 */}
      <div className="absolute top-20 left-10 w-20 h-20 opacity-20">
        <div className="w-full h-full border-2 border-primary-500 rotate-45 animate-pulse"></div>
      </div>
      <div className="absolute bottom-20 right-10 w-16 h-16 opacity-20">
        <div className="w-full h-full border-2 border-purple-500 rotate-12 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      <div className="absolute top-1/2 left-20 w-12 h-12 opacity-10">
        <div className="w-full h-full bg-primary-600 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
      </div>
      <div className="absolute top-1/3 right-20 w-8 h-8 opacity-10">
        <div className="w-full h-full bg-purple-600 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* 게임 스타일 코너 장식 */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary-700/20"></div>
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-primary-700/20"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-primary-700/20"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary-700/20"></div>
    </div>
  );
};

export default AuthLayout;