import os
import requests
import secrets
import hmac
import hashlib
import uuid
import logging

from fastapi import FastAPI, Depends, HTTPException, Response, Request, Form
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from database import SessionLocal
import models
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from jose import jwt
from pydantic import BaseModel

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- 유틸리티 함수 ---
def normalize_domain(domain: str) -> str:
    domain = domain.strip()
    
    if domain.startswith("http://") or domain.startswith("https://"):
        return domain
    
    if "localhost" in domain or "127.0.0.1" in domain:
        return f"http://{domain}"
    
    return f"https://{domain}"

class ProjectCreate(BaseModel):
    name: str
    domains: str

class ProjectUpdate(BaseModel):
    name: str
    domains: str

class PaymentApprove(BaseModel):
    tid: str
    pg_token: str

class ProfileUpdate(BaseModel):
    nickname: str

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

# --- 캡차 DB 세션 설정 ---
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

# -----------------------------------------------------------------------------
# 인증 API
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
    response.set_cookie(key="accessToken", value=jwt_token, httponly=True, secure=True, samesite="lax", path="/", domain=".agami-captcha.cloud")
    
    return {"status": "success", "user": {"id": user.id, "nickname": user.nickname, "profile": user.profile_image, "plan": user.plan}}

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
    response.set_cookie(key="accessToken", value=jwt_token, httponly=True, secure=True, samesite="lax", path="/", domain=".agami-captcha.cloud")
    
    return {"status": "success", "user": {"id": user.id, "nickname": user.nickname, "profile": user.profile_image, "plan": user.plan}}

@app.get("/api/auth/me")
async def get_me(request: Request, db: Session = Depends(get_db), captcha_db: Session = Depends(get_captcha_db)):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user: raise HTTPException(status_code=401, detail="User not found")

        try:
            current_plan = "pro" if user.plan == "Pro" else "free"
            captcha_db.execute(text("UPDATE tenants SET billing_plan = :plan, updated_at = NOW() WHERE owner_user_id = :uid"), {"plan": current_plan, "uid": int(user_id)})
            captcha_db.commit()
        except Exception as e:
            captcha_db.rollback()
            logger.error(f"Background Sync Error: {str(e)}")

        return {"status": "success", "user": {"id": user.id, "nickname": user.nickname, "profile": user.profile_image, "plan": user.plan}}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.patch("/api/auth/me")
async def update_profile(data: ProfileUpdate, request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")

    if data.nickname: user.nickname = data.nickname
    db.commit()
    db.refresh(user)
    return {"status": "success", "user": {"id": user.id, "nickname": user.nickname, "profile": user.profile_image, "plan": user.plan}}
    
@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="accessToken", path="/", httponly=True, secure=True, samesite="lax", domain=".agami-captcha.cloud")
    return {"status": "success"}

# 💡 회원 탈퇴 (Danger Zone) 전용 라우터 추가
@app.delete("/api/auth/me")
async def delete_user(request: Request, response: Response, db: Session = Depends(get_db), captcha_db: Session = Depends(get_captcha_db)):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")

    try:
        # 1. 사용자의 모든 프로젝트 정리 연쇄 작업 (Web DB)
        projects = db.query(models.Project).filter(models.Project.user_id == user_id).all()
        for p in projects:
            db.delete(p)
            # 캡챠 엔진 DB API Key 파기 및 도메인 제거
            api_key_record = captcha_db.execute(text("UPDATE api_keys SET revoked_at = NOW() WHERE client_key = :client_key RETURNING id"), {"client_key": p.site_key}).scalar()
            if api_key_record:
                captcha_db.execute(text("DELETE FROM allowed_origins WHERE api_key_id = :ak"), {"ak": api_key_record})
        
        # 2. 캡챠 엔진 DB에서 사용자(Tenant) 자체를 비활성화 (물리적 삭제 대신 기록 남김)
        captcha_db.execute(text("UPDATE tenants SET is_active = false, updated_at = NOW() WHERE owner_user_id = :uid"), {"uid": int(user_id)})

        # 3. 유저 계정 삭제
        db.delete(user)
        
        db.commit()
        captcha_db.commit()
        
        # 4. 쿠키 초기화 (로그아웃 처리와 동일)
        response.delete_cookie(key="accessToken", path="/", httponly=True, secure=True, samesite="lax", domain=".agami-captcha.cloud")
        return {"status": "success"}

    except Exception as e:
        db.rollback()
        captcha_db.rollback()
        raise HTTPException(status_code=500, detail=f"회원 탈퇴 실패: {str(e)}")

