from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 데이터베이스 URL 설정
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./ff14_raid_manager.db"
)

# SQLite를 위한 특별 설정
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

# SQLAlchemy 엔진 생성
engine = create_engine(DATABASE_URL, connect_args=connect_args)

# 세션 로컬 클래스 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 클래스 생성
Base = declarative_base()

# 데이터베이스 의존성은 core/deps.py에서 관리