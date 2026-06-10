import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import "./MyPage.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const MyPage = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post("/api/auth/logout"); } catch (e) { console.error(e); }
    setUser(null);
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="mypage-container">
      {/* 좌측 메뉴바 (Sidebar) */}
      <aside className="mypage-sidebar">
        <div className="sidebar-header">
          <div className="profile-section">
            <img 
              src={user?.profile || '/default-profile.png'} 
              alt="profile" 
              className="profile-img" 
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
            <span className="profile-name"><strong>{user?.nickname}</strong> 님</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
        </div>

        <nav className="sidebar-menu">
          <NavLink 
            to="/mypage/projects" 
            className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}
          >
            프로젝트 관리
          </NavLink>
          {/* 트래픽 대시보드는 프로젝트 내부로 이동했으므로 글로벌 LNB에서 제거 */}
          <NavLink 
            to="/mypage/settings" 
            className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}
          >
            계정 설정
          </NavLink>
        </nav>
      </aside>

      {/* 우측 콘텐츠 영역 */}
      <main className="mypage-content">
        <Outlet />
      </main>
    </div>
  );
};

export default MyPage;