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
  
  // 위젯이 요구하는 높이를 실시간으로 반영하기 위한 상태 (기본 600px)
  const [widgetHeight, setWidgetHeight] = useState(600); 

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

  // iframe 메시지 통신 (리사이징 & 토큰 수신)
  useEffect(() => {
    const handleIframeMessage = (event) => {
      const data = event.data;
      if (!data) return;
      if (data.source && data.source.includes('react-devtools')) return;

      console.log("[Agami Widget] 수신된 데이터:", data);

      // 1. 위젯 리사이징(크기 조절) 이벤트 처리
      if (data.type === 'agami-resize' && data.height) {
        // 위젯이 요구하는 높이에 약간의 여백(20px)을 더해 완벽히 담아냅니다.
        setWidgetHeight(data.height + 20);
      }

      // 2. 캡챠 인증 결과(토큰) 처리
      if (data.type === 'agami-result') {
        if (data.success && data.captchaToken) {
          setTestToken(String(data.captchaToken)); // 낙타 표기법(captchaToken) 캡치 완벽 적용
        } else if (data.success && data.token) {
          setTestToken(String(data.token));
        }
      } 
      // 3. 만약 타입이 명시되지 않은 구형 포맷일 경우 방어 로직
      else if (typeof data === 'object' && (data.captchaToken || data.captcha_token || data.token)) {
        setTestToken(String(data.captchaToken || data.captcha_token || data.token));
      }
    };

    window.addEventListener("message", handleIframeMessage);
    return () => window.removeEventListener("message", handleIframeMessage);
  }, []);

  const handleRefreshWidget = () => {
    setRefreshKey(prev => prev + 1);
    setTestToken(""); 
    setWidgetHeight(600); // 새로고침 시 높이 초기화
  };

  const handleCopySnippet = () => {
    const snippet = `curl -X POST https://agami-captcha.cloud/api/v1/siteverify \\
  -d "secret=${project?.secret_key}" \\
  -d "token=${testToken || "<발급된_토큰>"}"`;
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
              {/* 높이가 widgetHeight 상태에 따라 고무줄처럼 자동으로 늘어납니다. */}
              <iframe 
                key={refreshKey}
                src={`https://agami-captcha.cloud/widget/embed?kind=flashlight&difficulty=easy&client_key=${project.site_key}`}
                width="100%" 
                height={`${widgetHeight}px`} 
                frameBorder="0"
                title="Agami Captcha Widget"
                scrolling="no"
                style={{ transition: 'height 0.3s ease' }} /* 부드럽게 늘어나는 애니메이션 */
              ></iframe>
            </div>

            {testToken && (
              <div className="token-result-box">
                <span className="success-badge">✅ 인증 완료 및 토큰 수신</span>
                <span className="token-label">발급된 토큰 (captchaToken):</span>
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
<code>{`curl -X POST https://agami-captcha.cloud/api/v1/siteverify \\
  -d "secret=${project.secret_key}" \\
  -d "token=${testToken ? (testToken.length > 50 ? testToken.substring(0, 50) + "..." : testToken) : "<상단_위젯에서_캡챠를_풀면_토큰이_채워집니다>"}"`}</code>
              </pre>
            </div>
            
            <div className="info-alert-box">
              <strong>💡 주의사항</strong>
              <p>이 코드는 반드시 고객님의 백엔드 서버에서 실행되어야 합니다.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectTest;