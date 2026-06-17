import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom"; 
import "./Settings.css"; 

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate(); 
  const [project, setProject] = useState(null);
  const [name, setName] = useState("");
  const [domainList, setDomainList] = useState([""]); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 알림 및 삭제 확인 모달 상태
  const [alertModal, setAlertModal] = useState({ show: false, message: "" });
  const [confirmModal, setConfirmModal] = useState({ show: false, message: "", onConfirm: null });

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await api.get(`/api/projects/${id}`);
        if (response.data.status === "success") {
          setProject(response.data.project);
          setName(response.data.project.name);
          setDomainList(response.data.project.domains.split(","));
        }
      } catch (error) { console.error(error); }
    };
    fetchProjectDetails();
  }, [id]);

  const showAlert = (message) => setAlertModal({ show: true, message });
  const closeAlert = () => setAlertModal({ show: false, message: "" });
  const closeConfirm = () => setConfirmModal({ show: false, message: "", onConfirm: null });

  // 삭제 로직
  const handleDeleteProject = () => {
    setConfirmModal({
      show: true,
      message: "정말로 이 프로젝트를 삭제하시겠습니까?\n관련 데이터가 모두 삭제되며 복구할 수 없습니다.",
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.delete(`/api/projects/${id}`);
          navigate("/mypage/projects"); // 삭제 후 목록 페이지로 이동
        } catch (error) { showAlert("프로젝트 삭제 중 오류가 발생했습니다."); }
      }
    });
  };

  const handleDomainChange = (index, value) => {
    const newList = [...domainList];
    newList[index] = value;
    setDomainList(newList);
  };
  const addDomainInput = () => setDomainList([...domainList, ""]);
  const removeDomainInput = (index) => setDomainList(domainList.filter((_, i) => i !== index));

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const domains = domainList.filter(d => d.trim() !== "").join(",");
    
    if (name === project.name && domains === project.domains) {
      showAlert("변경된 내용이 없습니다.");
      setIsSubmitting(false); return;
    }

    try {
      const response = await api.patch(`/api/projects/${id}`, { name, domains });
      if (response.data.status === "success") {
        showAlert("프로젝트 정보가 성공적으로 수정되었습니다.");
        setProject({ ...project, name, domains });
      }
    } catch (error) { showAlert("수정 중 오류가 발생했습니다."); } 
    finally { setIsSubmitting(false); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showAlert("키가 클립보드에 복사되었습니다.");
  };

  if (!project) return <div style={{padding: '40px'}}>로딩 중...</div>;

  return (
    <div className="settings-page-wrapper">
      <div className="settings-container">
        <header className="settings-header">
          <div>
            <h1 className="settings-title">프로젝트 기본 정보</h1>
            <p className="settings-description">프로젝트 이름과 허용 도메인을 수정하고 연동 키를 확인합니다.</p>
          </div>
          <button className="btn-delete-project" onClick={handleDeleteProject}>프로젝트 삭제</button>
        </header>

        <section className="settings-section">
          <form className="nickname-form" onSubmit={handleUpdate}>
            <div className="form-group">
              <label className="form-label">프로젝트 이름</label>
              <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            
            <div className="form-group">
              <label className="form-label">허용 도메인</label>
              {domainList.map((domain, index) => (
                <div key={index} className="domain-input-row">
                  <input type="text" className="form-input flex-fill" value={domain} onChange={(e) => handleDomainChange(index, e.target.value)} required />
                  {domainList.length > 1 && (
                    <button type="button" className="btn-remove-domain" onClick={() => removeDomainInput(index)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn-add-domain" onClick={addDomainInput}>+ 도메인 추가</button>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={isSubmitting}>{isSubmitting ? "저장 중..." : "변경사항 저장"}</button>
            </div>
          </form>
        </section>

        <hr className="divider" />

        <section className="settings-section">
          <h2 className="section-label">발급 정보</h2>
          <p className="settings-description" style={{marginBottom: '16px'}}>이 키를 사용하여 웹사이트에 캡챠를 연동하세요.</p>
          
          <div className="key-display-group">
            <div className="key-display-row">
              <span className="key-display-label">Site Key</span>
              <span className="key-display-value">{project.site_key}</span>
              <button className="btn-copy-action" onClick={() => copyToClipboard(project.site_key)}>복사</button>
            </div>
            
            <div className="key-display-row">
              <span className="key-display-label">Secret Key</span>
              <span className="key-display-value">{project.secret_key}</span>
              <button className="btn-copy-action" onClick={() => copyToClipboard(project.secret_key)}>복사</button>
            </div>
          </div>
        </section>
      </div>

      {/* 모달 영역 추가 */}
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

      {/* 확인 모달 */}
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

export default ProjectDetail;