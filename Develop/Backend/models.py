from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    # 카카오와 구글 중 하나로만 로그인할 수 있으므로 둘 다 nullable=True 처리 필요
    kakao_id = Column(String, unique=True, index=True, nullable=True) 
    google_id = Column(String, unique=True, index=True, nullable=True) # 이 줄을 추가하세요
    nickname = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)