# 경량화된 Python 3.10 슬림 이미지 사용
FROM python:3.10-slim

# 작업 디렉토리 설정
WORKDIR /app

# 타임존 설정 및 필수 시스템 패키지 설치 (PostgreSQL 연결용 등)
RUN apt-get update && apt-get install -y tzdata libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*
ENV TZ=Asia/Seoul

# 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 소스 복사 (main.py, models.py, database.py 등)
COPY . .

# Python 버퍼링 비활성화 (로그 즉시 출력)
ENV PYTHONUNBUFFERED=1

# FastAPI 컨테이너 포트
EXPOSE 8000

# gunicorn + uvicorn worker로 실행
# -w 3 : CPU limit(2코어) 기준 워커 3개 (2 x core + 1 권장 공식)
# --timeout 60 : 느린 외부 API(카카오 등) 호출 대비 타임아웃 여유
# --graceful-timeout 30 : 롤링 업데이트 시 무중단 전환
CMD ["gunicorn", "main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "-w", "3", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "60", \
     "--graceful-timeout", "30", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]