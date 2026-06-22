import React, { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Scrollbar from "@/components/Scrollbar/Scrollbar";
import "./MyPage.css";

const MyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 💡 모바일 사이드바 상태

  const projectMatch = location.pathname.match(/\/mypage\/projects\/(\d+)/);
  const projectId = projectMatch ? projectMatch[1] : null;
  const isProjectContext = projectId && location.pathname !== "/mypage/projects";

  // 메뉴 클릭 시 모바일 사이드바 닫기
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="page-wrapper mypage-wrapper">
      <div className="layout-container mypage-layout">
        
        {/* 💡 모바일 전용 토글 버튼 */}
        <button 
          className="mobile-sidebar-toggle" 
          onClick={() => setIsSidebarOpen(true)}
          aria-label="메뉴 열기"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        {/* 💡 모바일 전용 오버레이 */}
        <div 
          className={`mobile-sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} 
          onClick={closeSidebar} 
        />
        
        <aside className={`mypage-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          
          {/* 💡 모바일 전용 사이드바 헤더 (닫기 버튼) */}
          <div className="sidebar-header-mobile">
            <h3>마이페이지</h3>
            <button className="mobile-sidebar-close" onClick={closeSidebar}>✕</button>
          </div>

          <div className="sidebar-profile">
            <img 
              src={user?.profile || '/agami-profile.png'} 
              alt="profile" 
              className="profile-img" 
              onError={(e) => { e.target.src = '/agami-profile.png'; }} 
            />
            <span className="profile-name"><strong>{user?.nickname}</strong> 님</span>
          </div>

          <ul className="sidebar-menu-list">
            {isProjectContext ? (
              <>
                <li className="back-btn-li" onClick={() => { navigate("/mypage/projects"); closeSidebar(); }}>
                  <span className="arrow-icon">←</span> 프로젝트 목록으로
                </li>
                <div className="menu-divider">프로젝트 관리</div>
                <NavLink to={`/mypage/projects/${projectId}/info`} className={({ isActive }) => isActive ? "active" : ""} onClick={closeSidebar}>
                  <li>기본 정보</li>
                </NavLink>
                <NavLink to={`/mypage/projects/${projectId}/dashboard`} className={({ isActive }) => isActive ? "active" : ""} onClick={closeSidebar}>
                  <li>트래픽 대시보드</li>
                </NavLink>
                <NavLink to={`/mypage/projects/${projectId}/projecttest`} className={({ isActive }) => isActive ? "active" : ""} onClick={closeSidebar}>
                  <li>테스트</li>
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/mypage/projects" className={({ isActive }) => isActive ? "active" : ""} end onClick={closeSidebar}>
                  <li>프로젝트 관리</li>
                </NavLink>
                <NavLink to="/mypage/settings" className={({ isActive }) => isActive ? "active" : ""} onClick={closeSidebar}>
                  <li>계정 설정</li>
                </NavLink>
              </>
            )}
          </ul>
        </aside>

        <Scrollbar className="mypage-main">
          <Outlet />
        </Scrollbar>
        
      </div>
    </div>
  );
};

export default MyPage;