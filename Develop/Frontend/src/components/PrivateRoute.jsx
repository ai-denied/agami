import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  // 로컬 스토리지가 아닌 쿠키의 accessToken 존재 여부로 인증 확인
  const isLogin = () => {
    return document.cookie.split('; ').some(row => row.startsWith('accessToken='));
  };
  
  // 인증되지 않았다면 로그인 페이지로 리다이렉트
  return isLogin ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;