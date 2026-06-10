import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./Settings.css"; // 기존 Settings.css의 깔끔한 폼 스타일 재사용

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await api.get(`/api/projects/${id}`);
        if (response.data.status === "success") {
          setProject(response.data.project);
          setName(response.data.project.name);
        }
      } catch (error) {
        console.error("프로젝트 로드 실패:", error);
      }
    };
    fetchProjectDetails();
  }, [id]);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (name === project.name) {
      showNotification("변경된 이름이 없습니다.", "error");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.patch(`/api/projects/${id}`, { name });
      if (response.data.status === "success") {
        showNotification("프로젝트 이름이 수정되었습니다.");
        setProject({ ...project, name });
      }
    } catch (error) {
      showNotification("수정 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification("키가 클립보드에 복사되었습니다.");
  };

  if (!project) return <div>프로젝트 정보를 불러오는 중입니다...</div>;

  return (
    <div className="settings-page-wrapper">
      <div className="settings-container">
        <header className="settings-header">
          <h1 className="settings-title">프로젝트 기본 정보</h1>
          <p className="settings-description">프로젝트 이름을 수정하고 연동 키를 확인합니다.</p>
        </header>

        <section className="settings-section">
          <h2 className="section-label">기본 설정</h2>
          <form className="nickname-form" onSubmit={handleUpdateName}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">프로젝트 이름</label>
              <input 
                type="text" id="name" className="form-input" 
                value={name} onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">허용 도메인 (수정 불가)</label>
              <input type="text" className="form-input" value={project.domains} disabled style={{ backgroundColor: '#f3f4f6', color: '#9ca3af' }}/>
            </div>
            <div className="form-actions">
              {notification.show && (
                <span className={`notification-msg ${notification.type}`}>{notification.message}</span>
              )}
              <button type="submit" className="btn-submit" disabled={isSubmitting}>
                {isSubmitting ? "저장 중..." : "변경사항 저장"}
              </button>
            </div>
          </form>
        </section>

        <hr className="divider" />

        <section className="settings-section">
          <h2 className="section-label">캡챠 연동 키</h2>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '16px' }}>이 키를 사용하여 웹사이트에 캡챠를 연동하세요.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px' }}>
              <span style={{ width: '100px', fontWeight: '700', fontSize: '0.85rem', color: '#6b7280' }}>Site Key</span>
              <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.9rem', color: '#111827' }}>{project.site_key}</span>
              <button onClick={() => copyToClipboard(project.site_key)} style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', color: '#4b5563' }}>복사</button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px' }}>
              <span style={{ width: '100px', fontWeight: '700', fontSize: '0.85rem', color: '#6b7280' }}>Secret Key</span>
              <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.9rem', color: '#111827' }}>{project.secret_key}</span>
              <button onClick={() => copyToClipboard(project.secret_key)} style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', color: '#4b5563' }}>복사</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProjectDetail;