import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import PrivateRoute from '@/routes/PrivateRoute'; 
import Navbar from '@/layouts/Navbar'; 

import Home from '@/pages/Home/Home'; 
import Login from '@/pages/Login/Login'; 
import Price from '@/pages/Price/Price';
import PaymentSuccess from '@/pages/Price/PaymentSuccess';
import Test from '@/pages/Test/Test';
import AuthCallback from "@/pages/Login/AuthCallback";

import MyPage from '@/pages/MyPage/MyPage'; 
import ProjectManager from '@/pages/MyPage/ProjectManager';
import ProjectDetail from '@/pages/MyPage/ProjectDetail';
import Dashboard from '@/pages/MyPage/Dashboard'; 
import Settings from '@/pages/MyPage/Settings'; 

// 로그인된 사용자의 접근을 막는 PublicRoute 래퍼
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  
  // ✅ 수정된 부분: 존재하지 않는 /mypage/dashboard 대신 기본 시작점인 프로젝트 관리(/mypage/projects)로 리다이렉트합니다.
  if (user) {
    return <Navigate to="/mypage/projects" replace />;
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
              {/* 퍼블릭 라우트 */}
              <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              
              <Route path="/price" element={<Price />} />
              <Route path="/test" element={<Test />} />
              <Route path="/auth/:provider/callback" element={<AuthCallback />} />
              
              {/* ✅ 결제 성공 콜백 라우트 추가 */}
              <Route path="/payment/success" element={<PaymentSuccess />} />

              {/* 프라이빗 라우트 (로그인 필수) */}
              <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>}>
                <Route index element={<Navigate to="projects" replace />} />
                <Route path="projects" element={<ProjectManager />} />
                <Route path="projects/:id" element={<Navigate to="info" replace />} />
                <Route path="projects/:id/info" element={<ProjectDetail />} />
                <Route path="projects/:id/dashboard" element={<Dashboard />} />
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