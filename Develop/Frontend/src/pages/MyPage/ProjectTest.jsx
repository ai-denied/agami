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
  const [refreshKey, setRefreshKey] = useState(0);

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

  // iframe으로부터 캡챠 완료 토큰 수신 및 정밀 파싱
  useEffect(() => {
    const handleIframeMessage = (event) => {
      const data = event.data;
      if (!data) return;
      
      // React 내부 통신용 메시지는 무시
      if (data.source && data.source.includes('react-devtools')) return;

      console.log("[Agami Widget] 수신된 원본 데이터:", data);

      let extractedToken = null;

      // 1. 객체 형태로 수신된 경우
      if (typeof data === 'object') {
        if (data.token) extractedToken = data.token;
        else if (data.data && data.data.token) extractedToken = data.data.token; // 뎁스가 깊은 경우 방어
      } 
      // 2. 문자열(JSON)로 수신된 경우
      else if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed.token) extractedToken = parsed.token;
          else if (parsed.data && parsed.data.token) extractedToken = parsed.data.token;
        } catch (e) {
          // 파싱에 실패했지만 문자열 자체가 토큰일 가능성 배제 안 함
          if (data.length > 15) extractedToken = data;
        }
      }

      // 추출된 토큰이 있다면 상태 업데이트
      if (extractedToken) {
        // 백엔드에서 토큰 자체를 객체로 던졌을 경우 [object Object]를 막고 내용물을 보여줌
        if (typeof extractedToken === 'object') {
          setTestToken(JSON.stringify(extractedToken, null, 2));
        } else {
          setTestToken(String(extractedToken));
        }
      }
    };

    window.addEventListener("message", handleIframeMessage);
    return () => window.removeEventListener("message", handleIframeMessage);
  }, []);

  const handleRefreshWidget = () => {
    setRefreshKey(prev => prev + 1);
    setTestToken(""); 
  };

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

        <div className="test-vertical-layout">
          
          <div className="test-panel">
            <div className="panel-header-row">
              <div>
                <h3 className="panel-title">1. 실환경 위젯 테스트</h3>
                <p className="panel-desc">고객님의 <strong>Site Key</strong>가 적용된 실제 iframe 위젯입니다.</p>
              </div>
              <button className="btn-refresh-widget" onClick={handleRefreshWidget}>
                ↻ 위젯 새로고침
              </button>
            </div>
            
            <div className="widget-render-box">
              <iframe 
                key={refreshKey}
                src={`https://agami-captcha.cloud/widget/embed?kind=flashlight&difficulty=easy&client_key=${project.site_key}`}
                width="100%" 
                height="700px" /* 위젯이 잘리지 않도록 세로 700px로 대폭 확장 */
                frameBorder="0"
                title="Agami Captcha Widget"
                scrolling="no"
              ></iframe>
            </div>

            {testToken && (
              <div className="token-result-box">
                <span className="success-badge">✅ 인증 완료 및 토큰 수신</span>
                <span className="token-label">발급된 토큰:</span>
                <div className="token-string">{testToken}</div>
              </div>
            )}
          </div>

          <div className="test-panel">
            <h3 className="panel-title">2. 백엔드 검증 테스트</h3>
            <p className="panel-desc">아래의 cURL 코드를 복사하여 <strong>터미널(cmd)</strong>에 붙여넣고 엔터를 치시면 실제 검증 결과를 확인할 수 있습니다.</p>
            
            <div className="code-snippet-box">
              <div className="code-header">
                <span>cURL 예시 (명령 프롬프트/터미널 실행용)</span>
                <button className="btn-copy-code" onClick={handleCopySnippet}>
                  {isCopied ? "복사완료!" : "코드 복사"}
                </button>
              </div>
              <pre className="code-content">
<code>{`curl -X POST https://agami-captcha.cloud/api/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "secret_key": "${project.secret_key}",
    "token": "${testToken ? (testToken.length > 50 ? testToken.substring(0, 50) + "..." : testToken) : "<상단_위젯에서_캡챠를_풀면_토큰이_채워집니다>"}"
  }'`}</code>
              </pre>
            </div>
            
            <div className="info-alert-box">
              <strong>💡 주의사항</strong>
              <p>Secret Key는 절대로 브라우저(프론트엔드)에 노출되어서는 안 됩니다. 이 코드는 반드시 고객님의 백엔드 서버에서 실행되어야 합니다.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectTest;