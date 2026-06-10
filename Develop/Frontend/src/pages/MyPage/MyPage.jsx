import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import "./MyPage.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const MyPage = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 초기 로드 시 기존 브라우저 테마 상태 동기화
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || document.body.classList.contains("dark-mode")) {
      setIsDarkMode(true);
      document.body.classList.add("dark-mode");
    }
  }, []);

  // 테마 토글 핸들러 (Navbar 로직과 동일하게 연동)
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.body.classList.toggle("dark-mode", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleLogout = async () => {
    try { await api.post("/api/auth/logout"); } catch (e) { console.error(e); }
    setUser(null); localStorage.clear(); window.location.href = "/";
  };

  const projectMatch = location.pathname.match(/\/mypage\/projects\/(\d+)/);
  const projectId = projectMatch ? projectMatch[1] : null;
  const isProjectContext = projectId && location.pathname !== "/mypage/projects";

  return (
    <div className="mypage-container">
      <aside className="mypage-sidebar">
        <div className="sidebar-header">
          <div className="profile-section">
            <img 
              src={user?.profile || '/agami-profile.png'} 
              alt="profile" 
              className="profile-img" 
              onError={(e) => { e.target.src = '/agami-profile.png'; }} 
            />
            <span className="profile-name"><strong>{user?.nickname}</strong> 님</span>
          </div>
          
          {/* 테마 스위치 이식 및 디자인 통일 */}
          <div className={`theme-switch sidebar-switch ${isDarkMode ? "active" : ""}`} onClick={toggleTheme}>
            <div className="switch-content">
              <span className="label-light">LIGHT</span>
              <div className="switch-handle"></div>
              <span className="label-dark">DARK</span>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
        </div>

        <nav className="sidebar-menu">
          {isProjectContext ? (
            <>
              {/* 프로젝트 내부 전용 사이드바: 직관적인 백버튼 UI 디자인 적용 */}
              <button 
                type="button"
                className="btn-sidebar-back"
                onClick={() => navigate("/mypage/projects")}
              >
                <span className="arrow-icon">←</span> 프로젝트 목록으로
              </button>
              
              <div className="menu-category-title">프로젝트 관리</div>
              <NavLink to={`/mypage/projects/${projectId}/info`} className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}>
                기본 정보
              </NavLink>
              <NavLink to={`/mypage/projects/${projectId}/dashboard`} className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}>
                트래픽 대시보드
              </NavLink>
            </>
          ) : (
            <>
              {/* 글로벌 사이드바 */}
              <NavLink to="/mypage/projects" className={({ isActive }) => isActive ? "menu-item active" : "menu-item"} end>
                프로젝트 관리
              </NavLink>
              <NavLink to="/mypage/settings" className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}>
                계정 설정
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      <main className="mypage-content">
        <Outlet />
      </main>
    </div>
  );
};

export default MyPage;