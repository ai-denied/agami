import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // axios 추가
import "./Navbar.css";

// 서버와 통신할 API 인스턴스
const api = axios.create({
  baseURL: "https://agami-captcha.cloud",
  withCredentials: true,
});

const Navbar = () => {
  const [isFirstVisit, setIsFirstVisit] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  // 닉네임과 프로필 정보 로드
  const nickname = localStorage.getItem("userName") || localStorage.getItem("nickname");
  const profile = localStorage.getItem("userImage") || localStorage.getItem("profile");

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
    if (newTheme) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  };

  // [수정 완료] 백엔드 로그아웃 API 호출 및 로컬 데이터 소멸
  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout"); // 백엔드 쿠키 만료 요청
    } catch (error) {
      console.error("로그아웃 API 호출 실패:", error);
    } finally {
      // 로컬 데이터 정리
      localStorage.removeItem("nickname");
      localStorage.removeItem("profile");
      localStorage.removeItem("userName");
      localStorage.removeItem("userImage");
      
      // 로그아웃 후 홈으로 이동 및 새로고침
      window.location.href = "/";
    }
  };

  // 쿠키 존재 여부 확인 함수
  const checkLoginStatus = () => {
    return document.cookie.split('; ').some(row => row.startsWith('accessToken='));
  };

  if (isFirstVisit === null) return null;

  return (
    <motion.nav
      className="menu-bar"
      initial={isFirstVisit ? { opacity: 0, y: -100 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: isFirstVisit ? 4 : 0, duration: 1, ease: "easeOut" }}
    >
      <div className="nav-container">
        <div className="nav-group left">
          <button className="home-logo-btn" onClick={() => navigate("/")}>
            <img src="/agami-home.svg" alt="Home" />
          </button>
          <div className="nav-links">
            <button className="nav-item" onClick={() => navigate("/platform")}>대쉬보드</button>
            <button className="nav-item" onClick={() => navigate("/price")}>가격</button>
            <button className="nav-item" onClick={() => navigate("/test")}>테스트</button>
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

          {/* 수정: 함수 호출 방식으로 변경 */}
          {checkLoginStatus() ? (
            <div className="user-profile-wrapper">
              <div className="user-profile-info">
                {profile && <img src={profile} alt="profile" className="nav-profile-img" />}
                <span className="nav-nickname"><strong>{nickname}</strong> 님</span>
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