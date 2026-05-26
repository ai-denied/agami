from database import engine, Base
import models

def init_db():
    # Base에 연결된 모든 테이블(User 등)을 DB에 생성합니다.
    Base.metadata.create_all(bind=engine)
    print("🚀 테이블 생성 완료!")

if __name__ == "__main__":
    init_db()