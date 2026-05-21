FROM python:3.10-alpine AS builder
WORKDIR /build
RUN apk add --no-cache gcc musl-dev postgresql-dev libffi-dev
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.10-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libpq tzdata
ENV TZ=Asia/Seoul

COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Context 내부(Modeling/)의 파일들을 컨테이너 내부 /app으로 복사
COPY . .

EXPOSE 8000

# 💡 uvicorn 명령어 인자 중 중복 지정되었던 포트 명세 오타를 바로잡았습니다.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]