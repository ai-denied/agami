import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./Settings.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [name, setName] = useState("");
  const [domainList, setDomainList] = useState([""]); // 배열 형태 추가
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

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

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
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
      showNotification("변경된 내용이 없습니다.", "error");
      setIsSubmitting(false); return;
    }

    try {
      const response = await api.patch(`/api/projects/${id}`, { name, domains });
      if (response.data.status === "success") {
        showNotification("프로젝트 정보가 수정되었습니다.");
        setProject({ ...project, name, domains });
      }
    } catch (error) { showNotification("수정 중 오류가 발생했습니다.", "error"); } 
    finally { setIsSubmitting(false); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification("키가 클립보드에 복사되었습니다.");
  };

  if (!project) return <div>로딩 중...</div>;

  return (
    <div className="settings-page-wrapper">
      <div className="settings-container">
        <header className="settings-header">
          <h1 className="settings-title">프로젝트 기본 정보</h1>
          <p className="settings-description">프로젝트 이름과 허용 도메인을 수정하고 연동 키를 확인합니다.</p>
        </header>

        <section className="settings-section">
          <h2 className="section-label">기본 설정</h2>
          <form className="nickname-form" onSubmit={handleUpdate}>
            <div className="form-group">
              <label className="form-label">프로젝트 이름</label>
              <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            
            <div className="form-group">
              <label className="form-label">허용 도메인</label>
              {domainList.map((domain, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input type="text" className="form-input" value={domain} onChange={(e) => handleDomainChange(index, e.target.value)} required />
                  {domainList.length > 1 && (
                    <button type="button" onClick={() => removeDomainInput(index)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', width: '48px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addDomainInput} style={{ alignSelf: 'flex-start', background: 'transparent', color: '#5da2ff', border: 'none', fontWeight: '700', cursor: 'pointer', marginTop: '4px' }}>+ 도메인 추가</button>
            </div>

            <div className="form-actions">
              {notification.show && <span className={`notification-msg ${notification.type}`}>{notification.message}</span>}
              <button type="submit" className="btn-submit" disabled={isSubmitting}>{isSubmitting ? "저장 중..." : "변경사항 저장"}</button>
            </div>
          </form>
        </section>

        <hr className="divider" />

        <section className="settings-section">
          <h2 className="section-label">캡챠 연동 키</h2>
          <p className="settings-description" style={{marginBottom: '16px'}}>이 키를 사용하여 웹사이트에 캡챠를 연동하세요.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 텍스트 삐져나옴 방지 적용 (word-break) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#fcfcfc', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', boxSizing: 'border-box' }}>
              <span style={{ width: '90px', fontWeight: '700', fontSize: '0.9rem', color: '#6b7280', flexShrink: 0 }}>Site Key</span>
              <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.95rem', color: '#111827', wordBreak: 'break-all' }}>{project.site_key}</span>
              <button onClick={() => copyToClipboard(project.site_key)} style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 16px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}>복사</button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#fcfcfc', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', boxSizing: 'border-box' }}>
              <span style={{ width: '90px', fontWeight: '700', fontSize: '0.9rem', color: '#6b7280', flexShrink: 0 }}>Secret Key</span>
              <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.95rem', color: '#111827', wordBreak: 'break-all' }}>{project.secret_key}</span>
              <button onClick={() => copyToClipboard(project.secret_key)} style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 16px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}>복사</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProjectDetail;