from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import api_router
from app.database import engine, Base

# 데이터베이스 테이블 생성 (개발 환경용)
# 프로덕션에서는 Alembic 마이그레이션 사용
Base.metadata.create_all(bind=engine)

# FastAPI 앱 생성
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="FF14 레이드 장비 세트 관리 시스템",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 포함
app.include_router(api_router, prefix="/api")

# 루트 엔드포인트
@app.get("/")
def read_root():
    return {
        "message": "FF14 레이드 매니저 API",
        "version": settings.VERSION,
        "docs": "/docs"
    }

# 헬스 체크 엔드포인트
@app.get("/health")
def health_check():
    return {"status": "healthy"}