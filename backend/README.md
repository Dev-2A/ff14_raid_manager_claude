# FF14 레이드 매니저 - 백엔드

## 설치 및 실행

### 1. 가상환경 활성화
```bash
# 프로젝트 루트에서
venv\Scripts\activate
```

### 2. 백엔드 폴더로 이동
```bash
cd backend
```

### 3. 서버 실행
```bash
python run.py
```

또는

```bash
uvicorn app.main:app --reload
```

### 4. API 문서 확인
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 엔드포인트

### 인증 (Authentication)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 내 정보 조회
- `POST /api/auth/refresh` - 토큰 갱신

## 개발 상태

### ✅ 완성된 기능
- 데이터베이스 모델 설계
- Pydantic 스키마 정의
- JWT 기반 인증 시스템
- 기본 API 구조

### 📝 추가 필요한 API
- 레이드 관리 API
- 공대 관리 API
- 장비 세트 관리 API
- 아이템 분배 API
- 레이드 일정 API

## 테스트

### 회원가입 테스트
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@example.com",
       "password": "testpass123",
       "character_name": "테스트캐릭터",
       "server": "카벙클",
       "job": "전사"
     }'
```

### 로그인 테스트
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=testuser&password=testpass123"
```