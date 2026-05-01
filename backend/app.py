from flask import Flask, request, jsonify, send_from_directory
import os
import json
from datetime import datetime
import random

app = Flask(__name__)

# 리눅스 컨테이너 환경을 위해 경로 구분자를 /로 통일합니다.
LOG_DIR = "mouse_logs/human"
os.makedirs(LOG_DIR, exist_ok=True)

LABEL_DIR = "dataset/labels"

@app.route("/")
def index():
    # 이전에 에러가 났던 부분: 공백을 정리했습니다.
    return send_from_directory(".", "mouse_log_test.html")

@app.route("/get-captcha")
def get_captcha():
    # 데이터셋 폴더가 컨테이너 내부에 존재하는지 확인이 필요합니다.
    if not os.path.exists(LABEL_DIR):
        return jsonify({"error": "Label directory not found"}), 404
        
    label_files = [f for f in os.listdir(LABEL_DIR) if f.endswith(".json")]
    if not label_files:
        return jsonify({"error": "No label files found"}), 404
        
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

@app.route("/dataset/generated/<path:filename>")
def serve_image(filename):
    return send_from_directory("dataset/generated", filename)

@app.route("/save-log", methods=["POST"])
def save_log():
    data = request.get_json()

    session_id = data.get("session_id", "unknown")
    filename = f"{session_id}.json"
    filepath = os.path.join(LOG_DIR, filename)

    data["saved_at"] = datetime.now().isoformat()

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return jsonify({
        "status": "saved",
        "file": filepath
    })

# 중복된 실행 코드와 오타(++ , ;)를 수정했습니다.
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
