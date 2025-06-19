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
  emial: string;
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
      character_name: user?.character_name,
      server: user?.server,
      job: user?.job,
      emial: user?.email
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
    mutationFn: (data: ProfileFormData) => authApi.
  })
}