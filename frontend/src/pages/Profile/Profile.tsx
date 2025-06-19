import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { authApi, raidGroupApi } from "../../api/endpoints";
import { User, GAME_SERVERS, JOBS } from "../../types";
import { PageLoading } from "../../components/Common/LoadingScreen";
import { 
  User as UserIcon, Mail, Server, Briefcase, Calendar,
  Shield, Crown, Edit2, Save, X, Loader2, Check,
  AlertCircle, Lock, Eye, EyeOff, Users, TrendingUp
} from 'lucide-react';
import { formatDate } from "../../api/config";

interface ProfileFormData {
  character_name: string;
  server: string;
  job?: string;
  email: string;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const Profile: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 내 공대 목록 조회
  const { data: myGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ['myRaidGroups'],
    queryFn: () => raidGroupApi.myGroups()
  });

  // 프로필 폼
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm<ProfileFormData>({
    defaultValues: {
      character_name: user?.character_name || '',
      server: user?.server || '',
      job: user?.job || '',
      email: user?.email || ''
    }
  });

  // 비밀번호 폼
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch
  } = useForm<PasswordFormData>();

  const newPassword = watch('new_password');

  // 프로필 수정 mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => authApi.updateProfile({
      character_name: data.character_name,
      server: data.server,
      job: data.job,
      email: data.email
    }),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditingProfile(false);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    },
    onError: (error: any) => {
      console.error('프로필 수정 실패:', error);
    }
  });

  // 비밀번호 변경 mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordFormData) => authApi.changePassword({
      current_password: data.current_password,
      new_password: data.new_password
    }),
    onSuccess: () => {
      resetPassword();
      setIsEditingPassword(false);
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
    onError: (error: any) => {
      console.error('비밀번호 변경 실패:', error);
    }
  });

  // 프로필 수정 제출
  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  // 비밀번호 변경 제출
  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  // 프로필 수정 취소
  const cancelProfileEdit = () => {
    resetProfile({
      character_name: user?.character_name || '',
      server: user?.server || '',
      job: user?.job || '',
      email: user?.email || ''
    });
    setIsEditingProfile(false);
  };

  // 비밀번호 수정 취소
  const cancelPasswordEdit = () => {
    resetPassword();
    setIsEditingPassword(false);
  };

  if (!user) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-dark-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-300 mb-2">프로필</h1>
          <p className="text-gray-400">계정 정보 및 캐릭터 설정을 관리합니다</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 프로필 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 */}
            <div className="game-panel">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-primary-300 flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  기본 정보
                </h2>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="btn btn-secondary btn-sm flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    수정
                  </button>
                )}
              </div>

              {/* 성공 메시지 */}
              {profileSuccess && (
                <div className="mb-4 p-3 bg-green-600/20 border border-green-600/50 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">프로필이 성공적으로 수정되었습니다!</span>
                </div>
              )}

              {/* 에러 메시지 */}
              {updateProfileMutation.isError && (
                <div className="mb-4 p-3 bg-red-600/20 border border-red-600/50 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">
                    {(updateProfileMutation.error as any)?.detail || '프로필 수정에 실패했습니다.'}
                  </span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                {/* 캐릭터명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    캐릭터명
                  </label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      {...registerProfile('character_name', {
                        required: '캐릭터명을 입력해주세요'
                      })}
                      className="input w-full"
                    />
                  ) : (
                    <p className="text-lg text-white">{user.character_name}</p>
                  )}
                  {profileErrors.character_name && (
                    <p className="mt-1 text-sm text-red-400">{profileErrors.character_name.message}</p>
                  )}
                </div>

                {/* 서버 */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    서버
                  </label>
                  {isEditingProfile ? (
                    <select
                      {...registerProfile('server', {
                        required: '서버를 선택해주세요'
                      })}
                      className="input w-full"
                    >
                      <option value="">서버 선택</option>
                      {GAME_SERVERS.map(server => (
                        <option key={server} value={server}>{server}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-lg text-white flex items-center gap-2">
                      <Server className="w-4 h-4 text-gray-400" />
                      {user.server}
                    </p>
                  )}
                  {profileErrors.server && (
                    <p className="mt-1 text-sm text-red-400">{profileErrors.server.message}</p>
                  )}
                </div>

                {/* 직업 */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    메인 직업
                  </label>
                  {isEditingProfile ? (
                    <select
                      {...registerProfile('job')}
                      className="input w-full"
                    >
                      <option value="">직업 선택</option>
                      {Object.entries(JOBS).map(([category, jobs]) => (
                        <optgroup key={category} label={category}>
                          {jobs.map(job => (
                            <option key={job.value} value={job.value}>{job.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  ) : (
                    <p className="text-lg text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      {user.job || '미설정'}
                    </p>
                  )}
                </div>

                {/* 이메일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    이메일
                  </label>
                  {isEditingProfile ? (
                    <input
                      type="email"
                      {...registerProfile('email', {
                        required: '이메일을 입력해주세요',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: '올바른 이메일 형식이 아닙니다'
                        }
                      })}
                      className="input w-full"
                    />
                  ) : (
                    <p className="text-lg text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {user.email}
                    </p>
                  )}
                  {profileErrors.email && (
                    <p className="mt-1 text-sm text-red-400">{profileErrors.email.message}</p>
                  )}
                </div>

                {/* 수정 모드 버튼 */}
                {isEditingProfile && (
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          저장 중...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          저장
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelProfileEdit}
                      className="btn btn-dark"
                    >
                      취소
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* 비밀번호 변경 */}
            <div className="game-panel">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-primary-300 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  비밀번호 변경
                </h2>
                {!isEditingPassword && (
                  <button
                    onClick={() => setIsEditingPassword(true)}
                    className="btn btn-secondary btn-sm flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    변경
                  </button>
                )}
              </div>

              {/* 성공 메시지 */}
              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-600/20 border border-green-600/50 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">비밀번호가 성공적으로 변경되었습니다!</span>
                </div>
              )}

              {/* 에러 메시지 */}
              {changePasswordMutation.isError && (
                <div className="mb-4 p-3 bg-red-600/20 border border-red-600/50 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">
                    {(changePasswordMutation.error as any)?.detail || '비밀번호 변경에 실패했습니다.'}
                  </span>
                </div>
              )}

              {isEditingPassword ? (
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                  {/* 현재 비밀번호 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      현재 비밀번호
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        {...registerPassword('current_password', {
                          required: '현재 비밀번호를 입력해주세요'
                        })}
                        className="input w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordErrors.current_password && (
                      <p className="mt-1 text-sm text-red-400">{passwordErrors.current_password.message}</p>
                    )}
                  </div>

                  {/* 새 비밀번호 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      새 비밀번호
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        {...registerPassword('new_password', {
                          required: '새 비밀번호를 입력해주세요',
                          minLength: {
                            value: 6,
                            message: '비밀번호는 최소 6자 이상이어야 합니다'
                          }
                        })}
                        className="input w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordErrors.new_password && (
                      <p className="mt-1 text-sm text-red-400">{passwordErrors.new_password.message}</p>
                    )}
                  </div>

                  {/* 비밀번호 확인 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      새 비밀번호 확인
                    </label>
                    <input
                      type="password"
                      {...registerPassword('confirm_password', {
                        required: '비밀번호 확인을 입력해주세요',
                        validate: value => value === newPassword || '비밀번호가 일치하지 않습니다'
                      })}
                      className="input w-full"
                    />
                    {passwordErrors.confirm_password && (
                      <p className="mt-1 text-sm text-red-400">{passwordErrors.confirm_password.message}</p>
                    )}
                  </div>

                  {/* 버튼 */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      {changePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          변경 중...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          변경
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelPasswordEdit}
                      className="btn btn-dark"
                    >
                      취소
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-gray-400">
                  보안을 위해 비밀번호를 주기적으로 변경하는 것을 권장합니다.
                </p>
              )}
            </div>
          </div>

          {/* 오른쪽: 계정 정보 및 통계 */}
          <div className="space-y-6">
            {/* 계정 정보 */}
            <div className="game-panel">
              <h2 className="text-xl font-semibold text-primary-300 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                계정 정보
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">계정 유형</span>
                  <span className="flex items-center gap-2">
                    {user.is_admin ? (
                      <>
                        <Crown className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400">관리자</span>
                      </>
                    ) : (
                      <span className="text-white">일반 사용자</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">계정 상태</span>
                  <span className={`${user.is_active ? 'text-green-400' : 'text-red-400'}`}>
                    {user.is_active ? '활성' : '비활성'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">가입일</span>
                  <span className="text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(user.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* 활동 통계 */}
            <div className="game-panel">
              <h2 className="text-xl font-semibold text-primary-300 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                활동 통계
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">참여 중인 공대</span>
                  <span className="text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    {myGroups?.length || 0}개
                  </span>
                </div>
              </div>
            </div>

            {/* 참여 중인 공대 목록 */}
            {myGroups && myGroups.length > 0 && (
              <div className="game-panel">
                <h2 className="text-xl font-semibold text-primary-300 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  참여 중인 공대
                </h2>
                <div className="space-y-3">
                  {myGroups.map(group => (
                    <div
                      key={group.id}
                      className="p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                    >
                      <h3 className="font-semibold text-white mb-1">{group.name}</h3>
                      <p className="text-sm text-gray-400">{group.raid?.name}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>멤버 {group.member_count || 0}/{group.max_members}</span>
                        {group.leader_id === user.id && (
                          <span className="text-yellow-400">공대장</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;