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

// 마이페이지 관련 컴포넌트
import MyPage from '@/pages/MyPage/MyPage'; 
import Dashboard from '@/pages/MyPage/Dashboard'; 
import Settings from '@/pages/MyPage/Settings'; 

// 네비바 렌더링 제어 컴포넌트
const Layout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  // 소셜 로그인 콜백 경로이거나, 로그인된 유저(마이페이지 렌더링 상태)일 경우 네비바 숨김
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
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/price" element={<Price />} />
              <Route path="/test" element={<Test />} />
              <Route path="/auth/:provider/callback" element={<AuthCallback />} />

              {/* 프라이빗 라우트 (로그인 필수) */}
              <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>}>
                {/* /mypage 접근 시 기본으로 대시보드로 리다이렉트 */}
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                /* <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;