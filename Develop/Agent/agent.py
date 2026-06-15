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
TEAM_RECEIVER_EMAIL = "agami.captcha@gmail.com" # 알림을 받을 팀 공용 메일 (보내는 사람과 같아도 무방함)

# 로컬 GPU 노드의 LLM 엔드포인트 (hostNetwork: true 이므로 localhost 사용 가능)
OLLAMA_API_URL = "http://localhost:11434/api/generate"
LLM_MODEL_NAME = "llama3" # GPU에 띄워둔 모델명으로 변경하세요 (예: eeve-korean, llama3 등)

# 데모용 임계치 설정 (빠른 시연을 위해 기준을 낮춤)
CHECK_INTERVAL_SEC = 60  # 1분마다 검사 (데모용)
FAILURE_THRESHOLD = 5    # 1분간 5회 이상 실패 시 위협 간주 (데모용)

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
    # DB의 challenge_id 앞 8자리 추출 (예: '7wCM5PBb')
    prefix = challenge_id[:8] if challenge_id else ""
    
    # 마운트된 디렉토리 내부를 재귀적으로 검색 (human, bot 폴더 모두 포함)
    search_pattern = f"/data/behavior_logs/**/sess_*_{prefix}_*.json"
    matched_files = glob.glob(search_pattern, recursive=True)
    
    behavior_data = "해당 챌린지의 행동 로그 파일을 찾을 수 없습니다."
    
    if matched_files:
        # 여러 파트로 나뉜 경우(_0, _1) 가장 첫 번째 파일 기준으로 파싱 (데모용)
        target_file = matched_files[0]
        print(f"📄 매칭된 로그 파일 발견: {target_file}")
        try:
            with open(target_file, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                # LLM 컨텍스트 한도를 고려하여 최대 1000자까지만 문자열로 변환
                behavior_data = json.dumps(raw_data, ensure_ascii=False)[:1000]
        except Exception as e:
            behavior_data = f"JSON 파싱 에러: {e}"

    # ==========================================
    # 3. 로컬 LLM(GPU)에 분석 요청
    # ==========================================
    prompt = f"""
    [시스템 지시사항]
    당신은 agami 캡챠 서비스의 최고 보안 분석 에이전트입니다.
    반드시 '100% 자연스러운 한국어'로만 답변해야 합니다. 스페인어, 중국어 등 다른 언어가 단 한 글자라도 섞이는 것을 엄격히 금지합니다. 전문적이고 건조한 보고서 어투를 사용하십시오.

    [분석 대상 데이터]
    - 공격 의심 IP: {ip}
    - 단기 실패 횟수: {fail_count}회
    - 행동 로그(JSON): {behavior_data}

    [수행 작업]
    제공된 행동 로그를 바탕으로 해당 IP의 트래픽이 매크로 봇에 의한 악의적 공격인지 분석하고, 보안 담당자를 위한 간결한 조치 권고안을 작성하십시오.
    """
    
    print(f"🤖 LLM({LLM_MODEL_NAME})에 분석 요청 중...")
    llm_analysis = "LLM 응답을 받지 못했습니다."
    try:
        response = httpx.post(OLLAMA_API_URL, json={
            "model": LLM_MODEL_NAME,
            "prompt": prompt,
            "stream": False
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
    <pre style="background-color:#f4f4f4; padding:10px; border-radius:5px;">
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
    
    # 컨테이너가 켜져있는 동안 무한 반복
    while True:
        check_security_threats()
        time.sleep(CHECK_INTERVAL_SEC)