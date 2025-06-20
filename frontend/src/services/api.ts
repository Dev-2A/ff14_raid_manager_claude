import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Token, ApiError } from '../types';

// API 기본 URL 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Axios 인스턴스 생성
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰 관리 함수
const tokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem('access_token');
  },
  setToken: (token: string): void => {
    localStorage.setItem('access_token', token);
  },
  removeToken: (): void => {
    localStorage.removeItem('access_token');
  },
};

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    if (error.response) {
      // 401 Unauthorized - 토큰 만료 또는 무효
      if (error.response.status === 401 && !window.location.pathname.includes('/login')) {
        tokenManager.removeToken();
        window.location.href = '/login';
      }
      
      // API 에러 메시지 추출
      let message = '알 수 없는 오류가 발생했습니다.';
      
      const data = error.response.data;
      
      if (data && typeof data === 'object' && 'detail' in data) {
        const detail = data.detail;
        
        // detail이 문자열인 경우
        if (typeof detail === 'string') {
          message = detail;
        }
        // detail이 배열인 경우 (validation errors)
        else if (Array.isArray(detail)) {
          if (detail.length > 0) {
            const firstError = detail[0];
            if (typeof firstError === 'object' && 'msg' in firstError) {
              message = firstError.msg;
            } else {
              message = '입력 값을 확인해주세요.';
            }
          }
        }
        // detail이 객체인 경우
        else if (typeof detail === 'object' && detail !== null && 'msg' in detail) {
          message = (detail as any).msg;
        }
      }
      
      // 에러를 더 사용하기 쉬운 형태로 변환
      return Promise.reject({
        status: error.response.status,
        message: message,
        data: error.response.data
      });
    } else if (error.request) {
      // 서버 응답 없음
      return Promise.reject({
        status: 0,
        message: '서버에 연결할 수 없습니다.',
        data: null
      });
    }
    
    return Promise.reject({
      status: 0,
      message: '요청을 처리할 수 없습니다.',
      data: null
    });
  }
);

// 파일 업로드용 Axios 인스턴스
const fileApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// 파일 업로드 인터셉터
fileApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 공통 API 함수들
export const apiClient = {
  // GET 요청
  get: <T>(url: string, params?: any) => 
    api.get<T>(url, { params }).then(res => res.data),
  
  // POST 요청 - config 옵션 추가
  post: <T>(url: string, data?: any, config?: any) => 
    api.post<T>(url, data, config).then(res => res.data),
  
  // PUT 요청
  put: <T>(url: string, data?: any) => 
    api.put<T>(url, data).then(res => res.data),
  
  // DELETE 요청
  delete: <T>(url: string, params?: any) => 
    api.delete<T>(url, { params }).then(res => res.data),
  
  // 파일 업로드
  upload: <T>(url: string, formData: FormData) => 
    fileApi.post<T>(url, formData).then(res => res.data),
};

// 토큰 관리 export
export { tokenManager };

// Axios 인스턴스 export (필요한 경우 직접 사용)
export default api;