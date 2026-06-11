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

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || document.body.classList.contains("dark-mode")) {
      setIsDarkMode(true);
      document.body.classList.add("dark-mode");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.body.classList.toggle("dark-mode", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleLogout = async () => {
    try { 
      await api.post("/api/auth/logout"); 
    } catch (e) { 
      console.error(e); 
    }
    
    const currentTheme = localStorage.getItem("theme"); 
    setUser(null); 
    localStorage.clear(); 
    
    if (currentTheme) {
      localStorage.setItem("theme", currentTheme);
    }
    
    window.location.href = "/";
  };

  const projectMatch = location.pathname.match(/\/mypage\/projects\/(\d+)/);
  const projectId = projectMatch ? projectMatch[1] : null;
  const isProjectContext = projectId && location.pathname !== "/mypage/projects";

  return (
    <div className="page-wrapper mypage-wrapper">
      <div className="layout-container mypage-layout">
        <aside className="sidebar mypage-sidebar">
          
          {/* 상단: 로고(왼쪽)와 테마 토글(오른쪽) */}
          <div className="sidebar-top-controls">
            <NavLink to="/mypage/projects" className="brand-logo">
              <img src="/agami-home.svg" alt="Agami Home" />
            </NavLink>
            <div className={`theme-switch ${isDarkMode ? "active" : ""}`} onClick={toggleTheme}>
              <div className="switch-content">
                <span className="label-light">LIGHT</span>
                <div className="switch-handle"></div>
                <span className="label-dark">DARK</span>
              </div>
            </div>
          </div>

          {/* 프로필 영역 */}
          <div className="sidebar-profile">
            <img 
              src={user?.profile || '/agami-profile.png'} 
              alt="profile" 
              className="profile-img" 
              onError={(e) => { e.target.src = '/agami-profile.png'; }} 
            />
            <span className="profile-name"><strong>{user?.nickname}</strong> 님</span>
          </div>

          {/* 메뉴 리스트 */}
          <ul className="sidebar-menu-list">
            {isProjectContext ? (
              <>
                <li className="back-btn-li" onClick={() => navigate("/mypage/projects")}>
                  <span className="arrow-icon">←</span> 프로젝트 목록으로
                </li>
                <div className="menu-divider">프로젝트 관리</div>
                <NavLink to={`/mypage/projects/${projectId}/info`} className={({ isActive }) => isActive ? "active" : ""}>
                  <li>기본 정보</li>
                </NavLink>
                <NavLink to={`/mypage/projects/${projectId}/dashboard`} className={({ isActive }) => isActive ? "active" : ""}>
                  <li>트래픽 대시보드</li>
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/mypage/projects" className={({ isActive }) => isActive ? "active" : ""} end>
                  <li>프로젝트 관리</li>
                </NavLink>
                <NavLink to="/mypage/settings" className={({ isActive }) => isActive ? "active" : ""}>
                  <li>계정 설정</li>
                </NavLink>
              </>
            )}
          </ul>

          {/* 하단 로그아웃 */}
          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
          </div>
        </aside>

        <main className="main-content mypage-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MyPage;