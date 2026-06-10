import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ProjectManager.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const ProjectManager = () => {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [domains, setDomains] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get("/api/projects");
      if (response.data.status === "success") {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error("프로젝트 로드 실패:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/projects", { name, domains });
      if (response.data.status === "success") {
        setName("");
        setDomains("");
        setShowModal(false);
        fetchProjects();
        showNotification("새 프로젝트와 인증 키가 발급되었습니다.");
      }
    } catch (error) {
      showNotification("프로젝트 생성에 실패했습니다.", "error");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification("클립보드에 복사되었습니다.");
  };

  return (
    <div className="project-manager-container">
      <header className="pm-header">
        <div>
          <h1 className="pm-title">프로젝트 관리</h1>
          <p className="pm-description">캡챠를 적용할 웹사이트를 등록하고 인증 키를 발급받습니다.</p>
        </div>
        <button className="btn-create-project" onClick={() => setShowModal(true)}>
          + 신규 프로젝트
        </button>
      </header>

      {notification.show && (
        <div className={`pm-notification ${notification.type}`}>{notification.message}</div>
      )}

      <div className="project-list">
        {projects.length === 0 ? (
          <div className="empty-state">
            <p>등록된 프로젝트가 없습니다. 신규 프로젝트를 생성하여 키를 발급받으세요.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <h2 className="project-name">{project.name}</h2>
                <span className="project-usage">이번 달 사용량: {project.monthly_usage}회</span>
              </div>
              <div className="project-domains">
                <strong>허용 도메인:</strong> {project.domains}
              </div>
              <div className="key-section">
                <div className="key-row">
                  <span className="key-label">Site Key</span>
                  <input type="text" className="key-input" value={project.site_key} readOnly />
                  <button className="btn-copy" onClick={() => copyToClipboard(project.site_key)}>복사</button>
                </div>
                <div className="key-row">
                  <span className="key-label">Secret Key</span>
                  <input type="text" className="key-input" value={project.secret_key} readOnly />
                  <button className="btn-copy" onClick={() => copyToClipboard(project.secret_key)}>복사</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>신규 프로젝트 생성</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>프로젝트 이름</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 나의 메인 서비스" required />
              </div>
              <div className="form-group">
                <label>허용 도메인 (쉼표로 구분)</label>
                <input type="text" value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="예: localhost, example.com" required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>취소</button>
                <button type="submit" className="btn-submit">생성 및 키 발급</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;