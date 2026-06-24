import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ProjectManager.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const ProjectManager = () => {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [domainList, setDomainList] = useState([""]); 
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  const [alertModal, setAlertModal] = useState({ show: false, message: "" });
  const [confirmModal, setConfirmModal] = useState({ show: false, message: "", onConfirm: null });

  const fetchProjects = async () => {
    try {
      const response = await api.get("/api/projects");
      if (response.data.status === "success") setProjects(response.data.projects);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDomainChange = (index, value) => {
    const newList = [...domainList];
    newList[index] = value;
    setDomainList(newList);
  };
  const addDomainInput = () => setDomainList([...domainList, ""]);
  const removeDomainInput = (index) => setDomainList(domainList.filter((_, i) => i !== index));

  const showAlert = (message) => setAlertModal({ show: true, message });
  const closeAlert = () => setAlertModal({ show: false, message: "" });
  
  const closeConfirm = () => setConfirmModal({ show: false, message: "", onConfirm: null });
  const confirmDelete = (projectId) => {
    setConfirmModal({
      show: true,
      message: "정말 이 프로젝트를 삭제하시겠습니까?",
      onConfirm: () => handleDeleteProject(projectId)
    });
  };

  const handleDeleteProject = async (projectId) => {
    try {
      const response = await api.delete(`/api/projects/${projectId}`);
      if (response.data.status === "success") {
        closeConfirm();
        showAlert("프로젝트가 삭제되었습니다.");
        fetchProjects();
      }
    } catch (error) {
      closeConfirm();
      showAlert("프로젝트 삭제에 실패했습니다.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return showAlert("프로젝트 이름을 입력하세요.");
    const validDomains = domainList.filter(d => d.trim() !== "");
    if (validDomains.length === 0) return showAlert("최소 하나 이상의 유효한 도메인을 입력해야 합니다.");

    try {
      const response = await api.post("/api/projects", { name, domains: validDomains.join(",") });
      if (response.data.status === "success") {
        setShowCreateModal(false);
        setName("");
        setDomainList([""]);
        fetchProjects();
      }
    } catch (error) {
      showAlert("프로젝트 생성에 실패했습니다.");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => showAlert("키가 복사되었습니다."));
  };

  // 💡 Secret Key 마스킹 헬퍼 함수
  const renderMaskedSecret = (key) => {
    return key ? `agami_secret_${"•".repeat(32)}` : "";
  };

  return (
    <div className="pm-wrapper">
      <div className="pm-container">
        <div className="pm-header">
          <div>
            <h1 className="pm-title">프로젝트 관리</h1>
            <p className="pm-description">운영 중인 웹사이트에 적용할 CAPTCHA 프로젝트를 관리하세요.</p>
          </div>
          <button className="btn-create-project" onClick={() => setShowCreateModal(true)}>+ 새 프로젝트</button>
        </div>

        <div className="project-list">
          {projects.length === 0 ? (
            <div className="empty-state">
              생성된 프로젝트가 없습니다.<br/>새 프로젝트를 생성하여 사이트를 보호하세요.
            </div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="project-card" onClick={() => navigate(`/mypage/projects/${project.id}/info`)}>
                
                <div className="card-header">
                  <div className="card-header-info">
                    <h2 className="project-name">{project.name}</h2>
                    <span className="project-usage">이번 달 사용량: {project.total_usage || 0}회</span>
                  </div>
                  
                  <button 
                    className="btn-delete-project icon-delete" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      confirmDelete(project.id); 
                    }}
                    title="프로젝트 삭제"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>

                <div className="domain-tags">
                  {project.domains.split(",").map((d, i) => (
                    <span key={i} className="domain-tag">{d}</span>
                  ))}
                </div>

                <div className="key-row">
                  <span className="key-label">Site Key</span>
                  <span className="key-value">{project.site_key}</span>
                  <button className="btn-copy-main" onClick={(e) => { e.stopPropagation(); copyToClipboard(project.site_key); }}>복사</button>
                </div>

                <div className="key-row">
                  <span className="key-label">Secret Key</span>
                  {/* 💡 화면에는 마스킹된 텍스트를 출력하지만, 복사 버튼에는 실제 secret_key(원본)를 넘깁니다. */}
                  <span className="key-value" style={{ letterSpacing: "1px" }}>{renderMaskedSecret(project.secret_key)}</span>
                  <button className="btn-copy-main" onClick={(e) => { e.stopPropagation(); copyToClipboard(project.secret_key); }}>복사</button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2>새 프로젝트 생성</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>프로젝트 이름</label>
                <input type="text" className="clean-input" value={name} onChange={e => setName(e.target.value)} placeholder="예: example" required />
              </div>
              <div className="form-group">
                <label>등록 도메인</label>
                {domainList.map((domain, index) => (
                  <div key={index} className="domain-input-row">
                    <input type="text" className="clean-input flex-fill" value={domain} onChange={e => handleDomainChange(index, e.target.value)} placeholder="예: example.com" required />
                    {domainList.length > 1 && (
                      <button type="button" className="btn-remove-domain" onClick={() => removeDomainInput(index)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-add-domain" onClick={addDomainInput}>+ 도메인 추가</button>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>취소</button>
                <button type="submit" className="btn-submit">생성</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {alertModal.show && (
        <div className="custom-sys-modal-overlay" onClick={closeAlert}>
          <div className="custom-sys-modal-box" onClick={e => e.stopPropagation()}>
            <div className="custom-sys-modal-text">{alertModal.message}</div>
            <div className="custom-sys-modal-actions">
              <button className="btn-sys-ok" onClick={closeAlert}>확인</button>
            </div>
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div className="custom-sys-modal-overlay" onClick={closeConfirm}>
          <div className="custom-sys-modal-box" onClick={e => e.stopPropagation()}>
            <div className="custom-sys-modal-text">{confirmModal.message}</div>
            <div className="custom-sys-modal-actions">
              <button className="btn-sys-cancel" onClick={closeConfirm}>취소</button>
              <button className="btn-sys-danger" onClick={confirmModal.onConfirm}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;