# -----------------------------------------------------------------------------
# 프로젝트 API
# -----------------------------------------------------------------------------
@app.post("/api/projects")
async def create_project(data: ProjectCreate, request: Request, db: Session = Depends(get_db), captcha_db: Session = Depends(get_captcha_db)):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")

    domain_list = list(set([normalize_domain(d) for d in data.domains.split(",") if d.strip()]))
    if not domain_list:
        raise HTTPException(status_code=400, detail="유효한 도메인을 최소 1개 이상 입력해주세요.")

    generated_site_key = f"agami_site_{secrets.token_hex(16)}"
    generated_secret_key = f"agami_secret_{secrets.token_hex(32)}"

    new_project = models.Project(user_id=user_id, name=data.name, domains=data.domains, site_key=generated_site_key, secret_key=generated_secret_key)
    db.add(new_project)

    pepper = os.getenv("API_KEY_HMAC_PEPPER", "")
    if not pepper: raise HTTPException(status_code=500, detail="API_KEY_HMAC_PEPPER 미설정")
        
    secret_hash = hmac.new(pepper.encode("utf-8"), generated_secret_key.encode("utf-8"), hashlib.sha256).hexdigest()

    try:
        current_user = db.query(models.User).filter(models.User.id == user_id).first()
        current_plan = "pro" if current_user and current_user.plan == "Pro" else "free"
        
        tenant_id_record = captcha_db.execute(
            text("SELECT id FROM tenants WHERE owner_user_id = :uid"),
            {"uid": user_id}
        ).scalar()

        if not tenant_id_record:
            tenant_id = str(uuid.uuid4())
            captcha_db.execute(text("""INSERT INTO tenants (id, name, billing_plan, is_active, owner_user_id, created_at, updated_at) VALUES (:id, :n, :plan, true, :uid, NOW(), NOW())"""), {"id": tenant_id, "n": f"User_{user_id}_Tenant", "plan": current_plan, "uid": user_id})
            captcha_db.execute(text("""INSERT INTO tenant_settings (tenant_id, default_difficulty, enabled_kinds, max_attempts, rate_limit_per_min, updated_at) VALUES (:tid, 'medium', CAST(:ek AS jsonb), 3, 60, NOW())"""), {"tid": tenant_id, "ek": '["flashlight"]'})
        else:
            tenant_id = str(tenant_id_record)
            captcha_db.execute(text("UPDATE tenants SET billing_plan = :plan WHERE id = :tid"), {"plan": current_plan, "tid": tenant_id})

        api_key_id = str(uuid.uuid4())
        captcha_db.execute(text("""INSERT INTO api_keys (id, tenant_id, name, client_key, secret_hash, owner_user_id, created_at) VALUES (:id, :t, :n, :ck, :sh, :uid, NOW())"""), {"id": api_key_id, "t": tenant_id, "n": data.name, "ck": generated_site_key, "sh": secret_hash, "uid": user_id})

        for domain in domain_list:
            origin_id = str(uuid.uuid4())
            captcha_db.execute(text("""INSERT INTO allowed_origins (id, tenant_id, api_key_id, origin, created_at) VALUES (:id, :t, :ak, :o, NOW())"""), {"id": origin_id, "t": tenant_id, "ak": api_key_id, "o": domain})

        db.commit()
        captcha_db.commit()
        db.refresh(new_project)
    except Exception as e:
        db.rollback()
        captcha_db.rollback()
        logger.error(f"[Project Create Error] {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"DB 작업 실패: {str(e)}")

    return {"status": "success"}

@app.get("/api/projects")
async def get_projects(request: Request, db: Session = Depends(get_db), captcha_db: Session = Depends(get_captcha_db)):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")

    projects = db.query(models.Project).filter(models.Project.user_id == user_id).all()
    project_list = []
    for p in projects:
        api_key_record = captcha_db.execute(text("SELECT id FROM api_keys WHERE client_key = :ck AND revoked_at IS NULL"), {"ck": p.site_key}).scalar()
        total_usage = 0
        if api_key_record:
            total_usage = captcha_db.execute(text("SELECT COUNT(*) FROM challenges WHERE api_key_id = :ak"), {"ak": api_key_record}).scalar() or 0

        project_list.append({"id": p.id, "name": p.name, "domains": p.domains, "site_key": p.site_key, "secret_key": p.secret_key, "total_usage": total_usage})
    return {"status": "success", "projects": project_list}

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: int, request: Request, db: Session = Depends(get_db), captcha_db: Session = Depends(get_captcha_db)):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")

    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == user_id).first()
    if not project: raise HTTPException(status_code=404, detail="Project not found")

    try:
        db.delete(project)
        api_key_record = captcha_db.execute(text("UPDATE api_keys SET revoked_at = NOW() WHERE client_key = :client_key RETURNING id"), {"client_key": project.site_key}).scalar()
        if api_key_record:
            captcha_db.execute(text("DELETE FROM allowed_origins WHERE api_key_id = :ak"), {"ak": api_key_record})
        db.commit()
        captcha_db.commit()
    except Exception as e:
        db.rollback()
        captcha_db.rollback()
        raise HTTPException(status_code=500, detail=f"프로젝트 삭제 실패: {str(e)}")
    return {"status": "success"}

