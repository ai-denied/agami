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
import KakaoCallback from './pages/KakaoCallback';

// 네비바를 숨길 경로 목록
const NavbarWrapper = () => {
  const location = useLocation();
  const hideNavbarPaths = ['/login', '/auth/kakao/callback'];
  if (hideNavbarPaths.includes(location.pathname)) return null;
  return <Navbar />;
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
          <NavbarWrapper /> 
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/price" element={<Price />} />
            <Route path="/test" element={<Test />} />
            <Route path="/platform" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
export default App;