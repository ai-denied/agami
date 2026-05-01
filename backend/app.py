from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
from datetime import datetime
import random

app = Flask(__name__)
# 모든 도메인에서의 요청을 허용하도록 설정합니다.
CORS(app)

# 1. 경로 설정 최적화
# 현재 app.py 파일이 위치한 디렉토리를 기준으로 절대 경로를 계산합니다.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 데이터셋 경로 설정 (이전의 상대 경로 이슈를 방지합니다.)
LABEL_DIR = os.path.join(BASE_DIR, "dataset", "labels")
IMAGE_DIR = os.path.join(BASE_DIR, "dataset", "generated")
LOG_DIR = os.path.join(BASE_DIR, "mouse_logs", "human")

# 로그 디렉토리가 없을 경우 생성합니다.
os.makedirs(LOG_DIR, exist_ok=True)

@app.route("/")
def index():
    return "Backend is running. Use frontend for UI."

@app.route("/get-captcha")
def get_captcha():
    # 경로 존재 여부 확인
    if not os.path.exists(LABEL_DIR):
        return jsonify({
            "error": "Label directory not found",
            "debug_info": f"Expected path: {LABEL_DIR}"
        }), 404
        
    label_files = [f for f in os.listdir(LABEL_DIR) if f.endswith(".json")]
    if not label_files:
        return jsonify({"error": "No label files found"}), 404
        
    selected_label = random.choice(label_files)
    label_path = os.path.join(LABEL_DIR, selected_label)

    try:
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
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/dataset/generated/<path:filename>")
def serve_image(filename):
    # 정적 이미지 파일을 안전하게 서빙합니다.
    return send_from_directory(IMAGE_DIR, filename)

@app.route("/save-log", methods=["POST"])
def save_log():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    session_id = data.get("session_id", "unknown")
    filename = f"{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    filepath = os.path.join(LOG_DIR, filename)

    data["saved_at"] = datetime.now().isoformat()

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        return jsonify({
            "status": "saved",
            "file": filename
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # 외부 접속 허용을 위해 0.0.0.0으로 호스트를 설정합니다.
    app.run(host="0.0.0.0", port=5000, debug=False)
