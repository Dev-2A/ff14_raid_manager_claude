import { apiClient, tokenManager } from './api';
import { User, UserCreate, UserLogin, UserUpdate, Token, PasswordChange } from '../types';

class AuthService {
  // 회원가입
  async register(userData: UserCreate): Promise<User> {
    const response = await apiClient.post<User>('/auth/register', userData);
    return response;
  }

  // 로그인
  async login(credentials: UserLogin): Promise<User> {
    // URL encoded form data로 변환 (OAuth2PasswordRequestForm 형식)
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await apiClient.post<Token>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    tokenManager.setToken(response.access_token);
    
    // 로그인 후 사용자 정보 가져오기
    const user = await this.getCurrentUser();
    return user;
  }

  // 로그아웃
  logout(): void {
    tokenManager.removeToken();
    window.location.href = '/login';
  }

  // 현재 사용자 정보 조회
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  }

  // 프로필 업데이트
  async updateProfile(userData: UserUpdate): Promise<User> {
    return apiClient.put<User>('/auth/me', userData);
  }

  // 비밀번호 변경
  async changePassword(passwordData: PasswordChange): Promise<{ message: string }> {
    return apiClient.post('/auth/change-password', passwordData);
  }

  // 토큰 갱신
  async refreshToken(): Promise<Token> {
    const response = await apiClient.post<Token>('/auth/refresh');
    tokenManager.setToken(response.access_token);
    return response;
  }

  // 로그인 상태 확인
  isAuthenticated(): boolean {
    return tokenManager.getToken() !== null;
  }
}

export const authService = new AuthService();