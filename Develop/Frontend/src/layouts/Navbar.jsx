import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import "./Navbar.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const Navbar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // 💡 초기값을 즉시(Sync) 확인하여 첫 렌더링부터 애니메이션을 결정합니다.
  const [isFirstVisit] = useState(() => !sessionStorage.getItem("hasVisitedAgami"));
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
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
    try { await api.post("/api/auth/logout"); } catch (e) { console.error(e); }
    localStorage.removeItem("accessToken");
    window.location.href = "/"; 
  };

  // 💡 메인 홈("/")이고 첫 방문일 때만 인트로 애니메이션 실행
  const shouldAnimate = isFirstVisit && location.pathname === "/" && !isMobile;

  return (
    <motion.nav 
      className="menu-bar"
      initial={shouldAnimate ? { y: -100, opacity: 0 } : { y: 0, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
      transition={shouldAnimate ? { delay: 3.5, duration: 1.5, ease: [0.4, 0, 0.2, 1] } : { duration: 0 }}
    >
      <div className="nav-container">
        <div className="nav-group left">
          <button className="home-logo-btn" onClick={() => navigate("/")}>
            <img src="/agami-home.svg" alt="Home" />
          </button>
          <div className="nav-links">
            {user && <button className="nav-item" onClick={() => navigate("/mypage")}>마이페이지</button>}
            <button className="nav-item" onClick={() => navigate("/price")}>가격</button>
            {!user && <button className="nav-item" onClick={() => navigate("/intro")}>소개</button>}
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