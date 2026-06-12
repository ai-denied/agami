import os
import requests
import secrets
import hmac
import hashlib

from fastapi import FastAPI, Depends, HTTPException, Response, Request
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from database import SessionLocal
import models
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from jose import jwt
from pydantic import BaseModel

class ProjectCreate(BaseModel):
    name: str
    domains: str

class ProjectUpdate(BaseModel):
    name: str
    domains: str

class PaymentApprove(BaseModel):
    tid: str
    pg_token: str

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://agami-captcha.cloud"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", 60))

# --- 캡차 DB 세션 설정 (방식 A 적용) ---
CAPTCHA_DB_URL = os.getenv("CAPTCHA_DB_URL")
if CAPTCHA_DB_URL:
    captcha_engine = create_engine(CAPTCHA_DB_URL)
    CaptchaSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=captcha_engine)
else:
    CaptchaSessionLocal = None

def get_captcha_db():
    if not CaptchaSessionLocal:
        raise HTTPException(status_code=500, detail="캡차 DB(CAPTCHA_DB_URL) 환경 변수가 설정되지 않았습니다.")
    db = CaptchaSessionLocal()
    try:
        yield db
    finally:
        db.close()
# -------------------------------------

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 클라이언트 요청 모델 ---
class ProfileUpdate(BaseModel):
    nickname: str

# -----------------------------------------------------------------------------
# 카카오 로그인 콜백 API
# -----------------------------------------------------------------------------
@app.get("/api/auth/kakao/callback")
async def kakao_callback(code: str, response: Response, db: Session = Depends(get_db)):
    token_url = "https://kauth.kakao.com/oauth/token"
    payload = {
        "grant_type": "authorization_code",
        "client_id": os.getenv("KAKAO_CLIENT_ID"),
        "redirect_uri": os.getenv("KAKAO_REDIRECT_URI", "https://agami-captcha.cloud/auth/kakao/callback"),
        "code": code
    }
    
    token_res = requests.post(token_url, data=payload)
    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail="카카오 토큰 요청 실패")
    
    access_token = token_res.json().get("access_token")
    user_res = requests.get("https://kapi.kakao.com/v2/user/me", headers={"Authorization": f"Bearer {access_token}"}).json()
    
    kakao_id = str(user_res.get("id"))
    properties = user_res.get("properties", {})
    
    # 미동의 시 기본 이미지 할당
    profile_img = properties.get("profile_image") or "/agami-profile.png"
    
    user = db.query(models.User).filter(models.User.kakao_id == kakao_id).first()
    if not user:
        user = models.User(kakao_id=kakao_id, nickname=properties.get("nickname"), profile_image=profile_img)
        db.add(user)
    else:
        user.nickname = properties.get("nickname")
        user.profile_image = profile_img
    db.commit()
    db.refresh(user)

    jwt_token = create_access_token({"sub": str(user.id), "nickname": user.nickname})
    response.set_cookie(key="accessToken", value=jwt_token, httponly=True, secure=True, samesite="lax", path="/")
    
    return {
        "status": "success",
        "user": {"id": user.id, "nickname": user.nickname, "profile": user.profile_image, "plan": user.plan},
    }

# -----------------------------------------------------------------------------
# 구글 로그인 콜백 API
# -----------------------------------------------------------------------------
@app.get("/api/auth/google/callback")
async def google_callback(code: str, response: Response, db: Session = Depends(get_db)):
    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        "grant_type": "authorization_code",
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "redirect_uri": os.getenv("GOOGLE_REDIRECT_URI", "https://agami-captcha.cloud/auth/google/callback"),
        "code": code
    }
    
    token_res = requests.post(token_url, data=payload)
    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail="구글 토큰 요청 실패")
    
    access_token = token_res.json().get("access_token")
    user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    user_res = requests.get(user_info_url, headers={"Authorization": f"Bearer {access_token}"}).json()
    
    google_id = str(user_res.get("id"))
    name = user_res.get("name", "구글 유저")
    
    # 미동의 시 기본 이미지 할당
    profile_img = user_res.get("picture") or "/agami-profile.png"
    
    user = db.query(models.User).filter(models.User.google_id == google_id).first()
    if not user:
        user = models.User(google_id=google_id, nickname=name, profile_image=profile_img)
        db.add(user)
    else:
        user.nickname = name
        user.profile_image = profile_img
    db.commit()
    db.refresh(user)

    jwt_token = create_access_token({"sub": str(user.id), "nickname": user.nickname})
    response.set_cookie(key="accessToken", value=jwt_token, httponly=True, secure=True, samesite="lax", path="/")
    
    return {
        "status": "success",
        "user": {"id": user.id, "nickname": user.nickname, "profile": user.profile_image, "plan": user.plan},
    }

