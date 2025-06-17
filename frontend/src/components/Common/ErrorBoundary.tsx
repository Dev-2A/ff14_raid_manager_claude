import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error: error,
      errorInfo: null,
      showDetails: false
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // 에러 로깅 서비스로 전송 (프로덕션 환경)
    if (process.env.NODE_ENV === 'production') {
      // 여기에 Sentry, LogRocket 등의 에러 로깅 서비스 코드 추가
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // 에러 로깅 서비스 구현
    // 예: Sentry.captureException(error);
    console.log('Error logged to service:', { error, errorInfo });
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="game-panel p-8">
              {/* 에러 아이콘 */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center animate-pulse">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 bg-red-600/20 rounded-full animate-ping"></div>
                </div>
              </div>

              {/* 에러 메시지 */}
              <h1 className="text-3xl font-bold text-center mb-4 text-gradient">
                문제가 발생했습니다
              </h1>
              
              <p className="text-gray-400 text-center mb-8">
                예기치 않은 오류가 발생했습니다. 불편을 드려 죄송합니다.
              </p>

              {/* 액션 버튼들 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button
                  onClick={this.handleReload}
                  className="btn btn-primary flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  페이지 새로고침
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="btn btn-secondary flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  홈으로 이동
                </button>
              </div>

              {/* 개발자용 에러 상세 정보 */}
              {process.env.NODE_ENV === 'development' && (
                <div className="border-t border-dark-600 pt-6">
                  <button
                    onClick={this.toggleDetails}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-4"
                  >
                    {this.state.showDetails ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    개발자 정보 {this.state.showDetails ? '숨기기' : '보기'}
                  </button>

                  {this.state.showDetails && (
                    <div className="space-y-4">
                      {/* 에러 메시지 */}
                      <div className="bg-dark-800 rounded p-4">
                        <h3 className="text-sm font-semibold text-red-400 mb-2">
                          Error Message:
                        </h3>
                        <pre className="text-xs text-gray-400 overflow-x-auto">
                          {this.state.error?.toString()}
                        </pre>
                      </div>

                      {/* 스택 트레이스 */}
                      {this.state.error?.stack && (
                        <div className="bg-dark-800 rounded p-4">
                          <h3 className="text-sm font-semibold text-red-400 mb-2">
                            Stack Trace:
                          </h3>
                          <pre className="text-xs text-gray-400 overflow-x-auto max-h-64 overflow-y-auto">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}

                      {/* 컴포넌트 스택 */}
                      {this.state.errorInfo?.componentStack && (
                        <div className="bg-dark-800 rounded p-4">
                          <h3 className="text-sm font-semibold text-red-400 mb-2">
                            Component Stack:
                          </h3>
                          <pre className="text-xs text-gray-400 overflow-x-auto max-h-64 overflow-y-auto">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 문의 안내 */}
              <div className="text-center text-sm text-gray-500 mt-8">
                <p>문제가 계속되면 관리자에게 문의해주세요.</p>
                <p className="mt-1">
                  Error ID: {Date.now().toString(36).toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 함수형 컴포넌트용 에러 폴백
export const ErrorFallback: React.FC<{
  error: Error;
  resetErrorBoundary: () => void;
}> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-400 mb-2">
          오류가 발생했습니다
        </h2>
        <p className="text-gray-400 mb-4">
          {error.message || '알 수 없는 오류가 발생했습니다.'}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="btn btn-primary"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
};

export default ErrorBoundary;