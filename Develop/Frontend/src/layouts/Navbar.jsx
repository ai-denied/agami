import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import "./Navbar.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const Navbar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    try { 
      await api.post("/api/auth/logout"); 
    } catch (e) { 
      console.error(e); 
    }
    
    localStorage.removeItem("accessToken");
    window.location.href = "/"; 
  };

  return (
    <nav className="menu-bar">
      <div className="nav-container">
        <div className="nav-group left">
          <button className="home-logo-btn" onClick={() => navigate("/")}>
            <img src="/agami-home.svg" alt="Home" />
          </button>
          <div className="nav-links">
            {user && (
              <button className="nav-item" onClick={() => navigate("/mypage")}>마이페이지</button>
            )}
            <button className="nav-item" onClick={() => navigate("/price")}>가격</button>
            
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
              {/* 💡 모바일 환경에서는 이 영역이 CSS를 통해 자동 숨김 처리됩니다. */}
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
    </nav>
  );
};

export default Navbar;