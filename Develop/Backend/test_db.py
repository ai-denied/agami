from database import engine, SessionLocal
from sqlalchemy import text

def test_connection():
    try:
        # 1. DB 엔진으로 연결 시도
        with engine.connect() as connection:
            # 2. 간단한 SQL 쿼리 실행 (PostgreSQL 버전 확인)
            result = connection.execute(text("SELECT version();"))
            version = result.fetchone()
            print("✅ DB 연결 성공!")
            print(f"📡 서버 버전: {version[0]}")
            
    except Exception as e:
        print("❌ DB 연결 실패...")
        print(f"📝 에러 내용: {e}")

if __name__ == "__main__":
    test_connection()