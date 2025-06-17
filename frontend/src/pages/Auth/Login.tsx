import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import { LoginFormData } from "../../types";
import { Eye, EyeOff, User, Lock, AlertCircle, Loader2 } from "lucide-react";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 리다이렉트 경로 확인
  const from = location.state?.from?.pathname || '/dashboard';

  // React Hook Form 설정
  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus
  } = useForm<LoginFormData>();

  // 첫 로드 시 username 필드에 포커스
  useEffect(() => {
    setFocus('username');
    clearError();
  }, [setFocus, clearError]);

  // 폼 제출 처리
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      await login(data);

      // 로그인 성공 시 이전 페이지 또는 대시보드로 이동
      navigate(from, { replace: true });
    } catch (err) {
      // 에러는 AuthContext에서 처리
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* 타이틀 */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">
          <span className="text-gradient">모험가님, 환영합니다!</span>
        </h2>
        <p className="text-gray-400">
          레이드 관리 시스템에 로그인하세요
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-600/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* 로그인 폼 */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 아이디 입력 */}
        <div>
          <label htmlFor="username" className="label-game">
            아이디
          </label>
          <div className="relative">
            <input
              id="username"
              type="text"
              autoComplete="username"
              className={`input-game pl-12 ${errors.username ? 'border-red-500' : ''}`}
              placeholder="아이디를 입력하세요"
              {...register('username', {
                required: '아이디를 입력해주세요.',
                minLength: {
                  value: 3,
                  message: '아이디는 3자 이상이어야 합니다.'
                }
              })}
              disabled={isLoading}
            />
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          </div>
          {errors.username && (
            <p className="mt-2 text-sm text-red-400">{errors.username.message}</p>
          )}
        </div>

        {/* 비밀번호 입력 */}
        <div>
          <label htmlFor="password" className="label-game">
            비밀번호
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`input-game pl-12 pr-12 ${errors.password ? 'border-red-500' : ''}`}
              placeholder="비밀번호를 입력하세요"
              {...register('password', {
                required: '비밀번호를 입력해주세요.',
                minLength: {
                  value: 6,
                  message: '비밀번호는 6자 이상이어야 합니다.'
                }
              })}
              disabled={isLoading}
            />
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>
          )}
        </div>

        {/* 추가 옵션 */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 bg-dark-800 border-dark-600 rounded focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-400">로그인 상태 유지</span>
          </label>
          
          <Link
            to="/forgot-password"
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>

        {/* 로그인 버튼 */}
        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full btn btn-primary py-3 text-lg font-bold uppercase tracking-wider
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              로그인 중...
            </span>
          ) : (
            '로그인'
          )}
        </button>
      </form>

      {/* 구분선 */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dark-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-dark-800 text-gray-500">또는</span>
        </div>
      </div>

      {/* 회원가입 링크 */}
      <div className="text-center">
        <p className="text-gray-400">
          아직 계정이 없으신가요?{' '}
          <Link
            to="/register"
            className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
          >
            회원가입
          </Link>
        </p>
      </div>

      {/* 데모 계정 안내 (개발 환경) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-600/50 rounded-lg">
          <p className="text-sm text-blue-400 font-semibold mb-2">
            🎮 데모 계정
          </p>
          <div className="text-sm text-gray-400 space-y-1">
            <p>아이디: testuser / 비밀번호: testpass123</p>
            <p>관리자: admin / 비밀번호: admin123</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;