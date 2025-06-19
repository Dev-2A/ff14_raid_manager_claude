import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Token, UserLogin, UserCreate } from "../types";
import { authApi } from "../api/endpoints";
import { tokenUtils } from "../api/config";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 초기 로드 시 사용자 정보 확인
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenUtils.getAccessToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // 토큰이 있으면 사용자 정보 조회
        const userData = await authApi.me();
        setUser(userData);

        // 로컬 스토리지에 사용자 정보 저장
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('사용자 정보 조회 실패:', error);
        tokenUtils.removeAccessToken();
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 로그인
  const login = async (credentials: UserLogin) => {
    try {
      setLoading(true);
      setError(null);

      // 로그인 API 호출
      const tokenData: Token = await authApi.login(credentials);

      // 토큰 저장
      tokenUtils.setAccessToken(tokenData.access_token);

      // 사용자 정보 조회
      const userData = await authApi.me();
      setUser(userData);

      // 로컬 스토리지에 사용자 정보 저장
      localStorage.setItem('user', JSON.stringify(userData));

      // 성공 메시지 (선택적)
      console.log('로그인 성공:', userData.username);
    } catch (error: any) {
      console.error('로그인 실패:', error);

      let errorMessage = '로그인에 실패했습니다.';

      if (error.response?.status === 401) {
        errorMessage = '아이디 또는 비밀번호가 올바르지 않습니다.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 회원가입
  const register = async (userData: UserCreate) => {
    try {
      setLoading(true);
      setError(null);

      // 회원가입 API 호출
      const newUser = await authApi.register(userData);

      // 회원가입 성공 후 자동 로그인
      await login({
        username: userData.username,
        password: userData.password
      });

      console.log('회원가입 성공:', newUser.username);
    } catch (error: any) {
      console.error('회원가입 실패:', error);

      let errorMessage = '회원가입에 실패했습니다.';

      if (error.response?.status === 400) {
        if (error.response.data.detail?.includes('already registered')) {
          errorMessage = '이미 사용 중인 아이디 또는 이메일입니다.';
        } else {
          errorMessage = error.response.data.detail || errorMessage;
        }
      } else if (error.response?.data?.validation_errors) {
        // 유효성 검사 오류 처리
        const errors = error.response.data.validation_errors;
        if (Array.isArray(errors)) {
          errorMessage = errors.map((e: any) => e.msg).join(', ');
        }
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const logout = () => {
    // 토큰 및 사용자 정보 제거
    tokenUtils.removeAccessToken();
    localStorage.removeItem('user');
    setUser(null);
    setError(null);

    // 로그인 페이지로 리다이렉트
    window.location.href = '/login';
  };

  // 사용자 정보 업데이트
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // 에러 클리어
  const clearError = () => {
    setError(null);
  };

  // 브라우저 탭 간 동기화
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        if (!e.newValue) {
          // 다른 탭에서 로그아웃한 경우
          setUser(null);
          window.location.href = '/login';
        }
      } else if (e.key === 'user' && e.newValue) {
        // 다른 탭에서 사용자 정보가 업데이트된 경우
        try {
          const updatedUser = JSON.parse(e.newValue);
          setUser(updatedUser);
        } catch (error) {
          console.error('사용자 정보 파싱 실패:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 토큰 만료 체크 (1분마다)
  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = tokenUtils.getAccessToken();
      if (token && tokenUtils.isTokenExpired(token)) {
        logout();
      }
    };

    const interval = setInterval(checkTokenExpiry, 60000); // 1분마다 체크
    return () => clearInterval(interval);
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 권한 체크 훅
export const usePermission = () => {
  const { user } = useAuth();

  const isAdmin = (): boolean => {
    return user?.is_admin || false;
  };

  const isRaidLeader = (leaderId: number): boolean => {
    return user?.id === leaderId;
  };

  const canManageSchedule = (member: any): boolean => {
    return member?.can_manage_schedule || false;
  };

  const canManageDistribution = (member: any): boolean => {
    return member?.can_manage_distribution || false;
  };

  return {
    isAdmin,
    isRaidLeader,
    canManageSchedule,
    canManageDistribution
  };
};

// 인증 상태 체크 훅
export const useAuthCheck = () => {
  const { user, loading } = useAuth();

  const isAuthenticated = (): boolean => {
    return !!user && !!tokenUtils.getAccessToken();
  };

  const isReady = (): boolean => {
    return !loading;
  };

  return {
    isAuthenticated,
    isReady
  };
};