@app.get("/api/projects/{project_id}")
async def get_project(project_id: int, request: Request, kind: str = "default", db: Session = Depends(get_db)):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")

    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == user_id).first()
    if not project: raise HTTPException(status_code=404, detail="Project not found")

    embed_url = f"https://agami-captcha.cloud/widget/embed?kind={kind}&difficulty=normal&client_key={project.site_key}"
    embed_snippet = f'<iframe src="{embed_url}" width="100%" height="500px" frameborder="0"></iframe>'

    return {"status": "success", "project": {"id": project.id, "name": project.name, "domains": project.domains, "site_key": project.site_key, "secret_key": project.secret_key, "monthly_usage": project.monthly_usage, "embed_snippet": embed_snippet}}

@app.patch("/api/projects/{project_id}")
async def update_project(project_id: int, data: ProjectUpdate, request: Request, db: Session = Depends(get_db), captcha_db: Session = Depends(get_captcha_db)):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")

    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == user_id).first()
    if not project: raise HTTPException(status_code=404, detail="Project not found")

    domain_list = list(set([normalize_domain(d) for d in data.domains.split(",") if d.strip()]))
    if not domain_list:
        raise HTTPException(status_code=400, detail="유효한 도메인을 최소 1개 이상 입력해주세요.")

    api_key_id_record = captcha_db.execute(text("SELECT id FROM api_keys WHERE client_key = :ck"), {"ck": project.site_key}).scalar()
    
    if api_key_id_record:
        tenant_id_record = captcha_db.execute(text("SELECT id FROM tenants WHERE owner_user_id = :uid"), {"uid": user_id}).scalar()
        if tenant_id_record:
            tenant_id_str = str(tenant_id_record)
            for domain in domain_list:
                existing_origin = captcha_db.execute(
                    text("""
                        SELECT ao.id, ao.api_key_id, ak.revoked_at 
                        FROM allowed_origins ao
                        JOIN api_keys ak ON ao.api_key_id = ak.id
                        WHERE ao.origin = :o AND ao.tenant_id = :tid
                    """), 
                    {"o": domain, "tid": tenant_id_str}
                ).fetchone()
                
                if existing_origin:
                    ao_id, ak_id, revoked_at = existing_origin
                    if ak_id == api_key_id_record:
                        continue
                        
                    if revoked_at is None:
                        raise HTTPException(status_code=400, detail=f"회원님의 다른 활성 프로젝트에 이미 등록된 도메인입니다: {domain}")
                    else:
                        captcha_db.execute(text("DELETE FROM allowed_origins WHERE id = :id"), {"id": ao_id})
                        captcha_db.commit()

    project.name = data.name
    project.domains = data.domains

    try:
        if api_key_id_record:
            captcha_db.execute(text("UPDATE api_keys SET name = :name WHERE client_key = :client_key"), {"name": data.name, "client_key": project.site_key})
            tenant_id = captcha_db.execute(text("SELECT tenant_id FROM api_keys WHERE id = :id"), {"id": api_key_id_record}).scalar()
            
            captcha_db.execute(text("DELETE FROM allowed_origins WHERE api_key_id = :ak"), {"ak": api_key_id_record})
            
            for domain in domain_list:
                origin_id = str(uuid.uuid4())
                captcha_db.execute(text("""INSERT INTO allowed_origins (id, tenant_id, api_key_id, origin, created_at) VALUES (:id, :t, :ak, :o, NOW())"""), {"id": origin_id, "t": tenant_id, "ak": api_key_id_record, "o": domain})
        
        db.commit()
        captcha_db.commit()
    except Exception as e:
        db.rollback()
        captcha_db.rollback()
        raise HTTPException(status_code=500, detail=f"프로젝트 업데이트 실패: {str(e)}")
    return {"status": "success"}

