import os
import requests
import shutil
import uuid

from fastapi import FastAPI, Depends, HTTPException, Response, Request, File, UploadFile, Form
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from jose import jwt

load_dotenv()

app = FastAPI()

# 중요: 쿠키 통신을 위해 allow_credentials=True 설정 필요
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

# -----------------------------------------------------------------------------
# 카카오 로그인 콜백 API
# -----------------------------------------------------------------------------
@app.get("/api/auth/kakao/callback")
async def kakao_callback(code: str, response: Response, db: Session = Depends(get_db)):
    # 1. 카카오 토큰 요청
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
    
    # 2. 유저 정보 조회
    user_res = requests.get("https://kapi.kakao.com/v2/user/me", headers={"Authorization": f"Bearer {access_token}"}).json()
    
    kakao_id = str(user_res.get("id"))
    properties = user_res.get("properties", {})
    
    # 3. DB 로직
    user = db.query(models.User).filter(models.User.kakao_id == kakao_id).first()
    if not user:
        user = models.User(kakao_id=kakao_id, nickname=properties.get("nickname"), profile_image=properties.get("profile_image"))
        db.add(user)
    else:
        user.nickname = properties.get("nickname")
        user.profile_image = properties.get("profile_image")
    db.commit()
    db.refresh(user)

    # 4. JWT 발행 및 HttpOnly 쿠키 설정
    jwt_token = create_access_token({"sub": str(user.id), "nickname": user.nickname})
    
    response.set_cookie(
        key="accessToken",
        value=jwt_token,
        httponly=True,
        secure=True,     
        samesite="lax",  
        path="/"         
    )
    
    return {
        "status": "success",
        "user": {
            "id": user.id,
            "nickname": user.nickname,
            "profile": user.profile_image,
        },
    }

# -----------------------------------------------------------------------------
# 구글 로그인 콜백 API (새로 추가됨)
# -----------------------------------------------------------------------------
@app.get("/api/auth/google/callback")
async def google_callback(code: str, response: Response, db: Session = Depends(get_db)):
    # 1. 구글 토큰 요청
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
    
    # 2. 유저 정보 조회
    user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    user_res = requests.get(user_info_url, headers={"Authorization": f"Bearer {access_token}"}).json()
    
    google_id = str(user_res.get("id"))
    name = user_res.get("name", "구글 유저")
    picture = user_res.get("picture")
    
    # 3. DB 로직
    user = db.query(models.User).filter(models.User.google_id == google_id).first()
    if not user:
        user = models.User(google_id=google_id, nickname=name, profile_image=picture)
        db.add(user)
    else:
        user.nickname = name
        user.profile_image = picture
    db.commit()
    db.refresh(user)

    # 4. JWT 발행 및 HttpOnly 쿠키 설정
    jwt_token = create_access_token({"sub": str(user.id), "nickname": user.nickname})
    
    response.set_cookie(
        key="accessToken",
        value=jwt_token,
        httponly=True,
        secure=True,     
        samesite="lax",
        path="/"
    )
    
    return {
        "status": "success",
        "user": {
            "id": user.id,
            "nickname": user.nickname,
            "profile": user.profile_image,
        },
    }

# -----------------------------------------------------------------------------
# 공통 인증 및 로그아웃 API
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
            
        return {
            "status": "success", 
            "user": {
                "id": user.id,
                "nickname": user.nickname,
                "profile": user.profile_image
            }
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    
PROFILE_UPLOAD_DIR = "static/profiles"
os.makedirs(PROFILE_UPLOAD_DIR, exist_ok=True)

@app.patch("/api/auth/me")
async def update_profile(
    request: Request,
    nickname: str = Form(None),
    profile_image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    # 1. JWT 토큰 검증 및 유저 식별
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

    # 2. 닉네임 업데이트
    if nickname:
        user.nickname = nickname

    # 3. 프로필 이미지 업데이트 (파일이 전송된 경우)
    if profile_image:
        # 안전한 파일명 생성
        file_extension = profile_image.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        file_path = os.path.join(PROFILE_UPLOAD_DIR, unique_filename)

        # 파일 저장
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(profile_image.file, buffer)
        
        # DB에 저장될 URL (호스트 주소에 맞게 조정 필요)
        # FastAPI에서 StaticFiles를 마운트하여 정적 파일을 서빙하도록 설정해야 합니다.
        user.profile_image = f"https://agami-captcha.cloud/{file_path}"

    # 4. DB 반영
    db.commit()
    db.refresh(user)

    return {
        "status": "success",
        "user": {
            "id": user.id,
            "nickname": user.nickname,
            "profile": user.profile_image
        }
    }
    
@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="accessToken",
        path="/",
        httponly=True,
        secure=True,
        samesite="lax"
    )
    return {"status": "success"}