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
  const [refreshKey, setRefreshKey] = useState(0); // 새로고침용 키

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
      // 🚨 디버깅: F12 콘솔창에서 위젯이 어떤 데이터를 뱉는지 확인 가능합니다.
      console.log("[Agami Widget] 수신된 데이터:", event.data);

      const data = event.data;
      if (!data) return;

      // 1. 객체 형태로 넘어올 경우
      if (typeof data === 'object') {
        if (data.token) {
          setTestToken(String(data.token));
        } else if (data.success && data.token === undefined) {
          // 성공은 했는데 토큰 필드가 없을 경우를 대비한 방어 코드
          setTestToken("토큰 필드 누락 (백엔드 위젯 코드 확인 필요)");
        }
      } 
      // 2. 문자열(JSON) 형태로 넘어올 경우
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

  // 위젯 새로고침 함수
  const handleRefreshWidget = () => {
    setRefreshKey(prev => prev + 1);
    setTestToken(""); // 새로고침 시 기존 토큰 초기화
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
          
          {/* 상단: 진짜 iframe 위젯 영역 */}
          <div className="test-panel">
            <div className="panel-header-row">
              <div>
                <h3 className="panel-title">1. 실환경 위젯 테스트</h3>
                <p className="panel-desc">고객님의 <strong>Site Key</strong>가 적용된 실제 iframe 위젯입니다.</p>
              </div>
              {/* 새로고침 버튼 추가 */}
              <button className="btn-refresh-widget" onClick={handleRefreshWidget}>
                ↻ 위젯 새로고침
              </button>
            </div>
            
            <div className="widget-render-box">
              {/* key 속성을 부여하여 새로고침 버튼 클릭 시 아예 강제로 다시 그리도록 처리 */}
              <iframe 
                key={refreshKey}
                src={`https://agami-captcha.cloud/widget/embed?kind=flashlight&difficulty=easy&client_key=${project.site_key}`}
                width="100%" 
                height="500px" 
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

          {/* 하단: 백엔드 연동 가이드 영역 */}
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
    "token": "${testToken || "<상단_위젯에서_캡챠를_풀면_토큰이_채워집니다>"}"
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