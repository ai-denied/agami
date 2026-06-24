import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./ProjectTest.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const ProjectTest = () => {
  const { id: projectId } = useParams();
  const [project, setProject] = useState(null);
  const [token, setToken] = useState("");
  const [platform, setPlatform] = useState("linux");
  
  const widgetIdRef = useRef(null);
  const [alertModal, setAlertModal] = useState({ show: false, message: "" });

  // 1. 프로젝트 정보 로드
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await api.get(`/api/projects/${projectId}`);
        if (response.data.status === "success") {
          setProject(response.data.project);
        }
      } catch (error) {
        console.error("프로젝트 정보를 불러오지 못했습니다.", error);
      }
    };
    fetchProject();
  }, [projectId]);

  // 2. loader.js 동적 삽입 및 위젯 explicit 렌더링
  useEffect(() => {
    if (!project || !project.site_key) return;

    const renderWidget = () => {
      if (window.agami) {
        if (widgetIdRef.current !== null) {
          window.agami.reset(widgetIdRef.current);
        } else {
          widgetIdRef.current = window.agami.render('#agami-test-widget', {
            sitekey: project.site_key,
            kind: 'flashlight',
            callback: (t) => {
              setToken(t); // 풀이 성공 시 토큰 저장
            },
            errorCallback: (info) => {
              console.error("Captcha Error:", info);
            }
          });
        }
      }
    };

    const scriptId = "agami-loader-script";
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://agami-captcha.cloud/widget/loader.js";
      script.async = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else {
      if (window.agami) {
        renderWidget();
      } else {
        script.addEventListener('load', renderWidget);
      }
    }
  }, [project]);

  // 위젯 초기화 (트리거 idle 상태로 복귀)
  const handleRefreshWidget = () => {
    if (window.agami && widgetIdRef.current !== null) {
      window.agami.reset(widgetIdRef.current);
      setToken(""); // 저장된 토큰 초기화
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setAlertModal({ show: true, message: "코드가 클립보드에 복사되었습니다." });
    });
  };

  const closeAlert = () => setAlertModal({ show: false, message: "" });

  if (!project) return null;

  // 3. 인수인계 문서 기반 cURL 스니펫 동적 생성
  const getCurlSnippet = () => {
    const secret = project.secret_key;
    const currentToken = token || "<발급된_토큰>";
    const endpoint = "https://agami-captcha.cloud/captcha/v1/siteverify";

    if (platform === "linux") {
      return `curl -X POST ${endpoint} \\
      -H "Content-Type: application/x-www-form-urlencoded" \\
      -d "secret=${secret}" \\
      -d "token=${currentToken}"`;
    } else if (platform === "windows") {
      return `curl -X POST ${endpoint} ^
      -H "Content-Type: application/x-www-form-urlencoded" ^
      -d "secret=${secret}" ^
      -d "token=${currentToken}"`;
    } else {
      return `Invoke-RestMethod -Uri "${endpoint}" \`
      -Method Post \`
      -ContentType "application/x-www-form-urlencoded" \`
      -Body @{
        secret="${secret}"
        token="${currentToken}"
      }`;
    }
  };

  return (
    <div className="test-container">
      <div className="test-vertical-layout">
        
        {/* 헤더 타이틀 영역 */}
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text-primary)", marginBottom: "8px" }}>API 연동 테스트</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>발급받은 키를 사용하여 실제 캡챠 동작과 백엔드 검증 흐름을 테스트합니다.</p>
        </div>

        {/* 1. 실환경 위젯 테스트 */}
        <div className="test-panel">
          <div className="panel-header-row">
            <div>
              <h2 className="panel-title">1. 실환경 위젯 테스트</h2>
              <p className="panel-desc">고객님의 <strong>Site Key</strong>가 적용된 실제 연동 환경입니다.</p>
            </div>
            <button className="btn-refresh-widget" onClick={handleRefreshWidget}>
              ↻ 위젯 새로고침
            </button>
          </div>
          
          <div className="widget-wrapper">
            <div id="agami-test-widget"></div>
          </div>
          
          {token && (
            <div style={{ marginTop: "20px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#10b981", display: "block", marginBottom: "8px" }}>✓ 성공적으로 발급된 토큰:</span>
              <div className="token-string">{token}</div>
              {/* 💡 토큰 만료 시간 가이드라인 추가 */}
              <span style={{ fontSize: "0.85rem", color: "#ef4444", display: "block", marginTop: "10px", fontWeight: "600", lineHeight: "1.5" }}>
                ⚠️ 보안을 위해 위 토큰은 <strong>발급 후 2분 동안만 유효</strong>하며, 1회 검증 시 즉시 파기됩니다.<br/>
                시간이 지났다면 위젯을 새로고침하여 다시 발급받아 주세요.
              </span>
            </div>
          )}
        </div>

        {/* 2. 백엔드 검증 테스트 */}
        <div className="test-panel">
          <div className="panel-header-row">
            <div>
              <h2 className="panel-title">2. 백엔드 검증 테스트</h2>
              <p className="panel-desc">아래의 cURL 코드를 복사하여 <strong>터미널(cmd)</strong>에 붙여넣고 엔터를 치시면 실제 검증 결과를 확인할 수 있습니다.</p>
            </div>
          </div>

          <div className="platform-tabs">
            <button className={platform === "linux" ? "active" : ""} onClick={() => setPlatform("linux")}>Linux/macOS</button>
            <button className={platform === "windows" ? "active" : ""} onClick={() => setPlatform("windows")}>Windows CMD</button>
            <button className={platform === "powershell" ? "active" : ""} onClick={() => setPlatform("powershell")}>PowerShell</button>
          </div>

          <div className="code-snippet-box">
            <div className="code-header">
              <span>cURL 예시 (명령 프롬프트/터미널 실행용)</span>
              <button className="btn-copy-code" onClick={() => copyToClipboard(getCurlSnippet())}>코드 복사</button>
            </div>
            <pre className="code-content">
              <code>{getCurlSnippet()}</code>
            </pre>
          </div>
        </div>

      </div>

      {alertModal.show && (
        <div className="custom-sys-modal-overlay" onClick={closeAlert} style={{ zIndex: 9999 }}>
          <div className="custom-sys-modal-box" onClick={e => e.stopPropagation()}>
            <div className="custom-sys-modal-text">{alertModal.message}</div>
            <div className="custom-sys-modal-actions">
              <button className="btn-sys-ok" onClick={closeAlert}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTest;