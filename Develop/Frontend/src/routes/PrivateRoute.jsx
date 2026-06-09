import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // 로딩이 끝났는데 user가 null인지 확인하는 로그
    if (!loading) {
      console.log("PrivateRoute - 현재 인증 상태:", user ? "로그인됨" : "로그인 안 됨");
      if (!user) console.warn("대시보드 접근 차단됨. user가 null입니다.");
    }
  }, [user, loading]);
  
  if (loading) return <div className="loading-spinner">보안 인증 중...</div>;
  
  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;