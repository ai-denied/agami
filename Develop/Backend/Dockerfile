FROM python:3.10.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libpq-dev gcc ca-certificates && rm -rf /var/lib/apt/lists/*
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
RUN pip install --no-cache-dir uvicorn fastapi requests certifi sqlalchemy python-dotenv psycopg2-binary "python-jose[cryptography]"
COPY . .
CMD ["python3", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]