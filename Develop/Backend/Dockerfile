# 1. 베이스 이미지 설정 (경량화 버전)
FROM python:3.10.12-slim

# 2. 작업 디렉토리 생성
WORKDIR /app

# 3. 필수 패키지 및 공인 CA 인증서 설치
# ca-certificates: 카카오, 구글 등 외부 공인 API 서버의 SSL 인증서를 컨테이너가 신뢰하게 만듭니다.
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 4. 의존성 패키지 일괄 설치
RUN pip install --no-cache-dir \
    uvicorn \
    fastapi \
    requests \
    sqlalchemy \
    python-dotenv \
    psycopg2-binary \
    "python-jose[cryptography]"

# 5. 소스 코드 복사 (CI가 생성한 .env 파일 포함)
COPY . .

# 6. 실행 명령 (FastAPI 기준)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]