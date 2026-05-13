import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 1. 현재 세션에 방문 기록이 있는지 확인합니다.
    const hasVisited = sessionStorage.getItem('hasVisitedSession');
    
    if (!hasVisited) {
      // 2. 첫 방문이라면 무조건 라이트 모드(false)를 반환하고 세션 기록을 남깁니다.
      sessionStorage.setItem('hasVisitedSession', 'true');
      return false;
    }

    // 3. 첫 방문이 아니라면(새로고침 등) 기존대로 localStorage를 확인합니다.
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    // 테마 상태에 따라 body 클래스와 localStorage 동기화
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);