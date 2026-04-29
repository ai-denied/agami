from flask import Flask, request, jsonify, send_from_directory
import os
import json
from datetime import datetime
import random
import psycopg2  # PostgreSQL 연동을 위해 추가
from psycopg2.extras import RealDictCursor

app = Flask(__name__)

# --- DB 연결 설정 ---
DB_HOST = os.getenv('DB_HOST', '10.0.2.131')
DB_NAME = "mousedb"
DB_USER = "admin"
DB_PASS = "1234"

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )

# --- 테이블 생성 (앱 시작 시 한 번만 실행) ---
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    # 로그를 저장할 테이블 생성
    cur.execute('''
        CREATE TABLE IF NOT EXISTS mouse_logs (
            id SERIAL PRIMARY KEY,
            session_id TEXT,
            log_data JSONB,
            saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    conn.commit()
    cur.close()
    conn.close()

init_db()

@app.route("/")
def index():
    return send_from_directory(".", "mouse_log_test.html")

# 주의: 캡차 이미지와 라벨은 현재 DB VM에 있으므로, 
# 실제 서비스 시에는 S3 같은 스토리지나 DB VM에서 이미지를 받아오는 API가 추가로 필요합니다.
# 일단은 기존 로직을 유지하되, 경로는 환경에 맞게 조정이 필요할 수 있습니다.
@app.route("/get-captcha")
def get_captcha():
    # 파일 시스템 기반 로직 (DB VM에 데이터가 있다면 백엔드가 접근 가능해야 함)
    LABEL_DIR = "dataset/labels" 
    if not os.path.exists(LABEL_DIR):
        return jsonify({"error": "Dataset not found"}), 404
        
    label_files = [f for f in os.listdir(LABEL_DIR) if f.endswith(".json")]
    selected_label = random.choice(label_files)
    label_path = os.path.join(LABEL_DIR, selected_label)

    with open(label_path, "r", encoding="utf-8") as f:
        label = json.load(f)

    image_name = label["image"]
    image_id = os.path.splitext(image_name)[0]

    return jsonify({
        "image_id": image_id,
        "image_url": f"/dataset/generated/{image_name}",
        "target_object": label["target_object"],
        "bbox": label["bbox"]
    })

@app.route("/save-log", methods=["POST"])
def save_log():
    data = request.get_json()
    session_id = data.get("session_id", "unknown")

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        # JSON 데이터를 DB의 JSONB 타입으로 직접 저장
        cur.execute(
            "INSERT INTO mouse_logs (session_id, log_data) VALUES (%s, %s)",
            (session_id, json.dumps(data))
        )
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"status": "saved", "message": "Log stored in PostgreSQL"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
