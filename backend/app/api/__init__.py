from fastapi import APIRouter
from app.api import auth, raids

# 메인 API 라우터
api_router = APIRouter()

# 각 모듈의 라우터 포함
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"]
)

api_router.include_router(
    raids.router,
    prefix="/raids",
    tags=["raids"]
)

# 나중에 추가할 라우터들
# api_router.include_router(users.router, prefix="/users", tags=["users"])
# api_router.include_router(equipment.router, prefix="/equipment", tags=["equipment"])
# api_router.include_router(distribution.router, prefix="/distribution", tags=["distribution"])
# api_router.include_router(schedules.router, prefix="/schedules", tags=["schedules"])