# -----------------------------------------------------------------------------
# 공통 인증 및 프로필 수정/로그아웃 API
# -----------------------------------------------------------------------------
@app.get("/api/auth/me")
async def get_me(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("accessToken")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return {"status": "success", "user": {"id": user.id, "nickname": user.nickname, "profile": user.profile_image, "plan": user.plan}}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.patch("/api/auth/me")
async def update_profile(
    data: ProfileUpdate, 
    request: Request, 
    db: Session = Depends(get_db)
):
    token = request.cookies.get("accessToken")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.nickname:
        user.nickname = data.nickname

    db.commit()
    db.refresh(user)

    return {
        "status": "success",
        "user": {"id": user.id, "nickname": user.nickname, "profile": user.profile_image, "plan": user.plan}
    }
    
@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="accessToken", path="/", httponly=True, secure=True, samesite="lax")
    return {"status": "success"}

# -----------------------------------------------------------------------------
# 프로젝트 API (캡차 동기화 로직 포함)
# -----------------------------------------------------------------------------
@app.post("/api/projects")
async def create_project(data: ProjectCreate, request: Request, db: Session = Depends(get_db), captcha_db: Session = Depends(get_captcha_db)):
    token = request.cookies.get("accessToken")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    generated_site_key = f"agami_site_{secrets.token_hex(16)}"
    generated_secret_key = f"agami_secret_{secrets.token_hex(32)}"

    # 1. Agami DB에 모델 추가 준비
    new_project = models.Project(
        user_id=user_id,
        name=data.name,
        domains=data.domains,
        site_key=generated_site_key,
        secret_key=generated_secret_key
    )
    db.add(new_project)

    # 2. 캡차 DB 동기화를 위한 해시 계산
    pepper = os.getenv("API_KEY_HMAC_PEPPER", "")
    if not pepper:
        raise HTTPException(status_code=500, detail="API_KEY_HMAC_PEPPER 환경 변수가 설정되지 않았습니다.")
        
    secret_hash = hmac.new(
        pepper.encode("utf-8"), 
        generated_secret_key.encode("utf-8"), 
        hashlib.sha256
    ).hexdigest()

    # 명세서 기준 고정 테넌트
    tenant_id = "11111111-1111-1111-1111-111111111111" 

    try:
        # [캡차 DB] api_keys 테이블 INSERT [cite: 19]
        captcha_db.execute(
            text("""
                INSERT INTO api_keys (tenant_id, name, client_key, secret_hash, owner_user_id)
                VALUES (:tenant_id, :name, :client_key, :secret_hash, :owner_user_id)
            """),
            {
                "tenant_id": tenant_id,
                "name": data.name,
                "client_key": generated_site_key,
                "secret_hash": secret_hash,
                "owner_user_id": str(user_id)
            }
        )

        # [캡차 DB] allowed_origins 테이블 INSERT (도메인 분리) [cite: 31, 32]
        domain_list = [d.strip() for d in data.domains.split(",") if d.strip()]
        for domain in domain_list:
            captcha_db.execute(
                text("""
                    INSERT INTO allowed_origins (tenant_id, origin, client_key)
                    VALUES (:tenant_id, :origin, :client_key)
                """),
                {
                    "tenant_id": tenant_id,
                    "origin": domain,
                    "client_key": generated_site_key
                }
            )

        # 모두 정상 처리되면 양쪽 DB Commit
        db.commit()
        captcha_db.commit()
        db.refresh(new_project)

    except Exception as e:
        db.rollback()
        captcha_db.rollback()
        raise HTTPException(status_code=500, detail=f"프로젝트 생성 동기화 중 오류가 발생했습니다: {str(e)}")

    return {"status": "success"}

@app.get("/api/projects")
async def get_projects(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("accessToken")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    projects = db.query(models.Project).filter(models.Project.user_id == user_id).all()
    return {
        "status": "success",
        "projects": [
            {
                "id": p.id,
                "name": p.name,
                "domains": p.domains,
                "site_key": p.site_key,
                "secret_key": p.secret_key,
                "monthly_usage": p.monthly_usage
            } for p in projects
        ]
    }

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: int, request: Request, db: Session = Depends(get_db), captcha_db: Session = Depends(get_captcha_db)):
    token = request.cookies.get("accessToken")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == user_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        # 1. Agami DB에서 삭제
        db.delete(project)
        
        # 2. 캡차 DB: revoked_at 활성화로 소프트 삭제 [cite: 39]
        captcha_db.execute(
            text("UPDATE api_keys SET revoked_at = NOW() WHERE client_key = :client_key"),
            {"client_key": project.site_key}
        )

        db.commit()
        captcha_db.commit()

    except Exception as e:
        db.rollback()
        captcha_db.rollback()
        raise HTTPException(status_code=500, detail=f"프로젝트 삭제 동기화 실패: {str(e)}")
    
    return {"status": "success"}

