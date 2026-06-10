import React from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import "./MyPage.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const MyPage = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try { await api.post("/api/auth/logout"); } catch (e) { console.error(e); }
    setUser(null); localStorage.clear(); window.location.href = "/";
  };

  // 현재 URL이 특정 프로젝트 내부인지 정규식으로 확인
  const projectMatch = location.pathname.match(/\/mypage\/projects\/(\d+)/);
  const projectId = projectMatch ? projectMatch[1] : null;
  // 프로젝트 목록 메인 화면(/mypage/projects)일 때는 글로벌 메뉴 표시
  const isProjectContext = projectId && location.pathname !== "/mypage/projects";

  return (
    <div className="mypage-container">
      <aside className="mypage-sidebar">
        <div className="sidebar-header">
          <div className="profile-section">
            <img src={user?.profile || '/agami-profile.png'} alt="profile" className="profile-img" onError={(e) => { e.target.src = '/agami-profile.png'; }} />
            <span className="profile-name"><strong>{user?.nickname}</strong> 님</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
        </div>

        <nav className="sidebar-menu">
          {isProjectContext ? (
            <>
              {/* 프로젝트 내부 전용 사이드바 */}
              <div 
                onClick={() => navigate("/mypage/projects")}
                style={{ padding: '12px 16px', cursor: 'pointer', color: '#6b7280', fontSize: '0.95rem', fontWeight: '600', marginBottom: '10px' }}
              >
                <i className="fa-solid fa-arrow-left" style={{marginRight: '8px'}}></i> 프로젝트 목록
              </div>
              <div style={{ margin: '16px 0 8px 16px', fontSize: '0.8rem', fontWeight: '700', color: '#9ca3af' }}>프로젝트 관리</div>
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