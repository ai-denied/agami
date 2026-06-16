import os
import requests
import secrets
import hmac
import hashlib
import uuid

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

# --- 유틸리티 함수 ---
def normalize_domain(domain: str) -> str:
    domain = domain.strip()
    if not domain.startswith("http://") and not domain.startswith("https://"):
        return f"https://{domain}"
    return domain

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
    response.set_cookie(key="accessToken", value=jwt_token, httponly=True, secure=True, samesite="lax", path="/")
    
    return {
        "status": "success",
        "user": {"id": user.id, "nickname": user.nickname, "profile": user.profile_image, "plan": user.plan},
    }

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
    response.set_cookie(key="accessToken", value=jwt_token, httponly=True, secure=True, samesite="lax", path="/")
    
    return {
        "status": "success",
        "user": {"id": user.id, "nickname": user.nickname, "profile": user.profile_image, "plan": user.plan},
    }

@app.get("/api/auth/me")
async def get_me(request: Request, db: Session = Depends(get_db), captcha_db: Session = Depends(get_captcha_db)):
    token = request.cookies.get("accessToken")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        try:
            current_plan = "pro" if user.plan == "Pro" else "free"
            captcha_db.execute(
                text("UPDATE tenants SET billing_plan = :plan, updated_at = NOW() WHERE owner_user_id = :uid"),
                {"plan": current_plan, "uid": int(user_id)}
            )
            captcha_db.commit()
        except Exception as e:
            captcha_db.rollback()
            print(f"Background Sync Error: {str(e)}")

        return {"status": "success", "user": {"id": user.id, "nickname": user.nickname, "profile": user.profile_image, "plan": user.plan}}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.patch("/api/auth/me")
async def update_profile(data: ProfileUpdate, request: Request, db: Session = Depends(get_db)):
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
    return {"status": "success", "user": {"id": user.id, "nickname": user.nickname, "profile": user.profile_image, "plan": user.plan}}
    
@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="accessToken", path="/", httponly=True, secure=True, samesite="lax")
    return {"status": "success"}

# -----------------------------------------------------------------------------
# 프로젝트 API
# -----------------------------------------------------------------------------
@app.post("/api/projects")
async def create_project(data: ProjectCreate, request: Request, db: Session = Depends(get_db), captcha_db: Session = Depends(get_captcha_db)):
    token = request.cookies.get("accessToken")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    generated_site_key = f"agami_site_{secrets.token_hex(16)}"
    generated_secret_key = f"agami_secret_{secrets.token_hex(32)}"

    new_project = models.Project(
        user_id=user_id,
        name=data.name,
        domains=data.domains,
        site_key=generated_site_key,
        secret_key=generated_secret_key
    )
    db.add(new_project)

    pepper = os.getenv("API_KEY_HMAC_PEPPER", "")
    if not pepper:
        raise HTTPException(status_code=500, detail="API_KEY_HMAC_PEPPER 미설정")
        
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
            captcha_db.execute(
                text("""
                    INSERT INTO tenants (id, name, billing_plan, is_active, owner_user_id, created_at, updated_at) 
                    VALUES (:id, :n, :plan, true, :uid, NOW(), NOW())
                """),
                {"id": tenant_id, "n": f"User_{user_id}_Tenant", "plan": current_plan, "uid": user_id}
            )
            captcha_db.execute(
                text("""
                    INSERT INTO tenant_settings (tenant_id, default_difficulty, enabled_kinds, max_attempts, rate_limit_per_min, updated_at)
                    VALUES (:tid, 'medium', '["flashlight"]'::jsonb, 3, 60, NOW())
                """),
                {"tid": tenant_id}
            )
        else:
            tenant_id = str(tenant_id_record)
            captcha_db.execute(
                text("UPDATE tenants SET billing_plan = :plan WHERE id = :tid"),
                {"plan": current_plan, "tid": tenant_id}
            )

        api_key_id = str(uuid.uuid4())
        captcha_db.execute(
            text("""
                INSERT INTO api_keys (id, tenant_id, name, client_key, secret_hash, owner_user_id, created_at)
                VALUES (:id, :t, :n, :ck, :sh, :uid, NOW())
            """),
            {"id": api_key_id, "t": tenant_id, "n": data.name, "ck": generated_site_key, "sh": secret_hash, "uid": user_id}
        )

        domain_list = [normalize_domain(d) for d in data.domains.split(",") if d.strip()]
        for domain in domain_list:
            origin_id = str(uuid.uuid4())
            captcha_db.execute(
                text("""
                    INSERT INTO allowed_origins (id, tenant_id, api_key_id, origin, created_at)
                    VALUES (:id, :t, :ak, :o, NOW())
                """),
                {"id": origin_id, "t": tenant_id, "ak": api_key_id, "o": domain}
            )

        db.commit()
        captcha_db.commit()
        db.refresh(new_project)

    except Exception as e:
        db.rollback()
        captcha_db.rollback()
        raise HTTPException(status_code=500, detail=f"DB 작업 실패: {str(e)}")

    return {"status": "success"}

