import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  Menu, X, Home, Users, Shield, Calendar, Package, 
  BarChart3, User, Settings, LogOut, ChevronDown,
  Swords, Crown, Bell, Search
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // 현재 경로 확인
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // 메뉴 아이템
  const menuItems = [
    {
      title: '대시보드',
      path: '/dashboard',
      icon: Home,
      color: 'text-blue-400'
    },
    {
      title: '공대 관리',
      path: '/raid-groups',
      icon: Users,
      color: 'text-green-400'
    },
    {
      title: '장비 관리',
      path: '/equipment',
      icon: Shield,
      color: 'text-purple-400'
    },
    {
      title: '일정 관리',
      path: '/schedule',
      icon: Calendar,
      color: 'text-yellow-400'
    },
    {
      title: '분배 관리',
      path: '/distribution',
      icon: Package,
      color: 'text-orange-400',
      requiresGroup: true
    },
    {
      title: '통계',
      path: '/statistics',
      icon: BarChart3,
      color: 'text-cyan-400'
    }
  ];

  const adminMenuItems = [
    {
      title: '관리자',
      path: '/admin',
      icon: Crown,
      color: 'text-red-400'
    }
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      {/* 상단 네비게이션 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark-800/95 backdrop-blur-sm border-b border-primary-700/30">
        <div className="flex items-center justify-between h-16 px-4">
          {/* 로고 & 메뉴 토글 */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-dark-700 rounded-lg transition-colors"
              aria-label={isSidebarOpen ? "메뉴 닫기" : "메뉴 열기"}
              title={isSidebarOpen ? "메뉴 닫기" : "메뉴 열기"}
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            <Link to="/dashboard" className="flex items-center gap-2">
              <Swords className="w-8 h-8 text-primary-400" />
              <span className="text-xl font-bold text-gradient font-gaming">
                FF14 RAID MANAGER
              </span>
            </Link>
          </div>

          {/* 우측 메뉴 */}
          <div className="flex items-center gap-2">
            {/* 검색 */}
            <button 
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors hidden md:block"
              aria-label="검색"
              title="검색"
            >
              <Search className="w-5 h-5 text-gray-400" />
            </button>

            {/* 알림 */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors relative"
                aria-label="알림"
                title="알림 3개"
              >
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="badge-notification" aria-hidden="true">3</span>
              </button>

              {/* 알림 드롭다운 */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 game-panel p-4">
                  <h3 className="font-bold text-primary-300 mb-3">알림</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-dark-700 rounded hover:bg-dark-600 cursor-pointer transition-colors">
                      <p className="text-sm">새로운 레이드 일정이 등록되었습니다.</p>
                      <p className="text-xs text-gray-500 mt-1">5분 전</p>
                    </div>
                    <div className="p-3 bg-dark-700 rounded hover:bg-dark-600 cursor-pointer transition-colors">
                      <p className="text-sm">아이템 분배 순서가 업데이트되었습니다.</p>
                      <p className="text-xs text-gray-500 mt-1">1시간 전</p>
                    </div>
                    <div className="p-3 bg-dark-700 rounded hover:bg-dark-600 cursor-pointer transition-colors">
                      <p className="text-sm">공대 모집이 시작되었습니다.</p>
                      <p className="text-xs text-gray-500 mt-1">3시간 전</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 프로필 메뉴 */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {user?.character_name}
                </span>
                <ChevronDown className="w-4 h-4 hidden md:block" />
              </button>

              {/* 프로필 드롭다운 */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 game-panel p-2">
                  <div className="px-3 py-2 border-b border-dark-600 mb-2">
                    <p className="font-semibold">{user?.character_name}</p>
                    <p className="text-sm text-gray-400">{user?.server}</p>
                  </div>
                  
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-3 py-2 hover:bg-dark-700 rounded transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>프로필</span>
                  </Link>
                  
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2 hover:bg-dark-700 rounded transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>설정</span>
                  </Link>
                  
                  <hr className="my-2 border-dark-600" />
                  
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-dark-700 rounded transition-colors w-full text-left text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>로그아웃</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 사이드바 */}
      <aside className={`
        fixed top-16 left-0 bottom-0 z-40 w-64 bg-dark-800/95 backdrop-blur-sm
        border-r border-primary-700/30 transform transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const path = item.requiresGroup ? '/raid-groups' : item.path;
            
            return (
              <Link
                key={item.path}
                to={path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive(item.path) 
                    ? 'bg-primary-600/20 border-l-4 border-primary-400' 
                    : 'hover:bg-dark-700 border-l-4 border-transparent'
                  }
                `}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon className={`w-5 h-5 ${item.color}`} />
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}

          {/* 관리자 메뉴 */}
          {user?.is_admin && (
            <>
              <div className="my-4 border-t border-dark-600"></div>
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                      ${isActive(item.path) 
                        ? 'bg-red-600/20 border-l-4 border-red-400' 
                        : 'hover:bg-dark-700 border-l-4 border-transparent'
                      }
                    `}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Icon className={`w-5 h-5 ${item.color}`} />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* 사이드바 하단 정보 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-600">
          <div className="text-sm text-gray-500">
            <p>서버: {user?.server}</p>
            <p>직업: {user?.job || '미설정'}</p>
          </div>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>

      {/* 모바일 오버레이 */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;