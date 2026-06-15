import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const [isFirstVisit, setIsFirstVisit] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

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
          
          <button className="nav-item login-btn" onClick={() => navigate("/login")}>로그인</button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;