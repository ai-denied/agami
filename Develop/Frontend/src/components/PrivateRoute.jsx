import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  
  // 토큰이 없으면 로그인 페이지로 강제 이동
  return token ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;