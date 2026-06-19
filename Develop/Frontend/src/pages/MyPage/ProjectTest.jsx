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
  const [platform, setPlatform] = useState("linux");
  
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

  useEffect(() => {
    const handleIframeMessage = (event) => {
      const data = event.data;
      if (!data) return;
      if (data.source && data.source.includes('react-devtools')) return;

      // 1. 위젯 리사이징 (무한 증식 방지 로직 적용)
      if (data.type === 'agami-resize' && data.height) {
        setWidgetHeight(prev => {
          if (Math.abs(prev - data.height) > 10) {
            return data.height;
          }
          return prev;
        });
      }

      // 2. 캡챠 인증 결과(토큰) 처리
      if (data.type === 'agami-result') {
        if (data.success && data.captchaToken) {
          setTestToken(String(data.captchaToken));
        } else if (data.success && data.token) {
          setTestToken(String(data.token));
        }
      } 
      // 3. 구형 포맷 방어
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
    setWidgetHeight(600); 
  };

  const getCurlSnippet = () => {
    const token = testToken || "<발급된_토큰>";

    switch (platform) {
      case "windows":
        return `curl -X POST https://agami-captcha.cloud/v1/siteverify ^
    -d "secret=${project?.secret_key}" ^
    -d "token=${token}"`;

      case "powershell":
        return `curl.exe -X POST https://agami-captcha.cloud/v1/siteverify \`
    -d "secret=${project?.secret_key}" \`
    -d "token=${token}"`;

      default:
        return `curl -X POST https://agami-captcha.cloud/v1/siteverify \\
    -d "secret=${project?.secret_key}" \\
    -d "token=${token}"`;
    }
  };

  const handleCopySnippet = () => {
    const snippet = getCurlSnippet();

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
                height={`${widgetHeight}px`} 
                frameBorder="0"
                title="Agami Captcha Widget"
                scrolling="no"
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

            <div className="platform-tabs">
              <button
                className={platform === "linux" ? "active" : ""}
                onClick={() => setPlatform("linux")}
              >
                Linux/macOS
              </button>

              <button
                className={platform === "windows" ? "active" : ""}
                onClick={() => setPlatform("windows")}
              >
                Windows CMD
              </button>

              <button
                className={platform === "powershell" ? "active" : ""}
                onClick={() => setPlatform("powershell")}
              >
                PowerShell
              </button>
            </div>
            
            <div className="code-snippet-box">
              <div className="code-header">
                <span>cURL 예시 (명령 프롬프트/터미널 실행용)</span>
                <button className="btn-copy-code" onClick={handleCopySnippet}>
                  {isCopied ? "복사완료!" : "코드 복사"}
                </button>
              </div>
              <pre className="code-content">
                <code>{getCurlSnippet()}</code>
              </pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectTest;