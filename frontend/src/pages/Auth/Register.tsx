import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import { RegisterFormData, GAME_SERVERS, JOBS } from "../../types";
import { 
  Eye, EyeOff, User, Lock, Mail, Gamepad2, 
  Server, Briefcase, AlertCircle, Loader2, 
  Check, ChevronDown 
} from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 단계별 회원가입

  // React Hook Form 설정
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    setFocus
  } = useForm<RegisterFormData>();

  const password = watch('password');

  // 첫 로드 시 username 필드에 포커스
  useEffect(() => {
    setFocus('username');
    clearError();
  }, [setFocus, clearError]);

  // 다음 단계로 이동
  const handleNextStep = async () => {
    const isValid = await trigger(['username', 'email', 'password']);
    if (isValid) {
      setStep(2);
    }
  };

  // 폼 제출 처리
  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      await registerUser(data);

      // 회원가입 성공 시 대시보드로 이동
      navigate('/dashboard');
    } catch (err) {
      // 에러는 AuthContext에서 처리
      console.error('Registration failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* 타이틀 */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">
          <span className="text-gradient">새로운 모험을 시작하세요!</span>
        </h2>
        <p className="text-gray-400">
          FF14 레이드 매니저에 가입하여 공대를 관리해보세요
        </p>
      </div>

      {/* 진행 상태 표시 */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold
            ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-500'}`}>
            {step > 1 ? <Check className="w-5 h-5" /> : '1'}
          </div>
          <div className={`w-24 h-1 ${step >= 2 ? 'bg-primary-600' : 'bg-dark-700'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold
            ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-500'}`}>
            2
          </div>
        </div>
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

      {/* 회원가입 폼 */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: 계정 정보 */}
        {step === 1 && (
          <>
            <div className="space-y-6">
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
                      },
                      maxLength: {
                        value: 50,
                        message: '아이디는 50자 이하여야 합니다.'
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_]+$/,
                        message: '아이디는 영문, 숫자, 언더스코어(_)만 사용 가능합니다.'
                      }
                    })}
                  />
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                </div>
                {errors.username && (
                  <p className="mt-2 text-sm text-red-400">{errors.username.message}</p>
                )}
              </div>

              {/* 이메일 입력 */}
              <div>
                <label htmlFor="email" className="label-game">
                  이메일
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`input-game pl-12 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="이메일을 입력하세요"
                    {...register('email', {
                      required: '이메일을 입력해주세요.',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: '유효한 이메일 주소를 입력해주세요.'
                      }
                    })}
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
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
                    autoComplete="new-password"
                    className={`input-game pl-12 pr-12 ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="비밀번호를 입력하세요"
                    {...register('password', {
                      required: '비밀번호를 입력해주세요.',
                      minLength: {
                        value: 6,
                        message: '비밀번호는 6자 이상이어야 합니다.'
                      }
                    })}
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
            </div>

            {/* 다음 버튼 */}
            <button
              type="button"
              onClick={handleNextStep}
              className="w-full btn btn-primary py-3 text-lg font-bold uppercase tracking-wider"
            >
              다음 단계
            </button>
          </>
        )}

        {/* Step 2: 캐릭터 정보 */}
        {step === 2 && (
          <>
            <div className="space-y-6">
              {/* 캐릭터명 입력 */}
              <div>
                <label htmlFor="character_name" className="label-game">
                  캐릭터명
                </label>
                <div className="relative">
                  <input
                    id="character_name"
                    type="text"
                    className={`input-game pl-12 ${errors.character_name ? 'border-red-500' : ''}`}
                    placeholder="게임 내 캐릭터명을 입력하세요"
                    {...register('character_name', {
                      required: '캐릭터명을 입력해주세요.',
                      minLength: {
                        value: 1,
                        message: '캐릭터명을 입력해주세요.'
                      },
                      maxLength: {
                        value: 100,
                        message: '캐릭터명은 100자 이하여야 합니다.'
                      }
                    })}
                  />
                  <Gamepad2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                </div>
                {errors.character_name && (
                  <p className="mt-2 text-sm text-red-400">{errors.character_name.message}</p>
                )}
              </div>

              {/* 서버 선택 */}
              <div>
                <label htmlFor="server" className="label-game">
                  서버
                </label>
                <div className="relative">
                  <select
                    id="server"
                    className={`input-game pl-12 appearance-none ${errors.server ? 'border-red-500' : ''}`}
                    {...register('server', {
                      required: '서버를 선택해주세요.'
                    })}
                  >
                    <option value="">서버를 선택하세요</option>
                    {GAME_SERVERS.map(server => (
                      <option key={server} value={server}>{server}</option>
                    ))}
                  </select>
                  <Server className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                </div>
                {errors.server && (
                  <p className="mt-2 text-sm text-red-400">{errors.server.message}</p>
                )}
              </div>

              {/* 직업 선택 */}
              <div>
                <label htmlFor="job" className="label-game">
                  주 직업 (선택사항)
                </label>
                <div className="relative">
                  <select
                    id="job"
                    className="input-game pl-12 appearance-none"
                    {...register('job')}
                  >
                    <option value="">직업을 선택하세요</option>
                    <optgroup label="탱커">
                      {JOBS.filter(job => job.role === 'tank').map(job => (
                        <option key={job.id} value={job.name}>{job.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="힐러">
                      {JOBS.filter(job => job.role === 'healer').map(job => (
                        <option key={job.id} value={job.name}>{job.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="DPS">
                      {JOBS.filter(job => job.role === 'dps').map(job => (
                        <option key={job.id} value={job.name}>{job.name}</option>
                      ))}
                    </optgroup>
                  </select>
                  <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                </div>
              </div>
            </div>

            {/* 버튼들 */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 btn btn-secondary py-3"
              >
                이전
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`
                  flex-1 btn btn-primary py-3 text-lg font-bold uppercase tracking-wider
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    가입 중...
                  </span>
                ) : (
                  '가입하기'
                )}
              </button>
            </div>
          </>
        )}
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

      {/* 로그인 링크 */}
      <div className="text-center">
        <p className="text-gray-400">
          이미 계정이 있으신가요?{' '}
          <Link
            to="/login"
            className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
          >
            로그인
          </Link>
        </p>
      </div>

      {/* 약관 동의 안내 */}
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>
          가입하시면{' '}
          <a href="/terms" className="text-primary-400 hover:underline">이용약관</a>
          {' '}및{' '}
          <a href="/privacy" className="text-primary-400 hover:underline">개인정보처리방침</a>
          에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
};

export default Register;