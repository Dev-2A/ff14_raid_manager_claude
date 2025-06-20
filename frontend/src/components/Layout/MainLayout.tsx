import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Home, Users, Calendar, Package, BarChart3, Settings, LogOut, ChevronDown } from 'lucide-react';
import { authService } from "../../services";
import { User } from "../../types";

export const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 현재 사용자 정보 가져오기
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  const isActiveRoute = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    { path: '/dashboard', icon: Home, label: '대시보드' },
    { path: '/raids', icon: Users, label: '레이드/공대' },
    { path: '/schedule', icon: Calendar, label: '일정 관리' },
    { path: '/equipment', icon: Package, label: '장비 관리' },
    { path: '/distribution', icon: BarChart3, label: '아이템 분배' },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 상단 네비게이션 */}
      <nav className="nav-game sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* 모바일 메뉴 버튼 */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-primary-300 hover:bg-gray-800"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* 로고 */}
              <Link to="/dashboard" className="flex items-center ml-4 md:ml-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-xl">R</span>
                  </div>
                  <h1 className="text-xl font-bold text-gradient-primary">
                    FF14 레이드 매니저
                  </h1>
                </div>
              </Link>
            </div>

            {/* 데스크톱 메뉴 */}
            <div className="hidden md:flex items-center space-x-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`tab-game ${isActiveRoute(item.path) ? 'tab-game-active' : ''}`}
                >
                  <item.icon size={18} className="mr-2" />
                  {item.label}
                </Link>
              ))}
            </div>

            {/* 프로필 드롭다운 */}
            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-primary-300 focus:outline-none"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full mr-2 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {currentUser?.character_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:block">{currentUser?.character_name}</span>
                  <ChevronDown size={16} className="ml-1" />
                </button>

                {/* 프로필 드롭다운 메뉴 */}
                {isProfileOpen && (
                  <div className="dropdown-game absolute right-0 w-64">
                    <div className="px-4 py-3 border-b border-primary-700/30">
                      <p className="text-sm font-semibold text-primary-300">
                        {currentUser?.character_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {currentUser?.server} / {currentUser?.job}
                      </p>
                      <p className="text-xs text-gray-500">{currentUser?.email}</p>
                    </div>
                    <Link
                      to="/settings"
                      className="dropdown-item-game flex items-center"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings size={16} className="mr-2" />
                      설정
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="dropdown-item-game flex items-center w-full text-left text-red-400 hover:text-red-300"
                    >
                      <LogOut size={16} className="mr-2" />
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 모바일 사이드바 */}
      {isSidebarOpen && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-black/60" onClick={() => setIsSidebarOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-900 border-r border-primary-700/30">
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <nav className="mt-5 px-2 space-y-1">
                  {menuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActiveRoute(item.path)
                          ? 'bg-primary-700/20 text-primary-300'
                          : 'text-gray-400 hover:text-primary-300 hover:bg-primary-700/10'
                      }`}
                    >
                      <item.icon size={20} className="mr-3" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* 푸터 */}
      <footer className="mt-auto py-6 border-t border-primary-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>© 2025 FF14 레이드 매니저. 파이널 판타지 XIV는 Square Enix의 등록 상표입니다.</p>
        </div>
      </footer>
    </div>
  );
};