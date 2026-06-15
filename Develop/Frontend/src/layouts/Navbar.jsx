import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import "./Navbar.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const Navbar = () => {
  const { user, setUser } = useAuth();
  const [isFirstVisit, setIsFirstVisit] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. 방문 기록 확인
    const hasVisited = sessionStorage.getItem("hasVisitedAgami");
    setIsFirstVisit(!hasVisited);

    // 2. 방문 기록이 없다면 현재 방문을 기록하여 다음 렌더링부터 지연을 없앰
    if (!hasVisited) {
      sessionStorage.setItem("hasVisitedAgami", "true");
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.body.classList.add("dark-mode");
    }
  }, []);

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

  if (isFirstVisit === null) return null;

  return (
    <motion.nav 
      className="menu-bar" 
      initial={isFirstVisit ? { opacity: 0, y: -100 } : { opacity: 1, y: 0 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: isFirstVisit ? 4 : 0, duration: 1 }}
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