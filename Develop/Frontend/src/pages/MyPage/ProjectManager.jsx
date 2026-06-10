import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ProjectManager.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const ProjectManager = () => {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [domainList, setDomainList] = useState([""]); // 도메인 배열로 상태 관리
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const response = await api.get("/api/projects");
      if (response.data.status === "success") setProjects(response.data.projects);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchProjects(); }, []);

  // 도메인 동적 입력 로직
  const handleDomainChange = (index, value) => {
    const newList = [...domainList];
    newList[index] = value;
    setDomainList(newList);
  };
  const addDomainInput = () => setDomainList([...domainList, ""]);
  const removeDomainInput = (index) => setDomainList(domainList.filter((_, i) => i !== index));

  const handleCreateProject = async (e) => {
    e.preventDefault();
    // 빈 칸 제외하고 쉼표로 병합
    const domains = domainList.filter(d => d.trim() !== "").join(",");
    if (!domains) return alert("최소 1개의 도메인을 입력해주세요.");

    try {
      const response = await api.post("/api/projects", { name, domains });
      if (response.data.status === "success") {
        setName(""); setDomainList([""]); setShowModal(false);
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
          {projects.map((project) => (
            <div key={project.id} className="project-card clickable-card" onClick={() => navigate(`/mypage/projects/${project.id}/info`)}>
              <div className="card-header">
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
          ))}
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
                {domainList.map((domain, index) => (
                  <div key={index} className="domain-input-row">
                    <input type="text" className="clean-input" value={domain} onChange={(e) => handleDomainChange(index, e.target.value)} placeholder="예: example.com" required />
                    {domainList.length > 1 && (
                      <button type="button" className="btn-remove-domain" onClick={() => removeDomainInput(index)}>X</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-add-domain" onClick={addDomainInput}>+ 도메인 추가</button>
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