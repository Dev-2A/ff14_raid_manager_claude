import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True # 개발 환경에서만 사용 (파일 변경 시 자동 재시작)
    )