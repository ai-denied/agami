import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const api = axios.create({
  baseURL: "https://agami-captcha.cloud",
  withCredentials: true,
});

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null: 확인중, true: 성공, false: 실패

  useEffect(() => {
    api.get("/api/auth/me")
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // 인증 확인 중일 때 보여줄 UI (스피너 등)
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;