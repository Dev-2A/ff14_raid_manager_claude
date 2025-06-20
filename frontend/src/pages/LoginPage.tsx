import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogIn, User, Lock, AlertCircle } from "lucide-react";
import { authService } from "../services";
import { UserLogin } from "../types";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState<UserLogin>({
      username: '',
      password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 로그인 후 돌아갈 페이지
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.login(formData);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      // 에러 메시지가 문자열인지 확인
      const errorMessage = typeof err?.message === 'string' 
        ? err.message 
        : '로그인에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl mb-4 shadow-game animate-float">
            <span className="text-white font-bold text-3xl">R</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient-primary mb-2">
            FF14 레이드 매니저
          </h1>
          <p className="text-gray-400">계정에 로그인하세요</p>
        </div>

        {/* 로그인 폼 */}
        <div className="card-game">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 flex items-start">
                <AlertCircle className="text-red-400 mr-2 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* 사용자명 입력 */}
            <div>
              <label htmlFor="username" className="label-game">
                사용자명
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="input-game pl-10"
                  placeholder="사용자명을 입력하세요"
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="label-game">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-game pl-10"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-game w-full flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  로그인 중...
                </>
              ) : (
                <>
                  <LogIn className="mr-2" size={20} />
                  로그인
                </>
              )}
            </button>
          </form>

          {/* 구분선 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-800 text-gray-400">또는</span>
            </div>
          </div>

          {/* 회원가입 링크 */}
          <div className="text-center">
            <p className="text-gray-400">
              아직 계정이 없으신가요?{' '}
              <Link
                to="/register"
                className="font-semibold text-primary-400 hover:text-primary-300 transition-colors"
              >
                회원가입
              </Link>
            </p>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>파이널 판타지 XIV 레이드 관리를 위한</p>
          <p>통합 매니지먼트 시스템</p>
        </div>
      </div>
    </div>
  );
};