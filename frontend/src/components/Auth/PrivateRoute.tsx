import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, useAuthCheck } from "../../contexts/AuthContext";
import LoadingScreen from "../Common/LoadingScreen";

const PrivateRoute: React.FC = () => {
  const { loading } = useAuth();
  const { isAuthenticated } = useAuthCheck();
  const location = useLocation();

  // 인증 상태 확인 중
  if (loading) {
    return <LoadingScreen message="인증 정보를 확인하는 중..." />;
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated()) {
    // 현재 경로를 state로 전달하여 로그인 후 돌아올 수 있도록 함
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 인증된 경우 하위 라우트 렌더링
  return <Outlet />;
};

export default PrivateRoute;