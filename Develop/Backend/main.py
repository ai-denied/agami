import os
import requests
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

# CORS 설정: 리액트(5173)에서 오는 요청을 허용합니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://agami-captcha.cloud"], 
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

@app.get("/auth/kakao/callback")
async def kakao_callback(code: str, db: Session = Depends(get_db)):
    # 1. 인가 코드로 카카오 토큰 요청
    token_url = "https://kauth.kakao.com/oauth/token"
    payload = {
        "grant_type": "authorization_code",
        "client_id": os.getenv("KAKAO_CLIENT_ID"),
        # 중요: .env에서 읽어오는 대신 리액트 콜백 주소를 직접 입력하세요.
        "redirect_uri": "http://agami-captcha.cloud/auth/kakao/callback", 
        "code": code
    }
    
    token_res = requests.post(token_url, data=payload)
    
    # 에러 발생 시 로그를 찍어서 상세 내용을 확인합니다.
    if token_res.status_code != 200:
        print(f"카카오 에러 응답: {token_res.text}") # 터미널에서 에러 상세 원인 확인용
        raise HTTPException(status_code=400, detail="카카오 토큰 요청 실패")
    
    access_token = token_res.json().get("access_token")
    
    # 2. 유저 정보 요청
    user_info_url = "https://kapi.kakao.com/v2/user/me"
    headers = {"Authorization": f"Bearer {access_token}"}
    user_res = requests.get(user_info_url, headers=headers).json()
    
    kakao_id = str(user_res.get("id"))
    properties = user_res.get("properties", {})
    nickname = properties.get("nickname")
    profile_image = properties.get("profile_image")

    # 3. DB 저장 및 업데이트
    user = db.query(models.User).filter(models.User.kakao_id == kakao_id).first()
    if not user:
        user = models.User(kakao_id=kakao_id, nickname=nickname, profile_image=profile_image)
        db.add(user)
    else:
        user.nickname = nickname
        user.profile_image = profile_image
    
    db.commit()
    db.refresh(user)

    # 4. 결과 JSON 반환 (리액트가 이 정보를 받아갈 것입니다)
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