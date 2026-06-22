import os
import time
import json
import smtplib
import glob
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import psycopg2
import httpx

# ==========================================
# 1. 환경 변수 로드 (k8s Deployment에서 주입됨)
# ==========================================
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "admin")
DB_NAME = os.getenv("DB_NAME", "captcha_db")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
TEAM_RECEIVER_EMAIL = "agami.captcha@gmail.com" # 알림을 받을 팀 공용 메일

# 로컬 GPU 노드의 LLM 엔드포인트
OLLAMA_API_URL = "http://localhost:11434/api/generate"
LLM_MODEL_NAME = "gemma2" # 모델을 gemma2로 교체 완료

# 데모용 임계치 설정
CHECK_INTERVAL_SEC = 60  
FAILURE_THRESHOLD = 5    

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

def check_security_threats():
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] 보안 위협 모니터링 수행 중...")
    
    query = """
        SELECT requester_ip, COUNT(*) as fail_count, MAX(challenge_id) as last_challenge
        FROM verifications
        WHERE success = false AND created_at >= NOW() - INTERVAL '1 minute'
        GROUP BY requester_ip
        HAVING COUNT(*) >= %s;
    """
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(query, (FAILURE_THRESHOLD,))
        threats = cur.fetchall()
        
        for ip, fail_count, challenge_id in threats:
            print(f"🚨 위협 감지: IP {ip} 에서 {fail_count}회 실패 (마지막 챌린지: {challenge_id})")
            process_threat(ip, fail_count, challenge_id)
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ DB 조회 중 오류 발생: {e}")

def process_threat(ip, fail_count, challenge_id):
    # ==========================================
    # 2. 로컬 볼륨에서 실제 행동 로그 JSON 찾기
    # ==========================================
    prefix = challenge_id[:8] if challenge_id else ""
    search_pattern = f"/data/behavior_logs/**/sess_*_{prefix}_*.json"
    matched_files = glob.glob(search_pattern, recursive=True)
    
    behavior_data = "해당 챌린지의 행동 로그 파일을 찾을 수 없습니다."
    
    if matched_files:
        target_file = matched_files[0]
        print(f"📄 매칭된 로그 파일 발견: {target_file}")
        try:
            with open(target_file, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                behavior_data = json.dumps(raw_data, ensure_ascii=False)[:1000]
        except Exception as e:
            behavior_data = f"JSON 파싱 에러: {e}"

    # ==========================================
    # 3. 로컬 LLM(GPU)에 분석 요청
    # ==========================================
    prompt = f"""당신은 agami 캡챠 서비스의 보안 시스템입니다. 주어진 [위협 정보]를 분석하여 반드시 아래 제공된 [보고서 양식]과 동일한 구조로 한국어 보고서를 출력하십시오. 
주의: 인사말, 서론, 결론, 참고 사항 등 양식에 없는 추가 문장은 절대 출력하지 마십시오.

[위협 정보]
- 탐지 IP: {ip}
- 1분간 실패 횟수: {fail_count}회
- 행동 패턴(JSON): {behavior_data}

[보고서 양식]
agami 보안 위협 분석 보고서

1. 위협 개요
- 대상 IP: {ip}
- 비정상 호출: 1분 내 {fail_count}회 캡챠 실패

2. 이상 징후 분석
(행동 패턴 JSON을 분석하여 마우스 궤적, 클릭 속도 등의 특징을 2~3문장의 건조한 문어체로 요약하여 작성)

3. 위협 수준 및 권고 조치
(위의 분석을 바탕으로 이 트래픽이 매크로 봇인지 판단하고, IP 차단 등 보안 담당자가 취해야 할 조치를 1~2문장으로 작성)
"""
    
    print(f"🤖 LLM({LLM_MODEL_NAME})에 분석 요청 중...")
    llm_analysis = "LLM 응답을 받지 못했습니다."
    try:
        # 환각 방지를 위해 온도(temperature) 0.1 옵션 추가 적용
        response = httpx.post(OLLAMA_API_URL, json={
            "model": LLM_MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.1
            }
        }, timeout=30.0)
        
        if response.status_code == 200:
            llm_analysis = response.json().get("response", "분석 결과 없음")
        else:
            print(f"⚠️ LLM API 에러: {response.status_code}")
            
    except Exception as e:
        print(f"❌ LLM 연결 실패: {e}")

    # ==========================================
    # 4. 분석 결과를 이메일로 전송
    # ==========================================
    send_alert_email(ip, fail_count, llm_analysis)

def send_alert_email(ip, fail_count, analysis_content):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("⚠️ 이메일 인증 정보가 설정되지 않아 메일을 발송할 수 없습니다.")
        return

    msg = MIMEMultipart()
    msg['Subject'] = f"[agami 보안경보] 비정상 캡챠 트래픽 감지 (IP: {ip})"
    msg['From'] = SMTP_EMAIL
    msg['To'] = TEAM_RECEIVER_EMAIL
    
    body = f"""
    <h2>agami Captcha 보안 위협 알림</h2>
    <p><b>탐지된 IP:</b> {ip}</p>
    <p><b>단기 실패 횟수:</b> {fail_count}회</p>
    <hr>
    <h3>🤖 AI 에이전트 행동 분석 결과</h3>
    <pre style="background-color:#f4f4f4; padding:10px; border-radius:5px; white-space: pre-wrap; font-family: sans-serif;">
    {analysis_content}
    </pre>
    """
    msg.attach(MIMEText(body, 'html'))
    
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"📧 팀 관리자에게 보안 경보 메일이 발송되었습니다! (IP: {ip})")
    except Exception as e:
        print(f"❌ 메일 발송 실패: {e}")

if __name__ == "__main__":
    print("========================================")
    print("🛡️ agami Security Agent 가동 시작")
    print(f"DB 타겟: {DB_HOST}:{DB_PORT} / {DB_NAME}")
    print("========================================")
    
    while True:
        check_security_threats()
        time.sleep(CHECK_INTERVAL_SEC)