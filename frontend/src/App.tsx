import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './contexts/AuthContext';

// 레이아웃 컴포넌트
import MainLayout from './components/Layout/MainLayout';
import AuthLayout from './components/Layout/AuthLayout';
import PrivateRoute from './components/Auth/PrivateRoute';
import AdminRoute from './components/Auth/AdminRoute';

// 페이지 컴포넌트
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import RaidGroups from './pages/RaidGroups/RaidGroups';
import RaidGroupDetail from './pages/RaidGroups/RaidGroupDetail';
import CreateRaidGroup from './pages/RaidGroups/CreateRaidGroup';
import MyEquipment from './pages/Equipment/MyEquipment';
import EquipmentSets from './pages/Equipment/EquipmentSets';
import EquipmentDatabase from './pages/Equipment/EquipmentDatabase';
import Distribution from './pages/Distribution/Distribution';
import DistributionHistory from './pages/Distribution/DistributionHistory';
import ResourceCalculator from './pages/Distribution/ResourceCalculator';
import Schedule from './pages/Schedule/Schedule';
import ScheduleCalendar from './pages/Schedule/ScheduleCalendar';
import Profile from './pages/Profile/Profile';
import Settings from './pages/Settings/Settings';
import AdminDashboard from './pages/Admin/AdminDashboard';
import NotFound from './pages/NotFound';

// 로딩 컴포넌트
import LoadingScreen from './components/Common/LoadingScreen';
import ErrorBoundary from './components/Common/ErrorBoundary';

// React Query 클라이언트 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      cacheTime: 1000 * 60 * 10, // 10분
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* 인증 라우트 */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* 보호된 라우트 */}
              <Route element={<PrivateRoute />}>
                <Route element={<MainLayout />}>
                  {/* 홈 & 대시보드 */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* 공대 관리 */}
                  <Route path="/raid-groups">
                    <Route index element={<RaidGroups />} />
                    <Route path="create" element={<CreateRaidGroup />} />
                    <Route path=":groupId" element={<RaidGroupDetail />} />
                  </Route>

                  {/* 장비 관리 */}
                  <Route path="/equipment">
                    <Route index element={<MyEquipment />} />
                    <Route path="sets" element={<EquipmentSets />} />
                    <Route path="database" element={<EquipmentDatabase />} />
                  </Route>

                  {/* 분배 관리 */}
                  <Route path="/distribution/:groupId">
                    <Route index element={<Distribution />} />
                    <Route path="history" element={<DistributionHistory />} />
                    <Route path="calculator" element={<ResourceCalculator />} />
                  </Route>

                  {/* 일정 관리 */}
                  <Route path="/schedule">
                    <Route index element={<Schedule />} />
                    <Route path="calendar" element={<ScheduleCalendar />} />
                  </Route>

                  {/* 프로필 & 설정 */}
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />

                  {/* 관리자 전용 */}
                  <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                  </Route>
                </Route>
              </Route>

              {/* 404 페이지 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>

        {/* React Query 개발 도구 (개발 환경에서만) */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;