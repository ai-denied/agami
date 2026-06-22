import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import "./Navbar.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const Navbar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

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
                {/* 💡 요청하신 대로 닉네임을 제거하고 프로필 사진만 단독 표기합니다. */}
                <img 
                  src={user.profile || '/agami-profile.png'} 
                  alt="profile" 
                  className="nav-profile-img" 
                  onError={(e) => { e.target.src = '/agami-profile.png'; }} 
                />
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