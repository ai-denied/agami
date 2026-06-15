import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import "./Navbar.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const Navbar = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. null 상태를 거치지 않고 마운트 시점에 즉시 동기적으로 방문 여부 확인
  const [isFirstVisit, setIsFirstVisit] = useState(() => {
    return !sessionStorage.getItem("hasVisitedAgami");
  });
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isFirstVisit) {
      sessionStorage.setItem("hasVisitedAgami", "true");
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.body.classList.add("dark-mode");
    }
  }, [isFirstVisit]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.body.classList.toggle("dark-mode", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleLogout = async () => {
    try { 
      await api.post("/api/auth/logout"); 
    } catch (e) { 
      console.error(e); 
    }
    
    const currentTheme = localStorage.getItem("theme"); 
    setUser(null); 
    localStorage.clear(); 
    
    if (currentTheme) {
      localStorage.setItem("theme", currentTheme);
    }
    
    window.location.href = "/";
  };

  // 2. 홈 화면("/")이 아닌 마이페이지 등에서는 4초 딜레이를 강제로 0으로 설정하여 즉시 표시
  const isHome = location.pathname === "/";
  const delayTime = (isFirstVisit && isHome) ? 4 : 0;

  return (
    <motion.nav 
      className="menu-bar" 
      initial={isFirstVisit && isHome ? { opacity: 0, y: -100 } : { opacity: 1, y: 0 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: delayTime, duration: 1 }}
    >
      <div className="nav-container">
        <div className="nav-group left">
          <button className="home-logo-btn" onClick={() => navigate("/")}>
            <img src="/agami-home.svg" alt="Home" />
          </button>
          
          {user && (
            <button className="nav-item" onClick={() => navigate("/mypage/projects")}>
              마이페이지
            </button>
          )}
          
          <div className="nav-links">
            <button className="nav-item" onClick={() => navigate("/test")}>테스트</button>
            <button className="nav-item" onClick={() => navigate("/price")}>가격</button>
          </div>
        </div>

        <div className="nav-group right">
          <div className={`theme-switch ${isDarkMode ? "active" : ""}`} onClick={toggleTheme}>
            <div className="switch-content">
              <span className="label-light">LIGHT</span>
              <div className="switch-handle"></div>
              <span className="label-dark">DARK</span>
            </div>
          </div>
          
          {user ? (
            <button className="nav-item login-btn" onClick={handleLogout}>로그아웃</button>
          ) : (
            <button className="nav-item login-btn" onClick={() => navigate("/login")}>로그인</button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;