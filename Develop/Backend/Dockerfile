FROM python:3.10.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# [핵심 수정] certifi가 사용하는 인증서 파일 경로를 우리가 관리하는 시스템 인증서로 교체
RUN rm -f /usr/local/lib/python3.10/site-packages/certifi/cacert.pem && \
    ln -s /etc/ssl/certs/ca-certificates.crt /usr/local/lib/python3.10/site-packages/certifi/cacert.pem

RUN pip install --no-cache-dir \
    uvicorn \
    fastapi \
    requests \
    certifi \
    sqlalchemy \
    python-dotenv \
    psycopg2-binary \
    "python-jose[cryptography]"

COPY . .

CMD ["python3", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]