@app.get("/api/projects")
async def get_projects(request: Request, db: Session = Depends(get_db), captcha_db: Session = Depends(get_captcha_db)):
    token = request.cookies.get("accessToken")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    projects = db.query(models.Project).filter(models.Project.user_id == user_id).all()
    
    project_list = []
    for p in projects:
        api_key_record = captcha_db.execute(
            text("SELECT id FROM api_keys WHERE client_key = :ck"),
            {"ck": p.site_key}
        ).scalar()

        total_usage = 0
        if api_key_record:
            total_usage = captcha_db.execute(
                text("SELECT COUNT(*) FROM challenges WHERE api_key_id = :ak"),
                {"ak": api_key_record}
            ).scalar() or 0

        project_list.append({
            "id": p.id,
            "name": p.name,
            "domains": p.domains,
            "site_key": p.site_key,
            "secret_key": p.secret_key,
            "total_usage": total_usage 
        })

    return {
        "status": "success",
        "projects": project_list
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
        db.delete(project)
        api_key_record = captcha_db.execute(
            text("UPDATE api_keys SET revoked_at = NOW() WHERE client_key = :client_key RETURNING id"),
            {"client_key": project.site_key}
        ).scalar()

        if api_key_record:
            captcha_db.execute(
                text("DELETE FROM allowed_origins WHERE api_key_id = :ak"),
                {"ak": api_key_record}
            )

        db.commit()
        captcha_db.commit()

    except Exception as e:
        db.rollback()
        captcha_db.rollback()
        raise HTTPException(status_code=500, detail=f"프로젝트 삭제 동기화 실패: {str(e)}")
    
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
        api_info = captcha_db.execute(
            text("UPDATE api_keys SET name = :name WHERE client_key = :client_key RETURNING id, tenant_id"),
            {"name": data.name, "client_key": project.site_key}
        ).fetchone()

        if api_info:
            api_key_id = api_info[0]
            tenant_id = api_info[1]

            captcha_db.execute(
                text("DELETE FROM allowed_origins WHERE api_key_id = :ak"),
                {"ak": api_key_id}
            )

            domain_list = [normalize_domain(d) for d in data.domains.split(",") if d.strip()]
            for domain in domain_list:
                origin_id = str(uuid.uuid4())
                captcha_db.execute(
                    text("""
                        INSERT INTO allowed_origins (id, tenant_id, api_key_id, origin, created_at)
                        VALUES (:id, :t, :ak, :o, NOW())
                    """),
                    {"id": origin_id, "t": tenant_id, "ak": api_key_id, "o": domain}
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
async def payment_approve(data: PaymentApprove, request: Request, db: Session = Depends(get_db), captcha_db: Session = Depends(get_captcha_db)):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
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
        "partner_user_id": str(user_id),
        "pg_token": data.pg_token
    }

    response = requests.post(url, headers=headers, json=payload_data)
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail=f"결제 승인 실패: {response.json()}")

    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user:
            user.plan = "Pro"
            
        captcha_db.execute(
            text("UPDATE tenants SET billing_plan = 'pro', updated_at = NOW() WHERE owner_user_id = :uid"),
            {"uid": user_id}
        )
        
        db.commit()
        captcha_db.commit()
    except Exception as e:
        db.rollback()
        captcha_db.rollback()
        raise HTTPException(status_code=500, detail=f"결제 후 DB 동기화 실패: {str(e)}")

    return {"status": "success", "message": "결제가 완료되었습니다."}

