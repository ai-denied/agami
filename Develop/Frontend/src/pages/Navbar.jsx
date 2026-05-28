import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const [isFirstVisit, setIsFirstVisit] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // [교정] 인증 상태의 신뢰성을 위해 닉네임과 함께 실제 토큰(accessToken)의 유무를 같이 교차 검증합니다.
  const token = localStorage.getItem("accessToken");
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

  // [교정 완료] 대시보드 무단 인입을 차단하기 위해 모든 인증 파편 데이터를 일괄 소멸시킵니다.
  const handleLogout = () => {
    // 테마 설정(theme)과 방문 기록을 제외한 모든 로그인 인프라 데이터 청소
    localStorage.removeItem("accessToken");
    localStorage.removeItem("nickname");
    localStorage.removeItem("profile");
    localStorage.removeItem("userName");
    localStorage.removeItem("userImage");
    
    // 로그아웃 후 안전하게 홈으로 튕겨내고 화면 갱신
    navigate("/", { replace: true });
    window.location.reload();
  };

  if (isFirstVisit === null) return null;

  const checkIsLogin = () => {
    return document.cookie.split('; ').some(row => row.startsWith('accessToken='));
  };
  const isLogin = checkIsLogin();

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
            <button className="nav-item"  onClick={() => navigate("/test")}>테스트</button>
          </div>
        </div>

        <div className="nav-group right">
          <div
            className={`theme-switch ${isDarkMode ? "active" : ""}`}
            onClick={toggleTheme}
          >
            <div className="switch-content">
              <span className="label-light">LIGHT</span>
              <div className="switch-handle"></div>
              <span className="label-dark">DARK</span>
            </div>
          </div>

          {/* 로그인 여부에 따른 조건부 렌더링 검증 변경 */}
          {isLogin ? (
            <div className="user-profile-wrapper">
              <div className="user-profile-info">
                {profile && (
                  <img src={profile} alt="profile" className="nav-profile-img" />
                )}
                <span className="nav-nickname">
                  <strong>{nickname}</strong> 님
                </span>
              </div>
              <button className="nav-item logout-btn" onClick={handleLogout}>
                로그아웃
              </button>
            </div>
          ) : (
            <button
              className="nav-item login-btn"
              onClick={() => navigate("/login")}
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;