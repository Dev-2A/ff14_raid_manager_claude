import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, User, Mail, Lock, Gamepad2, Server, AlertCircle, Check } from 'lucide-react';
import { authService } from "../services";
import { UserCreate } from "../types";

// FF14 한국 서버 목록
const FF14_SERVERS = [
  '초코보', '카벙클', '모그리', '톤베리', '펜리르'
];

// FF14 직업 목록
const FF14_JOBS = [
  // 탱커
  { value: 'PLD', label: '나이트', role: 'tank' },
  { value: 'WAR', label: '전사', role: 'tank' },
  { value: 'DRK', label: '암흑기사', role: 'tank' },
  { value: 'GNB', label: '건브레이커', role: 'tank' },
  // 힐러
  { value: 'WHM', label: '백마도사', role: 'healer' },
  { value: 'SCH', label: '학자', role: 'healer' },
  { value: 'AST', label: '점성술사', role: 'healer' },
  { value: 'SGE', label: '현자', role: 'healer' },
  // 근딜
  { value: 'MNK', label: '몽크', role: 'dps' },
  { value: 'DRG', label: '용기사', role: 'dps' },
  { value: 'NIN', label: '닌자', role: 'dps' },
  { value: 'SAM', label: '사무라이', role: 'dps' },
  { value: 'RPR', label: '리퍼', role: 'dps' },
  { value: 'VPR', label: '바이퍼', role: 'dps' },
  // 원딜
  { value: 'BRD', label: '음유시인', role: 'dps' },
  { value: 'MCH', label: '기공사', role: 'dps' },
  { value: 'DNC', label: '무도가', role: 'dps' },
  // 캐스터
  { value: 'BLM', label: '흑마도사', role: 'dps' },
  { value: 'SMN', label: '소환사', role: 'dps' },
  { value: 'RDM', label: '적마도사', role: 'dps' },
  { value: 'PCT', label: '픽토맨서', role: 'dps' },
];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserCreate>({
    username: '',
    email: '',
    password: '',
    character_name: '',
    server: '',
    job: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // 비밀번호 강도 체크
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-blue-500';
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return '약함';
      case 2:
        return '보통';
      case 3:
        return '강함';
      case 4:
        return '매우 강함';
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    if (formData.password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await authService.register(formData);
      // 회원가입 성공 후 로그인 페이지로 이동
      navigate('/login', {
        state: { message: '회원가입이 완료되었습니다. 로그인해주세요.' }
      });
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다.');
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

      <div className="relative z-10 w-full max-w-2xl">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl mb-4 shadow-game animate-float">
            <span className="text-white font-bold text-3xl">R</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient-primary mb-2">
            FF14 레이드 매니저
          </h1>
          <p className="text-gray-400">새로운 계정을 만들어 시작하세요</p>
        </div>

        {/* 회원가입 폼 */}
        <div className="card-game">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 flex items-start">
                <AlertCircle className="text-red-400 mr-2 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 계정 정보 섹션 */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-primary-300 border-b border-primary-700/50 pb-2">
                  계정 정보
                </h3>

                {/* 사용자명 */}
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
                      placeholder="사용자명 (3자 이상)"
                    />
                  </div>
                </div>

                {/* 이메일 */}
                <div>
                  <label htmlFor="email" className="label-game">
                    이메일
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="input-game pl-10"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                {/* 비밀번호 */}
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
                      placeholder="비밀번호 (6자 이상)"
                    />
                  </div>
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-400">비밀번호 강도</span>
                        <span className={`font-semibold ${
                          passwordStrength >= 3 ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${(passwordStrength / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 비밀번호 확인 */}
                <div>
                  <label htmlFor="confirmPassword" className="label-game">
                    비밀번호 확인
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-game pl-10"
                      placeholder="비밀번호 재입력"
                    />
                    {confirmPassword && formData.password === confirmPassword && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <Check className="h-5 w-5 text-green-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 캐릭터 정보 섹션 */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-primary-300 border-b border-primary-700/50 pb-2">
                  캐릭터 정보
                </h3>

                {/* 캐릭터명 */}
                <div>
                  <label htmlFor="character_name" className="label-game">
                    캐릭터명
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Gamepad2 className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="character_name"
                      name="character_name"
                      type="text"
                      required
                      value={formData.character_name}
                      onChange={handleChange}
                      className="input-game pl-10"
                      placeholder="게임 내 캐릭터명"
                    />
                  </div>
                </div>

                {/* 서버 */}
                <div>
                  <label htmlFor="server" className="label-game">
                    서버
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Server className="h-5 w-5 text-gray-500" />
                    </div>
                    <select
                      id="server"
                      name="server"
                      required
                      value={formData.server}
                      onChange={handleChange}
                      className="input-game pl-10 appearance-none"
                    >
                      <option value="">서버 선택</option>
                      {FF14_SERVERS.map(server => (
                        <option key={server} value={server}>{server}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 주 직업 */}
                <div>
                  <label htmlFor="job" className="label-game">
                    주 직업 (선택사항)
                  </label>
                  <select
                    id="job"
                    name="job"
                    value={formData.job || ''}
                    onChange={handleChange}
                    className="input-game appearance-none"
                  >
                    <option value="">직업 선택</option>
                    <optgroup label="탱커">
                      {FF14_JOBS.filter(job => job.role === 'tank').map(job => (
                        <option key={job.value} value={job.value}>{job.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="힐러">
                      {FF14_JOBS.filter(job => job.role === 'healer').map(job => (
                        <option key={job.value} value={job.value}>{job.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="딜러">
                      {FF14_JOBS.filter(job => job.role === 'dps').map(job => (
                        <option key={job.value} value={job.value}>{job.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-game w-full flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  계정 생성 중...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2" size={20} />
                  회원가입
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

          {/* 로그인 링크 */}
          <div className="text-center">
            <p className="text-gray-400">
              이미 계정이 있으신가요?{' '}
              <Link
                to="/login"
                className="font-semibold text-primary-400 hover:text-primary-300 transition-colors"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};