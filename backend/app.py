from flask import Flask, request, jsonify, send_from_directory
import os
import json
from datetime import datetime
import random

app = Flask(__name__)

LOG_DIR = "mouse_logs\human"
os.makedirs(LOG_DIR, exist_ok=True)

LABEL_DIR = "dataset/labels"


@app.route("/")
def index():
    return send_from_directory(".", "mouse_log_test.html")

@app.route("/get-captcha")
def get_captcha():
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
