import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom"; 
import "./Settings.css"; 
import "./ProjectTest.css"; 

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const ProjectTest = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [testToken, setTestToken] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // 프로젝트 정보 불러오기
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await api.get(`/api/projects/${id}`);
        if (response.data.status === "success") {
          setProject(response.data.project);
        }
      } catch (error) { console.error(error); }
    };
    fetchProjectDetails();
  }, [id]);

  // iframe으로부터 캡챠 완료 토큰 수신 (postMessage 통신)
  useEffect(() => {
    const handleIframeMessage = (event) => {
      // 위젯에서 보내는 데이터 파싱
      const data = event.data;
      if (!data) return;

      // 객체 형태로 { success: true, token: "..." } 가 넘어올 경우를 완벽 방어
      if (typeof data === 'object' && (data.success || data.token)) {
        // 객체 렌더링 에러(Error 31)를 막기 위해 명시적으로 string만 빼냅니다.
        setTestToken(String(data.token || ""));
      } 
      // 만약 문자열(JSON)로 넘어온다면
      else if (typeof data === 'string' && data.includes("token")) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.token) setTestToken(String(parsed.token));
        } catch (e) {}
      }
    };

    window.addEventListener("message", handleIframeMessage);
    return () => window.removeEventListener("message", handleIframeMessage);
  }, []);

  const handleCopySnippet = () => {
    const snippet = `curl -X POST https://agami-captcha.cloud/api/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "secret_key": "${project?.secret_key}",
    "token": "${testToken || "<발급된_토큰>"}"
  }'`;
    navigator.clipboard.writeText(snippet);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!project) return <div style={{padding: '40px'}}>로딩 중...</div>;

  return (
    <div className="settings-page-wrapper">
      <div className="settings-container test-container">
        <header className="settings-header">
          <div>
            <h1 className="settings-title">API 연동 테스트</h1>
            <p className="settings-description">발급받은 키를 사용하여 실제 캡챠 동작과 백엔드 검증 흐름을 테스트합니다.</p>
          </div>
        </header>

        {/* 상하 배치를 위해 레이아웃 변경 */}
        <div className="test-vertical-layout">
          
          {/* 상단: 진짜 iframe 위젯 영역 */}
          <div className="test-panel">
            <h3 className="panel-title">1. 실환경 위젯 테스트</h3>
            <p className="panel-desc">고객님의 <strong>Site Key</strong>가 적용된 실제 iframe 위젯입니다. 진짜 캡챠 검증을 시도해 보세요.</p>
            
            <div className="widget-render-box">
              {/* 프론트 모형 대신 실제 서버와 통신하는 iframe 삽입 */}
              <iframe 
                src={`https://agami-captcha.cloud/widget/embed?kind=flashlight&difficulty=easy&client_key=${project.site_key}`}
                width="100%" 
                height="400px" 
                frameBorder="0"
                title="Agami Captcha Widget"
                scrolling="no"
                style={{ borderRadius: '12px' }}
              ></iframe>
            </div>

            {testToken && (
              <div className="token-result-box">
                <span className="success-badge">✅ 인증 성공</span>
                <span className="token-label">발급된 토큰:</span>
                <div className="token-string">{testToken}</div>
              </div>
            )}
          </div>

          {/* 하단: 백엔드 연동 가이드 영역 */}
          <div className="test-panel">
            <h3 className="panel-title">2. 백엔드 검증 가이드</h3>
            <p className="panel-desc">위젯에서 발급된 토큰을 고객님의 서버로 전송한 뒤, <strong>Secret Key</strong>와 함께 Agami API로 검증을 요청해야 합니다.</p>
            
            <div className="code-snippet-box">
              <div className="code-header">
                <span>cURL 예시</span>
                <button className="btn-copy-code" onClick={handleCopySnippet}>
                  {isCopied ? "복사완료!" : "코드 복사"}
                </button>
              </div>
              <pre className="code-content">
<code>{`curl -X POST https://agami-captcha.cloud/api/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "secret_key": "${project.secret_key}",
    "token": "${testToken || "<상단에서_캡챠를_풀면_토큰이_채워집니다>"}"
  }'`}</code>
              </pre>
            </div>
            
            <div className="info-alert-box">
              <strong>💡 주의사항</strong>
              <p>Secret Key는 절대로 브라우저(프론트엔드)에 노출되어서는 안 됩니다. 반드시 백엔드 서버에서 호출해 주세요.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectTest;