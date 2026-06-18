import React from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Scrollbar from "@/components/Scrollbar/Scrollbar";
import "./MyPage.css";

const MyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const projectMatch = location.pathname.match(/\/mypage\/projects\/(\d+)/);
  const projectId = projectMatch ? projectMatch[1] : null;
  const isProjectContext = projectId && location.pathname !== "/mypage/projects";

  return (
    <div className="page-wrapper mypage-wrapper">
      <div className="layout-container mypage-layout">
        
        <aside className="mypage-sidebar">
          
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
                <NavLink to={`/mypage/projects/${projectId}/projecttest`} className={({ isActive }) => isActive ? "active" : ""}>
                  <li>테스트</li>
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
        </aside>

        <Scrollbar className="mypage-main">
          <Outlet />
        </Scrollbar>
        
      </div>
    </div>
  );
};

export default MyPage;