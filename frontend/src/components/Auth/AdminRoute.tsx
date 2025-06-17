import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, usePermission } from "../../contexts/AuthContext";
import LoadingScreen from "../Common/LoadingScreen";
import { AlertTriangle } from "lucide-react";

const AdminRoute: React.FC = () => {
  const { loading } = useAuth();
  const { isAdmin } = usePermission();
  const location = useLocation();

  // 인증 상태 확인 중
  if (loading) {
    return <LoadingScreen message="권한을 확인하는 중..." />
  }

  // 관리자가 아닌 경우
  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="game-panel max-w-md w-full p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-4 text-red-400">
            접근 권한이 없습니다.
          </h1>

          <p className="text-gray-400 mb-8">
            이 페이지는 관리자만 접근할 수 있습니다.
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.history.back()}
              className="btn btn-secondary"
            >
              뒤로 가기
            </button>

            <a href="/dashboard" className="btn btn-primary">
              대시보드로 이동
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 관리자인 경우 하위 라우트 렌더링
  return <Outlet />;
};

export default AdminRoute;