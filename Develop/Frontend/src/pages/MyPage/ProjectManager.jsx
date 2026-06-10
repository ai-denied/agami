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
    } catch (error) { console.error(error); }
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
    } catch (error) { console.error(error); }
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation(); 
    if (!window.confirm("정말로 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/api/projects/${projectId}`);
      fetchProjects();
    } catch (error) { console.error(error); }
  };

  const copyToClipboard = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    alert("복사되었습니다.");
  };

  return (
    <div className="pm-wrapper">
      <div className="pm-container">
        <header className="pm-header">
          <div>
            <h1 className="pm-title">프로젝트 관리</h1>
            <p className="pm-description">캡챠를 적용할 웹사이트를 등록하고 인증 키를 발급받습니다.</p>
          </div>
          <button className="btn-create-project" onClick={() => setShowModal(true)}>+ 신규 프로젝트</button>
        </header>

        <div className="project-list">
          {projects.length === 0 ? (
            <div className="empty-state">생성된 프로젝트가 없습니다.</div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="project-card clickable-card" onClick={() => navigate(`/mypage/projects/${project.id}/info`)}>
                <div className="card-header">
                  {/* 누락됐던 프로젝트 명칭 명확하게 출력 */}
                  <h2 className="project-name">{project.name}</h2>
                  <div className="card-header-right">
                    <span className="project-usage">이번 달 사용량: {project.monthly_usage}회</span>
                    <button className="btn-delete-project" onClick={(e) => handleDeleteProject(e, project.id)}>삭제</button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="domain-tags">
                    <strong>허용 도메인:</strong>
                    {project.domains.split(",").map((d, i) => <span key={i} className="domain-tag">{d}</span>)}
                  </div>
                  
                  {/* 복사 버튼에 명시적인 '복사' 텍스트 삽입 */}
                  <div className="key-row">
                    <span className="key-label">Site Key</span>
                    <span className="key-value">{project.site_key}</span>
                    <button className="btn-copy-box" onClick={(e) => copyToClipboard(e, project.site_key)}>복사</button>
                  </div>
                  <div className="key-row">
                    <span className="key-label">Secret Key</span>
                    <span className="key-value">{project.secret_key}</span>
                    <button className="btn-copy-box" onClick={(e) => copyToClipboard(e, project.secret_key)}>복사</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>신규 프로젝트 생성</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>프로젝트 이름</label>
                <input type="text" className="clean-input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>허용 도메인</label>
                <input type="text" className="clean-input" value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="예: agami-captcha.cloud" required />
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