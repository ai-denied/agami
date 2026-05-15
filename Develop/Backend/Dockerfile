# 1. 베이스 이미지 설정
FROM python:3.10.12-slim

# 2. 작업 디렉토리 생성
WORKDIR /app

# 3. 필수 패키지 설치 (PostgreSQL 연결용 libpq 등)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 4. 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. 소스 코드 복사
COPY . .

# 6. 실행 명령 (FastAPI 기준)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]