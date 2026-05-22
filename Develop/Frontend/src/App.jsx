import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute'; // 추가
import Navbar from './pages/Navbar'; 
import Home from './pages/Home'; 
import Login from './pages/Login'; 
import Price from './pages/Price';
import Dashboard from './pages/Dashboard';
import KakaoCallback from './contexts/KakaoCallback';

function App() {
  useEffect(() => {
    document.title = "Agami - 차세대 지능형 캡챠 서비스";
    
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.type = 'image/x-icon'; 
    link.rel = 'shortcut icon'; 
    link.href = '/agami-home.svg'; 
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <Navbar /> 
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/price" element={<Price />} />
          
          {/* 로그인한 사용자만 접근 가능한 대시보드 경로 */}
          <Route path="/platform" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;