import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './pages/Navbar'; 
import Home from './pages/Home'; 
import Login from './pages/Login'; 
import Price from './pages/Price';
import KakaoCallback from './contexts/KakaoCallback'; // 추가됨

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
          {/* 카카오 콜백 경로 추가 */}
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
        </Routes>

      </Router>
    </ThemeProvider>
  );
}

export default App;