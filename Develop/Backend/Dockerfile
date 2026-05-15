# 1. 베이스 이미지 설정
FROM python:3.10.12-slim

# 2. 작업 디렉토리 생성
WORKDIR /app

# 3. 필수 패키지 설치 (PostgreSQL 연결용 libpq 등)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 4. 의존성 패키지 직접 일괄 설치 (requirements.txt 대용)
RUN pip install --no-cache-dir \
    uvicorn \
    fastapi \
    requests \
    sqlalchemy \
    python-dotenv \
    psycopg2-binary \
    "python-jose[cryptography]"

# 5. 소스 코드 복사 (CI가 생성해준 .env 파일 포함 통째로 복사됨)
COPY . .

# 6. 실행 명령 (FastAPI 기준)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]