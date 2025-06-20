import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './components/PrivateRoute';
import { MainLayout } from './components/Layout/MainLayout';

// 페이지 컴포넌트 import
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { RaidsPage } from './pages/RaidsPage';
import { SchedulePage } from './pages/SchedulePage';
import { EquipmentPage } from './pages/EquipmentPage';
import { DistributionPage } from './pages/DistributionPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 보호된 라우트 */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          {/* 기본 경로는 대시보드로 리다이렉트 */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* 메인 페이지들 */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="raids/*" element={<RaidsPage />} />
          <Route path="schedule/*" element={<SchedulePage />} />
          <Route path="equipment/*" element={<EquipmentPage />} />
          <Route path="distribution/*" element={<DistributionPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* 404 페이지 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

// 404 페이지 컴포넌트
const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-400 mb-4">404</h1>
        <p className="text-xl text-gray-400 mb-8">페이지를 찾을 수 없습니다</p>
        <a href="/dashboard" className="btn-game">
          대시보드로 돌아가기
        </a>
      </div>
    </div>
  );
};

export default App;