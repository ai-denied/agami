import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom"; 
import Flashlight from "@/components/FlashlightCaptcha/FlashlightCaptcha";
import "./Settings.css"; // 기존 컨테이너 스타일 재활용
import "./ProjectTest.css"; // 테스트 전용 스타일

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const ProjectTest = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [testToken, setTestToken] = useState("");
  const [isCopied, setIsCopied] = useState(false);

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

  const handleCaptchaComplete = (token) => {
    // 캡챠 컴포넌트에서 인증 성공 시 토큰을 반환한다고 가정
    setTestToken(token || "agami_mock_token_success_12345");
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

        <div className="test-grid-layout">
          {/* 좌측: 프론트엔드 위젯 테스트 영역 */}
          <div className="test-left-panel">
            <h3 className="panel-title">1. 위젯 동작 테스트</h3>
            <p className="panel-desc">아래 위젯은 고객님의 <strong>Site Key</strong>로 구동되고 있습니다. 캡챠를 직접 해결해 보세요.</p>
            
            <div className="widget-render-box">
              <Flashlight 
                kind="flashlight" 
                difficulty="normal" 
                clientKey={project.site_key} 
                onComplete={handleCaptchaComplete} 
              />
            </div>

            {testToken && (
              <div className="token-result-box">
                <span className="success-badge">✅ 인증 성공</span>
                <span className="token-label">발급된 토큰:</span>
                <div className="token-string">{testToken}</div>
              </div>
            )}
          </div>

          {/* 우측: 백엔드 연동 가이드 영역 */}
          <div className="test-right-panel">
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
    "token": "${testToken || "<좌측에서_캡챠를_풀면_토큰이_채워집니다>"}"
  }'`}</code>
              </pre>
            </div>
            
            <div className="info-alert-box">
              <strong>💡 주의사항</strong>
              <p>Secret Key는 절대로 프론트엔드(브라우저) 코드에 노출되어서는 안 됩니다. 반드시 백엔드 서버에서 호출해 주세요.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTest;