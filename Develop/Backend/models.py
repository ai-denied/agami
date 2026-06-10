from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    kakao_id = Column(String, unique=True, index=True, nullable=True) 
    google_id = Column(String, unique=True, index=True, nullable=True)
    nickname = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)
    
    # 신규 추가: 결제 플랜
    plan = Column(String, default="Basic") 
    
    # 신규 추가: User와 Project의 1:N 관계 정의
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    domains = Column(String, nullable=False)
    site_key = Column(String, unique=True, index=True, nullable=False)
    secret_key = Column(String, unique=True, nullable=False)
    monthly_usage = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    owner = relationship("User", back_populates="projects")