@app.get("/api/projects/{project_id}")
async def get_project(project_id: int, request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")

    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == user_id).first()
    if not project: raise HTTPException(status_code=404, detail="Project not found")

    # 팀원 명세서에 맞춘 정확한 임베드 스니펫 형식 제공 [cite: 43]
    embed_url = f"https://agami-captcha.cloud/widget/embed?kind=default&difficulty=normal&client_key={project.site_key}"
    embed_snippet = f'<iframe src="{embed_url}" width="100%" height="500px" frameborder="0"></iframe>'

    return {
        "status": "success",
        "project": {
            "id": project.id, 
            "name": project.name, 
            "domains": project.domains,
            "site_key": project.site_key, 
            "secret_key": project.secret_key, 
            "monthly_usage": project.monthly_usage,
            "embed_snippet": embed_snippet
        }
    }

@app.patch("/api/projects/{project_id}")
async def update_project(project_id: int, data: ProjectUpdate, request: Request, db: Session = Depends(get_db), captcha_db: Session = Depends(get_captcha_db)):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")

    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == user_id).first()
    if not project: raise HTTPException(status_code=404, detail="Project not found")

    project.name = data.name
    project.domains = data.domains

    try:
        # [캡차 DB] api_keys 이름 업데이트
        captcha_db.execute(
            text("UPDATE api_keys SET name = :name WHERE client_key = :client_key"),
            {"name": data.name, "client_key": project.site_key}
        )

        # [캡차 DB] 도메인 갱신 (기존 삭제 후 재생성)
        captcha_db.execute(
            text("DELETE FROM allowed_origins WHERE client_key = :client_key"),
            {"client_key": project.site_key}
        )

        tenant_id = "11111111-1111-1111-1111-111111111111"
        domain_list = [d.strip() for d in data.domains.split(",") if d.strip()]
        for domain in domain_list:
            captcha_db.execute(
                text("""
                    INSERT INTO allowed_origins (tenant_id, origin, client_key)
                    VALUES (:tenant_id, :origin, :client_key)
                """),
                {
                    "tenant_id": tenant_id,
                    "origin": domain,
                    "client_key": project.site_key
                }
            )

        db.commit()
        captcha_db.commit()

    except Exception as e:
        db.rollback()
        captcha_db.rollback()
        raise HTTPException(status_code=500, detail=f"프로젝트 업데이트 동기화 실패: {str(e)}")
    
    return {"status": "success"}

# -----------------------------------------------------------------------------
# 결제 API
# -----------------------------------------------------------------------------
@app.post("/api/payment/ready")
async def payment_ready(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = str(payload.get("sub"))
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")

    url = "https://open-api.kakaopay.com/online/v1/payment/ready"
    headers = {
        "Authorization": f"SECRET_KEY {os.getenv('KAKAO_PAY_SECRET_KEY')}",
        "Content-type": "application/json"
    }
    
    data = {
        "cid": "TC0ONETIME", 
        "partner_order_id": f"ORDER_{user_id}",
        "partner_user_id": user_id,
        "item_name": "Agami Pro 요금제",
        "quantity": 1,
        "total_amount": 49000,
        "tax_free_amount": 0,
        "approval_url": "https://agami-captcha.cloud/payment/success",
        "cancel_url": "https://agami-captcha.cloud/price",
        "fail_url": "https://agami-captcha.cloud/price"
    }

    response = requests.post(url, headers=headers, json=data)
    res_data = response.json()

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail=f"결제 준비 실패: {res_data}")

    return {
        "status": "success",
        "next_redirect_pc_url": res_data.get("next_redirect_pc_url"),
        "tid": res_data.get("tid")
    }

@app.post("/api/payment/approve")
async def payment_approve(data: PaymentApprove, request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = str(payload.get("sub"))
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")

    url = "https://open-api.kakaopay.com/online/v1/payment/approve"
    headers = {
        "Authorization": f"SECRET_KEY {os.getenv('KAKAO_PAY_SECRET_KEY')}",
        "Content-type": "application/json"
    }
    
    payload_data = {
        "cid": "TC0ONETIME",
        "tid": data.tid,
        "partner_order_id": f"ORDER_{user_id}",
        "partner_user_id": user_id,
        "pg_token": data.pg_token
    }

    response = requests.post(url, headers=headers, json=payload_data)
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail=f"결제 승인 실패: {response.json()}")

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user:
        user.plan = "Pro"
        db.commit()

    return {"status": "success", "message": "결제가 완료되었습니다."}

# -----------------------------------------------------------------------------
# 모델 정의 
# -----------------------------------------------------------------------------
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
    
    plan = Column(String, default="Basic") 
    
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