import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import PrivateRoute from '@/routes/PrivateRoute'; 
import Navbar from '@/layouts/Navbar'; 

import Home from '@/pages/Home/Home'; 
import Login from '@/pages/Login/Login'; 
import Price from '@/pages/Price/Price';
import Test from '@/pages/Test/Test';
import AuthCallback from "@/pages/Login/AuthCallback";

import MyPage from '@/pages/MyPage/MyPage'; 
import ProjectManager from '@/pages/MyPage/ProjectManager';
import Dashboard from '@/pages/MyPage/Dashboard'; 
import Settings from '@/pages/MyPage/Settings'; 

// 1. (신규 추가) 로그인된 사용자의 접근을 막는 PublicRoute 래퍼
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  
  // 유저 정보가 존재(로그인 상태)하면 무조건 대시보드로 강제 이동 (replace: true로 뒤로가기 방지)
  if (user) {
    return <Navigate to="/mypage/dashboard" replace />;
  }
  
  return children;
};

// 네비바 렌더링 제어 컴포넌트
const Layout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  const isHideNavbar = location.pathname.startsWith('/auth/') || user;
  
  return (
    <>
      {!isHideNavbar && <Navbar />}
      {children}
    </>
  );
};

function App() {
  useEffect(() => {
    document.title = "agami - 차세대 지능형 캡챠 서비스";
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              {/* 2. (수정) Home과 Login 라우트를 <PublicRoute>로 감싸서 
                로그인된 유저는 접근하지 못하도록 차단합니다. 
              */}
              <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              
              {/* 가격과 테스트 페이지는 로그인 유저도 볼 수 있게 PublicRoute로 감싸지 않았습니다 */}
              <Route path="/price" element={<Price />} />
              <Route path="/test" element={<Test />} />
              <Route path="/auth/:provider/callback" element={<AuthCallback />} />

              {/* 프라이빗 라우트 (로그인 필수) */}
              <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>}>
                {/* /mypage 접근 시 프로젝트 관리 화면이 먼저 보이도록 리다이렉트 */}
                <Route index element={<Navigate to="projects" replace />} />
                
                {/* 하위 라우트 등록 */}
                <Route path="projects" element={<ProjectManager />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;