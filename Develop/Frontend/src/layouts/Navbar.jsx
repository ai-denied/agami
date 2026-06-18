import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import "./Navbar.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const Navbar = () => {
  const [isFirstVisit, setIsFirstVisit] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("hasVisitedAgami");
    setIsFirstVisit(!hasVisited);
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

  // Navbar.jsx
  const handleLogout = async () => {
    try { 
      await api.post("/api/auth/logout"); 
    } catch (e) { 
      console.error(e); 
    }
    localStorage.clear();
    window.location.href = "/";
  };

  if (isFirstVisit === null) return null;

  // 홈 화면(/)이면서 첫 방문일 때만 애니메이션 적용
  const isHome = location.pathname === "/";
  const shouldAnimate = isFirstVisit && isHome;

  return (
    <motion.nav 
      className="menu-bar" 
      initial={shouldAnimate ? { opacity: 0, y: -100 } : { opacity: 1, y: 0 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: shouldAnimate ? 4 : 0, duration: 1 }}
    >
      <div className="nav-container">
        <div className="nav-group left">
          <button className="home-logo-btn" onClick={() => navigate("/")}>
            <img src="/agami-home.svg" alt="Home" />
          </button>
          <div className="nav-links">
            {/* 로그인 상태일 때만 '마이페이지' 노출 */}
            {user && (
              <button className="nav-item" onClick={() => navigate("/mypage")}>마이페이지</button>
            )}
            <button className="nav-item" onClick={() => navigate("/price")}>가격</button>
            
            {/* 로그인하지 않은 상태(!user)일 때만 '소개' 메뉴 노출 */}
            {!user && (
              <button className="nav-item" onClick={() => navigate("/intro")}>소개</button>
            )}
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
            <div className="user-profile-wrapper">
              <div className="user-profile-info">
                {user.profile && <img src={user.profile} alt="profile" className="nav-profile-img" onError={(e) => { e.target.style.display = 'none'; }} />}
                <span className="nav-nickname"><strong>{user.nickname}</strong> 님</span>
              </div>
              <button className="nav-item logout-btn" onClick={handleLogout}>로그아웃</button>
            </div>
          ) : (
            <button className="nav-item login-btn" onClick={() => navigate("/login")}>로그인</button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;