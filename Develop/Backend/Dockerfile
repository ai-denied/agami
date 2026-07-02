FROM python:3.10.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libpq-dev gcc ca-certificates && rm -rf /var/lib/apt/lists/*
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

RUN pip install --no-cache-dir gunicorn uvicorn fastapi requests certifi sqlalchemy python-dotenv psycopg2-binary "python-jose[cryptography]" python-multipart redis

COPY . .
CMD ["gunicorn", "main:app", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "--bind", "0.0.0.0:8000"]