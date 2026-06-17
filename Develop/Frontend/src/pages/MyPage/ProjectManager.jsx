import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ProjectManager.css";
import Scrollbar from "@/components/Scrollbar/Scrollbar";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const ProjectManager = () => {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [domainList, setDomainList] = useState([""]); 
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  // 커스텀 모달 상태 관리
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

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const domains = domainList.filter(d => d.trim() !== "").join(",");
    if (!domains) {
      showAlert("최소 1개의 도메인을 입력해주세요.");
      return;
    }

    try {
      const response = await api.post("/api/projects", { name, domains });
      if (response.data.status === "success") {
        setName(""); setDomainList([""]); setShowCreateModal(false);
        fetchProjects();
        showAlert("새 프로젝트가 생성되었습니다.");
      }
    } catch (error) { console.error(error); }
  };

  // 자체 Confirm 모달을 이용한 삭제 로직
  const handleDeleteProject = (e, projectId) => {
    e.stopPropagation(); 
    setConfirmModal({
      show: true,
      message: "정말로 이 프로젝트를 삭제하시겠습니까?\n관련 데이터가 모두 삭제되며 복구할 수 없습니다.",
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.delete(`/api/projects/${projectId}`);
          fetchProjects();
          showAlert("프로젝트가 삭제되었습니다.");
        } catch (error) { showAlert("프로젝트 삭제 중 오류가 발생했습니다."); }
      }
    });
  };

  const copyToClipboard = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    showAlert("키가 클립보드에 복사되었습니다.");
  };

  return (
    <Scrollbar className="pm-wrapper">
      <div className="pm-container">
        <header className="pm-header">
          <div>
            <h1 className="pm-title">프로젝트 관리</h1>
            <p className="pm-description">캡챠를 적용할 웹사이트를 등록하고 인증 키를 발급받습니다.</p>
          </div>
          <button className="btn-create-project" onClick={() => setShowCreateModal(true)}>+ 신규 프로젝트</button>
        </header>

        <div className="project-list">
          {projects.length === 0 ? (
            <div className="empty-state">생성된 프로젝트가 없습니다.</div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="project-card clickable-card" onClick={() => navigate(`/mypage/projects/${project.id}/info`)}>
                <div className="card-header">
                  <h2 className="project-name">{project.name || "이름 없는 프로젝트"}</h2>
                  <div className="card-header-right">
                    <span className="project-usage">이번 달 사용량: {project.total_usage}회</span>
                    <button className="btn-delete-project" onClick={(e) => handleDeleteProject(e, project.id)}>삭제</button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="domain-tags">
                    <strong>허용 도메인:</strong>
                    {project.domains.split(",").map((d, i) => <span key={i} className="domain-tag">{d}</span>)}
                  </div>

                  <div className="key-row">
                    <span className="key-label">Site Key</span>
                    <span className="key-value">{project.site_key}</span>
                    <button className="btn-copy-main" onClick={(e) => copyToClipboard(e, project.site_key)}>복사</button>
                  </div>
                  <div className="key-row">
                    <span className="key-label">Secret Key</span>
                    <span className="key-value">{project.secret_key}</span>
                    <button className="btn-copy-main" onClick={(e) => copyToClipboard(e, project.secret_key)}>복사</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 신규 생성 모달 */}
      {showCreateModal && (
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
                {domainList.map((domain, index) => (
                  <div key={index} className="domain-input-row">
                    <input type="text" className="clean-input flex-fill" value={domain} onChange={(e) => handleDomainChange(index, e.target.value)} placeholder="예: agami-captcha.cloud" required />
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

      {/* 자체 Alert 모달 */}
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

      {/* 자체 Confirm 모달 */}
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
    </Scrollbar>
  );
};

export default ProjectManager;