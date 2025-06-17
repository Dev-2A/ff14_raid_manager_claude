import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiError } from '../types';

// API 기본 URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// axios 인스턴스 생성
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30초 타임아웃
});

// 토큰 관리 유틸리티
const tokenUtils = {
  getAccessToken: (): string | null => {
    return localStorage.getItem('access_token');
  },

  setAccessToken: (token: string): void => {
    localStorage.setItem('access_token', token);
  },

  removeAccessToken: (): void => {
    localStorage.removeItem('access_token');
  },

  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // 밀리초로 변환
      return Date.now() > exp;
    } catch {
      return true;
    }
  }
};

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    const token = tokenUtils.getAccessToken();

    if (token) {
      // 토큰 만료 체크
      if (tokenUtils.isTokenExpired(token)) {
        tokenUtils.removeAccessToken();
        window.location.href = '/login';
        return Promise.reject(new Error('Token expired'));
      }

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as any;

    // 네트워크 에러 처리
    if (!error.response) {
      console.error('네트워크 오류: ', error.message);
      return Promise.reject({
        detail: '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.',
        status_code: 0
      });
    }

    // 401 에러 처리 (인증 실패)
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 토큰 갱신 시도
        const refreshResponse = await api.post('/auth/refresh');
        const { access_token } = refreshResponse.data;

        tokenUtils.setAccessToken(access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        return api(originalRequest);
      } catch (refreshError) {
        // 토큰 갱신 실패 - 로그인 페이지로 이동
        tokenUtils.removeAccessToken();
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // 403 에러 처리 (권한 없음)
    if (error.response.status === 403) {
      return Promise.reject({
        detail: error.response.data?.detail || '이 작업을 수행할 권한이 없습니다.',
        status_code: 403
      });
    }

    // 422 에러 처리 (유효성 검사 실패)
    if (error.response.status === 422) {
      const validationErrors = error.response.data as any;
      return Promise.reject({
        detail: '입력 데이터를 확인해주세요.',
        validation_errors: validationErrors.detail,
        status_code: 422
      });
    }

    // 기타 에러
    return Promise.reject({
      detail: error.response.data?.detail || '오류가 발생했습니다.',
      status_code: error.response.status
    });
  }
);

// 파일 업로드용 axios 인스턴스
const fileApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5분 타임아웃 (대용량 파일 고려)
});

// 파일 업로드 요청 인터셉터
fileApi.interceptors.request.use(
  (config) => {
    const token = tokenUtils.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// FormData 변환 유틸리티
export const createFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();

  Object.keys(data).forEach(key => {
    const value = data[key];

    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item instanceof File) {
          formData.append(`${key}[${index}]`, item);
        } else {
          formData.append(`${key}[${index}]`, JSON.stringify(item));
        }
      });
    } else if (value !== null && value !== undefined) {
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
  });

  return formData;
};

// 쿼리 파라미터 생성 유틸리티
export const createQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.keys(params).forEach(key => {
    const value = params[key];

    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  return searchParams.toString();
};

// 에러 메시지 추출 유틸리티
export const extractErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.detail) {
    if (typeof error.detail === 'string') {
      return error.detail;
    }
    if (Array.isArray(error.detail)) {
      return error.detail.map((e: any) => e.msg || e.message || String(e)).join(', ');
    }
  }

  if (error?.message) {
    return error.message;
  }

  return '알 수 없는 오류가 발생했습니다.';
};

// 날짜 포맷 유틸리티
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
};

// 디바운스 유틸리티
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// 기본 내보내기
export default api;
export { fileApi, tokenUtils };