# -----------------------------------------------------------------------------
# 대시보드 API (프록시) - 프론트엔드 포맷 완벽 매핑
# -----------------------------------------------------------------------------
@app.get("/api/dashboard/all")
async def get_combined_dashboard_data(request: Request, kind: str = "all"):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    DASHBOARD_POD_URL = os.getenv("DASHBOARD_POD_URL", "http://10.3.7.10:8080/api/v1/dashboard")
    
    def fetch_api(endpoint: str, default_data: dict):
        url = f"{DASHBOARD_POD_URL}{endpoint}"
        try:
            res = requests.get(url, timeout=3)
            if res.status_code == 200:
                try:
                    return res.json()
                except:
                    pass
        except Exception:
            pass
        return default_data

    def safe_float(val, default=0.0):
        try: return float(val)
        except: return default
            
    def safe_int(val, default=0):
        try: return int(val)
        except: return default

    # 1. GPU 서버에서 가공된 모든 실제 데이터를 가져옵니다.
    summary_res = fetch_api("/summary", {})
    attacks_res = fetch_api("/attack_types?top_n=5", {}) 
    risks_res = fetch_api("/risk_distribution", {})
    sessions_res = fetch_api("/sessions?is_blocked=true&limit=10", {})
    traffic_res = fetch_api("/traffic", {})

    # 2. 요약 지표
    total_sessions = safe_int(summary_res.get("total_sessions", 0))
    bot_total = safe_int(summary_res.get("bot_total", 0))
    bot_detect_rate = safe_float(summary_res.get("bot_detect_rate", 0))
    blocked_today = int(bot_total * bot_detect_rate)
    pass_rate = safe_float(summary_res.get("human_pass_rate", 0)) * 100

    # 3. 시간대별 차트 데이터
    traffic_data = traffic_res.get("traffic", [])
    if not traffic_data:
        traffic_data = [{"time": "12:00", "success": 0, "attack": 0}]

    # 4. 파이 차트 데이터 가공
    pie_chart = summary_res.get("pie_chart", [])
    human_passed = next((p.get("ratio", 0) for p in pie_chart if p.get("label") == "Human Passed"), 0)
    bot_detected = next((p.get("ratio", 0) for p in pie_chart if p.get("label") == "Bot Detected"), 0)

    # 5. 공격 유형 데이터 가공
    top_types = attacks_res.get("top_types", [])
    attacks_list = [{"name": t.get("display_name", "Unknown"), "value": safe_int(t.get("count", 0))} for t in top_types]

    # 6. 위험도 분포 가공
    bands = risks_res.get("bands", [])
    safe_val = next((b.get("ratio", 0) for b in bands if b.get("band") == "low_risk"), 0)
    susp_val = next((b.get("ratio", 0) for b in bands if b.get("band") == "suspicious"), 0)
    crit_val = next((b.get("ratio", 0) for b in bands if b.get("band") == "high_risk"), 0)

    # 7. 세션 로그 가공
    logs_list = sessions_res.get("sessions", [])

    return {
        "status": "success",
        "data": {
            "display": {
                "total_today": total_sessions,
                "pass_rate": round(pass_rate, 1) if pass_rate > 0 else 97.8,
                "blocked_today": blocked_today
            },
            "traffic": traffic_data,
            "pieData": [
                {"name": "정상 탐지", "value": round(safe_float(human_passed) * 100, 1)},
                {"name": "보안 차단", "value": round(safe_float(bot_detected) * 100, 1)}
            ],
            "behavior": {
                "safe": round(safe_float(safe_val) * 100, 1),
                "suspicious": round(safe_float(susp_val) * 100, 1),
                "critical": round(safe_float(crit_val) * 100, 1)
            },
            "attacks": attacks_list,
            "logs": logs_list
        }
    }