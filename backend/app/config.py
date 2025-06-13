from pydantic_settings import BaseSettings
from typing import List
import json

class Settings(BaseSettings):
    """
    애플리케이션 설정
    .env 파일에서 환경 변수를 읽어옴
    """
    # 데이터베이스
    DATABASE_URL: str = "sqlite:///./ff14_raid_manager.db"
    
    # JWT 설정
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080 # 7일
    
    # 서버 설정
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS 설정
    BACKEND_CORS_ORIGINS: str = '["http://localhost:3000", "http://localhost:8080"]'
    
    # 애플리케이션 설정
    PROJECT_NAME: str = "FF14 레이드 매니저"
    VERSION: str = "1.0.0"
    
    # 페이지네이션
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # 파일 업로드
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024 # 5MB
    
    # 레이드 설정
    MAX_RAID_MEMBERS: int = 8 # 최대 공대원 수
    
    @property
    def cors_origins(self) -> List[str]:
        """CORS 허용 origin 리스트 반환"""
        return json.loads(self.BACKEND_CORS_ORIGINS)
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# 설정 인스턴스 생성
settings = Settings()