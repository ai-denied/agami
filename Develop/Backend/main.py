import os
import requests
import secrets

from fastapi import FastAPI, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
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


# --- 기존 인증 API 아래쪽에 프로젝트 API 추가 ---
@app.post("/api/projects")
async def create_project(data: ProjectCreate, request: Request, db: Session = Depends(get_db)):
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

    new_project = models.Project(
        user_id=user_id,
        name=data.name,
        domains=data.domains,
        site_key=generated_site_key,
        secret_key=generated_secret_key
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

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
async def delete_project(project_id: int, request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("accessToken")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    # 본인의 프로젝트인지 확인 후 가져오기
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == user_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # DB에서 삭제
    db.delete(project)
    db.commit()
    
    return {"status": "success"}

# --- 프로젝트 API 영역에 추가 ---
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

    return {
        "status": "success",
        "project": {
            "id": project.id, "name": project.name, "domains": project.domains,
            "site_key": project.site_key, "secret_key": project.secret_key, "monthly_usage": project.monthly_usage
        }
    }

@app.patch("/api/projects/{project_id}")
async def update_project(project_id: int, data: ProjectUpdate, request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")

    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == user_id).first()
    if not project: raise HTTPException(status_code=404, detail="Project not found")

    project.name = data.name
    project.domains = data.domains # 도메인 업데이트 추가
    db.commit()
    
    return {"status": "success"}

@app.post("/api/payment/ready")
async def payment_ready(request: Request, db: Session = Depends(get_db)):
    # 1. 유저 인증
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = str(payload.get("sub"))
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")

    # 2. 카카오페이 준비 API 호출 (신규 API 주소)
    url = "https://open-api.kakaopay.com/online/v1/payment/ready"
    headers = {
        "Authorization": f"SECRET_KEY {os.getenv('KAKAO_PAY_SECRET_KEY')}",
        "Content-type": "application/json"
    }
    
    data = {
        "cid": "TC0ONETIME", # 테스트용 가맹점 코드
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
    # 1. 유저 인증
    token = request.cookies.get("accessToken")
    if not token: raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = str(payload.get("sub"))
    except Exception: raise HTTPException(status_code=401, detail="Invalid token")

    # 2. 카카오페이 승인 API 호출
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

    # 3. 결제 성공 시 유저 플랜 업데이트
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user:
        user.plan = "Pro"
        db.commit()

    return {"status": "success", "message": "결제가 완료되었습니다."}