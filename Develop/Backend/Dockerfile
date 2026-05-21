# 1. 베이스 이미지
FROM python:3.10.12-slim

# 2. 작업 디렉토리
WORKDIR /app

# 3. 리눅스 필수 패키지 설치
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 4. 환경변수 강제 설정 (시스템 인증서 사용)
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt

# 5. 의존성 패키지 설치
RUN pip install --no-cache-dir \
    uvicorn \
    fastapi \
    requests \
    certifi \
    sqlalchemy \
    python-dotenv \
    psycopg2-binary \
    "python-jose[cryptography]"

# 6. 소스 코드 복사
COPY . .

# 7. 실행 명령
CMD ["python3", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]