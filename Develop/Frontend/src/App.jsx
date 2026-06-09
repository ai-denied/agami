import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute'; 
import Navbar from './pages/Navbar'; 
import Home from './pages/Home'; 
import Login from './pages/Login'; 
import Price from './pages/Price';
import Dashboard from './pages/Dashboard';
import Test from './pages/Test';
import AuthCallback from "./pages/AuthCallback";

// 네비바 렌더링 제어를 위한 내부 컴포넌트
const Layout = ({ children }) => {
  const location = useLocation();
  
  // 수정: 특정 소셜(kakao)에 국한되지 않고, /auth/로 시작하고 /callback으로 끝나는 모든 경로에서 네비바를 숨김 처리합니다.
  const isHideNavbar = location.pathname.startsWith('/auth/') && location.pathname.endsWith('/callback');
  
  return (
    <>
      {!isHideNavbar && <Navbar />}
      {children}
    </>
  );
};

function App() {
  useEffect(() => {
    document.title = "Agami - 차세대 지능형 캡챠 서비스";
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.type = 'image/x-icon'; link.rel = 'shortcut icon'; link.href = '/agami-home.svg'; 
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/price" element={<Price />} />
              <Route path="/test" element={<Test />} />
              <Route path="/platform" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/auth/:provider/callback" element={<AuthCallback />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;