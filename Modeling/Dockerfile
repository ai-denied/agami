# ==========================================
# 1단계: 빌드 스테이지 (의존성 컴파일)
# ==========================================
# 💡 ONNXRuntime 호환성을 위해 alpine에서 slim(Debian 계열)으로 변경합니다.
FROM python:3.10-slim AS builder

WORKDIR /build

# C 컴파일에 필요한 최소한의 시스템 패키지 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# 가상환경 대신 빌드 디렉토리에 패키지 직접 설치
RUN pip install --no-cache-dir --user -r requirements.txt


# ==========================================
# 2단계: 런타임 스테이지 (실제 경량 컨테이너 구동)
# ==========================================
FROM python:3.10-slim AS runner

WORKDIR /app

# runtime에 필요한 라이브러리 및 시간대 설정
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

ENV TZ=Asia/Seoul

# 1단계 빌더에서 설치된 파이썬 라이브러리 안전하게 이관
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# 프로젝트 소스 코드 및 정적 자원 복사
COPY . .

EXPOSE 8000

# Uvicorn을 이용해 FastAPI 구동
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]