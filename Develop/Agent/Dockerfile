# 경량화된 Python 3.10 슬림 이미지 사용
FROM python:3.10-slim

# 작업 디렉토리 설정
WORKDIR /app

# 타임존 설정 및 필수 시스템 패키지 설치 (PostgreSQL 연결용 등)
RUN apt-get update && apt-get install -y tzdata && \
    rm -rf /var/lib/apt/lists/*
ENV TZ=Asia/Seoul

# 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 파이썬 실행 스크립트 복사
COPY agent.py .

# 컨테이너 실행 시 데몬 프로세스 가동
CMD ["python", "-u", "agent.py"]