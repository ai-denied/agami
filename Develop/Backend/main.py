import os
import requests
import certifi
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from jose import jwt

load_dotenv()

app = FastAPI()

# CORS 설정
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

# 인증서 경로 설정: certifi에서 제공하는 신뢰할 수 있는 CA 번들을 명시적으로 사용
CA_BUNDLE_PATH = certifi.where()

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
async def kakao_callback(code: str, db: Session = Depends(get_db)):
    token_url = "https://kauth.kakao.com/oauth/token"
    payload = {
        "grant_type": "authorization_code",
        "client_id": os.getenv("KAKAO_CLIENT_ID"),
        "redirect_uri": "https://agami-captcha.cloud/auth/kakao/callback", 
        "code": code
    }
    
    # 수정: verify 인자에 명시적으로 신뢰할 수 있는 CA 경로 전달
    try:
        token_res = requests.post(token_url, data=payload, verify=CA_BUNDLE_PATH)
    except requests.exceptions.SSLError as e:
        print(f"SSL 에러 상세: {e}")
        raise HTTPException(status_code=500, detail="카카오 인증서 검증 실패")
    
    if token_res.status_code != 200:
        print(f"카카오 에러 응답: {token_res.text}")
        raise HTTPException(status_code=400, detail="카카오 토큰 요청 실패")
    
    access_token = token_res.json().get("access_token")
    
    user_info_url = "https://kapi.kakao.com/v2/user/me"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 유저 정보 요청 시에도 동일한 인증서 번들 사용
    user_res = requests.get(user_info_url, headers=headers, verify=CA_BUNDLE_PATH).json()
    
    kakao_id = str(user_res.get("id"))
    properties = user_res.get("properties", {})
    nickname = properties.get("nickname")
    profile_image = properties.get("profile_image")

    user = db.query(models.User).filter(models.User.kakao_id == kakao_id).first()
    if not user:
        user = models.User(kakao_id=kakao_id, nickname=nickname, profile_image=profile_image)
        db.add(user)
    else:
        user.nickname = nickname
        user.profile_image = profile_image
    
    db.commit()
    db.refresh(user)

    access_token = create_access_token(
        {
            "sub": str(user.id),
            "kakao_id": user.kakao_id,
            "nickname": user.nickname,
        }
    )
    
    return {
        "status": "success",
        "accessToken": access_token,
        "user": {
            "id": user.id,
            "nickname": user.nickname,
            "profile": user.profile_image,
        },
    }