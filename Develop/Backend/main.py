import os
import requests
from fastapi import FastAPI, Depends, HTTPException, Response, Request
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
        samesite="none",  # 대부분의 경우 lax가 가장 안정적입니다.
        path="/"         # 도메인을 명시하지 않고 경로만 명시
    )
    
    return {
        "status": "success",
        "user": {
            "id": user.id,
            "nickname": user.nickname,
            "profile": user.profile_image,
        },
    }

# main.py
@app.get("/api/auth/me")
async def get_me(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("accessToken")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        # DB에서 최신 정보를 다시 조회하여 프로필 데이터까지 포함
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
            
        return {
            "status": "success", 
            "user": {
                "id": user.id,
                "nickname": user.nickname,
                "profile": user.profile_image # 프로필 이미지 포함
            }
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    
@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="accessToken",
        path="/",
        httponly=True,
        secure=True,
        samesite="none"
    )
    return {"status": "success"}