@app.post("/api/payment/ready")
async def payment_ready(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = str(payload.get("sub"))
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")

    url = "https://open-api.kakaopay.com/online/v1/payment/ready"
    headers = {"Authorization": f"SECRET_KEY {os.getenv('KAKAO_PAY_SECRET_KEY')}", "Content-type": "application/json"}
    data = {"cid": "TC0ONETIME", "partner_order_id": f"ORDER_{user_id}", "partner_user_id": user_id, "item_name": "Agami Pro 요금제", "quantity": 1, "total_amount": 49000, "tax_free_amount": 0, "approval_url": "https://agami-captcha.cloud/payment/success", "cancel_url": "https://agami-captcha.cloud/price", "fail_url": "https://agami-captcha.cloud/price"}
    response = requests.post(url, headers=headers, json=data)
    if response.status_code != 200: raise HTTPException(status_code=400, detail=f"결제 준비 실패: {response.json()}")
    return {"status": "success", "next_redirect_pc_url": response.json().get("next_redirect_pc_url"), "tid": response.json().get("tid")}

@app.post("/api/payment/approve")
async def payment_approve(data: PaymentApprove, request: Request, db: Session = Depends(get_db), captcha_db: Session = Depends(get_captcha_db)):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")

    url = "https://open-api.kakaopay.com/online/v1/payment/approve"
    headers = {"Authorization": f"SECRET_KEY {os.getenv('KAKAO_PAY_SECRET_KEY')}", "Content-type": "application/json"}
    payload_data = {"cid": "TC0ONETIME", "tid": data.tid, "partner_order_id": f"ORDER_{user_id}", "partner_user_id": str(user_id), "pg_token": data.pg_token}
    response = requests.post(url, headers=headers, json=payload_data)
    if response.status_code != 200: raise HTTPException(status_code=400, detail=f"결제 승인 실패: {response.json()}")
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user: user.plan = "Pro"
        captcha_db.execute(text("UPDATE tenants SET billing_plan = 'pro', updated_at = NOW() WHERE owner_user_id = :uid"), {"uid": user_id})
        db.commit()
        captcha_db.commit()
    except Exception as e:
        db.rollback()
        captcha_db.rollback()
        raise HTTPException(status_code=500, detail=f"결제 동기화 실패: {str(e)}")
    return {"status": "success", "message": "결제가 완료되었습니다."}

# -----------------------------------------------------------------------------
# 대시보드 API - PostgreSQL 실 데이터 기반 집계 (프로젝트별 격리 적용 완료)
# -----------------------------------------------------------------------------
@app.get("/api/dashboard/all")
async def get_combined_dashboard_data(
    request: Request, 
    kind: str = "all", 
    target_date: str = None, 
    project_id: int = None,
    db: Session = Depends(get_db),
    captcha_db: Session = Depends(get_captcha_db)
):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")

    if not target_date:
        target_date = datetime.utcnow().strftime("%Y-%m-%d")

    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")

    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == user_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or unauthorized")

    api_key_id = captcha_db.execute(text("SELECT id FROM api_keys WHERE client_key = :ck"), {"ck": project.site_key}).scalar()
    
    def _empty_dashboard():
        return {
            "status": "success",
            "data": {
                "display": {"total_today": 0, "pass_rate": 0, "blocked_today": 0, "abandoned_today": 0},
                "traffic": [{"time": f"{i:02d}:00", "success": 0, "attack": 0, "abandoned": 0} for i in range(24)],
                "pieData": [{"name": "정상 통과", "value": 0}, {"name": "보안 차단", "value": 0}, {"name": "중도 이탈", "value": 0}],
                "behavior": {"safe": 0, "suspicious": 0, "critical": 0, "abandoned": 0},
                "attacks": [],
                "logs": []
            }
        }
        
    if not api_key_id:
        return _empty_dashboard()

    kind_filter_c = "" if kind == "all" else " AND c.kind = :kind"
    kind_filter_v = "" if kind == "all" else " AND v.kind = :kind"
    
    start_dt = datetime.strptime(target_date, "%Y-%m-%d")
    end_dt = start_dt + timedelta(days=1)

    date_filter_c = " AND c.issued_at >= :start_dt AND c.issued_at < :end_dt"
    date_filter_v = " AND v.created_at >= :start_dt AND v.created_at < :end_dt"

    params = {
        "api_key_id": api_key_id, 
        "kind": kind, 
        "start_dt": start_dt, 
        "end_dt": end_dt
    }

    # [1] 지표 조회
    total_sessions = captcha_db.execute(text(f"SELECT COUNT(*) FROM challenges c WHERE c.api_key_id = :api_key_id {kind_filter_c} {date_filter_c}"), params).scalar() or 0
    
    stats_query = f"""
        SELECT v.success, COUNT(*) as cnt 
        FROM verifications v 
        JOIN challenges c ON v.challenge_id = c.id 
        WHERE c.api_key_id = :api_key_id {kind_filter_v} {date_filter_v} 
        GROUP BY v.success
    """
    stats = captcha_db.execute(text(stats_query), params).fetchall()
    stats_dict = {row[0]: row[1] for row in stats}
    human_passed = stats_dict.get(True, 0)
    bot_blocked = stats_dict.get(False, 0)
    total_verified = human_passed + bot_blocked
    
    abandoned_today = max(0, total_sessions - total_verified)
    
    # [2] 차단 유형
    attacks_query = f"""
        SELECT v.attack_type, COUNT(*) as cnt 
        FROM verifications v 
        JOIN challenges c ON v.challenge_id = c.id 
        WHERE c.api_key_id = :api_key_id AND v.success = false {kind_filter_v} {date_filter_v} 
        GROUP BY v.attack_type 
        ORDER BY cnt DESC LIMIT 5
    """
    attacks = captcha_db.execute(text(attacks_query), params).fetchall()
    
    attacks_list = []
    for row in attacks:
        attacks_list.append({
            "name": row[0] or "bot_detected",
            "value": row[1]
        })

    # [3] 세션 로그
    logs_query = f"""
        SELECT
            TO_CHAR(v.created_at,'HH24:MI:SS'),
            v.attack_type,
            v.verdict,
            v.confidence,
            c.kind
        FROM verifications v
        JOIN challenges c ON v.challenge_id = c.id
        WHERE c.api_key_id = :api_key_id {kind_filter_v} {date_filter_v}
        ORDER BY v.created_at DESC LIMIT 10
    """
    logs = captcha_db.execute(text(logs_query), params).fetchall()
    
    logs_list = []
    for row in logs:
        log_time = row[0] or "00:00:00"
        a_type = row[1]
        verdict = row[2]
        conf = row[3] or 0.0
        c_kind = row[4] 

        if a_type:
            reason = a_type
        elif verdict == "bot":
            reason = "bot_detected"
        else:
            reason = "normal"
        risk_band = "high_risk" if verdict == "bot" else "low_risk"

        logs_list.append({
            "time": log_time,
            "reason": reason,
            "score": round(conf, 2),
            "risk_band": risk_band,
            "kind": c_kind 
        })

    # [4] 트래픽 데이터
    ch_traffic_query = f"""
        SELECT TO_CHAR(c.issued_at, 'HH24:00') as time, COUNT(*) as cnt 
        FROM challenges c 
        WHERE c.api_key_id = :api_key_id {kind_filter_c} {date_filter_c} 
        GROUP BY time
    """
    challenge_traffic_res = captcha_db.execute(text(ch_traffic_query), params).fetchall()
    ch_traffic_dict = {row[0]: row[1] for row in challenge_traffic_res}

    v_traffic_query = f"""
        SELECT TO_CHAR(v.created_at, 'HH24:00') as time, v.success, COUNT(*) as cnt 
        FROM verifications v 
        JOIN challenges c ON v.challenge_id = c.id 
        WHERE c.api_key_id = :api_key_id {kind_filter_v} {date_filter_v} 
        GROUP BY time, v.success
    """
    traffic_res = captcha_db.execute(text(v_traffic_query), params).fetchall()
    
    traffic_dict = {f"{i:02d}:00": {"success": 0, "attack": 0} for i in range(24)}
    for row in traffic_res:
        t = row[0]
        is_success = row[1]
        cnt = row[2]
        if t in traffic_dict:
            if is_success:
                traffic_dict[t]["success"] += cnt
            else:
                traffic_dict[t]["attack"] += cnt
                
    traffic_data = []
    for i in range(24):
        t = f"{i:02d}:00"
        ch_cnt = ch_traffic_dict.get(t, 0)
        suc_cnt = traffic_dict[t]["success"]
        atk_cnt = traffic_dict[t]["attack"]
        
        abandoned_cnt = max(0, ch_cnt - (suc_cnt + atk_cnt))
        
        traffic_data.append({
            "time": t, 
            "success": suc_cnt, 
            "attack": atk_cnt,
            "abandoned": abandoned_cnt
        })

    # [5] 파이 차트 보정
    if total_sessions > 0:
        pass_rate = (human_passed / total_sessions * 100)
        pie_human = round(pass_rate, 1)
        pie_bot = round((bot_blocked / total_sessions * 100), 1)
        pie_abandoned = round((abandoned_today / total_sessions * 100), 1)
        
        if (pie_human + pie_bot + pie_abandoned) != 100.0:
            pie_abandoned = round(100.0 - pie_human - pie_bot, 1)
    else:
        pass_rate = 0
        pie_human = 0
        pie_bot = 0
        pie_abandoned = 0

    return {
        "status": "success",
        "data": {
            "display": {
                "total_today": total_sessions,
                "pass_rate": round(pass_rate, 1),
                "blocked_today": bot_blocked,
                "abandoned_today": abandoned_today
            },
            "traffic": traffic_data,
            "pieData": [
                {"name": "정상 통과", "value": pie_human},
                {"name": "보안 차단", "value": pie_bot},
                {"name": "중도 이탈", "value": pie_abandoned}
            ],
            "behavior": {
                "safe": pie_human, 
                "suspicious": 0, 
                "critical": pie_bot,
                "abandoned": pie_abandoned
            },
            "attacks": attacks_list,
            "logs": logs_list
        }
    }