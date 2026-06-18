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
import Intro from '@/pages/Intro/Intro';
import AuthCallback from "@/pages/Login/AuthCallback";

import MyPage from '@/pages/MyPage/MyPage'; 
import ProjectManager from '@/pages/MyPage/ProjectManager';
import ProjectDetail from '@/pages/MyPage/ProjectDetail';
import Dashboard from '@/pages/MyPage/Dashboard'; 
import Settings from '@/pages/MyPage/Settings';
import ProjectTest from '@/pages/MyPage/ProjectTest';

// 로그인된 사용자의 접근을 막는 PublicRoute 래퍼
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to="/mypage/projects" replace />;
  }

  return children;
};

// 네비바 렌더링 제어 컴포넌트
// 네비바 렌더링 제어 컴포넌트
const Layout = ({ children }) => {
  const location = useLocation();
  
  // user 조건 제거: 콜백 등 특정 인증 라우트가 아닌 이상 네비바를 항상 출력합니다.
  const isHideNavbar = location.pathname.startsWith('/auth/');
  
  return (
    <>
      {!isHideNavbar && <Navbar />}
      {children}
    </>
  );
};

function App() {
  useEffect(() => {
    // 1. 브라우저 탭 타이틀 전역 고정 (agami-frontend 노출 시간 최소화)
    document.title = "agami - 차세대 지능형 캡챠 서비스";

    // 2. 파비콘(로고 아이콘) 전역 주입 로직을 App.jsx로 이관하여 Home.jsx 종속성 제거
    const link = document.querySelector("link[rel~='icon']") || document.createElement("link");
    link.type = "image/svg+xml";
    link.rel = "icon";
    link.href = "/agami-home.svg";
    
    if (!document.head.contains(link)) {
      document.head.appendChild(link);
    }
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
              <Route path="/intro" element={<Intro />} />
              <Route path="/auth/:provider/callback" element={<AuthCallback />} />
              
              {/* 결제 성공 콜백 라우트 */}
              <Route path="/payment/success" element={<PaymentSuccess />} />

              {/* 프라이빗 라우트 (로그인 필수) */}
              <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>}>
                <Route index element={<Navigate to="projects" replace />} />
                <Route path="projects" element={<ProjectManager />} />
                <Route path="projects/:id" element={<Navigate to="info" replace />} />
                <Route path="projects/:id/info" element={<ProjectDetail />} />
                <Route path="projects/:id/dashboard" element={<Dashboard />} />
                <Route path="projects/:id/projecttest" element={<ProjectTest />} />
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