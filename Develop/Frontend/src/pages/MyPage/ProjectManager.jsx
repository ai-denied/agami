import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ProjectManager.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const ProjectManager = () => {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [domains, setDomains] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const response = await api.get("/api/projects");
      if (response.data.status === "success") setProjects(response.data.projects);
    } catch (error) {
      console.error("프로젝트 로드 실패:", error);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/projects", { name, domains });
      if (response.data.status === "success") {
        setName(""); setDomains(""); setShowModal(false);
        fetchProjects();
      }
    } catch (error) {
      console.error("프로젝트 생성 실패:", error);
    }
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation(); 
    if (!window.confirm("정말로 이 프로젝트를 삭제하시겠습니까? (관련 데이터 모두 삭제됨)")) return;

    try {
      const response = await api.delete(`/api/projects/${projectId}`);
      if (response.data.status === "success") {
        fetchProjects();
      }
    } catch (error) {
      console.error("프로젝트 삭제 실패:", error);
      alert("프로젝트 삭제 중 오류가 발생했습니다.");
    }
  };

  const copyToClipboard = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    alert("클립보드에 복사되었습니다.");
  };

  const handleProjectClick = (projectId) => {
    navigate(`/mypage/projects/${projectId}/info`);
  };

  return (
    <div className="pm-container">
      <header className="pm-header">
        <div className="pm-title-group">
          <h1 className="pm-title">프로젝트 관리</h1>
          <p className="pm-description">캡챠를 적용할 웹사이트를 등록하고 인증 키를 발급받습니다.</p>
        </div>
        <button className="btn-create-project" onClick={() => setShowModal(true)}>
          + 신규 프로젝트
        </button>
      </header>

      <div className="project-list">
        {projects.map((project) => (
          <div 
            key={project.id} 
            className="project-card clickable-card" 
            onClick={() => handleProjectClick(project.id)}
          >
            <div className="card-header">
              <h2 className="project-name">{project.name}</h2>
              <div className="card-header-right">
                <span className="project-usage">이번 달 사용량: {project.monthly_usage}회</span>
                {/* 텍스트 형태의 삭제 버튼으로 변경 */}
                <button 
                  className="btn-delete-project" 
                  onClick={(e) => handleDeleteProject(e, project.id)}
                >
                  삭제
                </button>
              </div>
            </div>
            
            <div className="card-body">
              <p className="project-domains"><strong>허용 도메인:</strong> {project.domains}</p>
              
              <div className="key-row">
                <span className="key-label">Site Key</span>
                <input type="text" className="key-value" value={project.site_key} readOnly />
                {/* 텍스트 형태의 복사 버튼으로 변경 */}
                <button className="btn-copy-box" onClick={(e) => copyToClipboard(e, project.site_key)}>
                  복사
                </button>
              </div>
              
              <div className="key-row">
                <span className="key-label">Secret Key</span>
                <input type="text" className="key-value" value={project.secret_key} readOnly />
                <button className="btn-copy-box" onClick={(e) => copyToClipboard(e, project.secret_key)}>
                  복사
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>신규 프로젝트 생성</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>프로젝트 이름</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>허용 도메인</label>
                <input type="text" value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="예: agami-captcha.cloud" required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>취소</button>
                <button type="submit" className="btn-submit">생성</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;