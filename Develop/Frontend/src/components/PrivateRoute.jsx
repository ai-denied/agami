import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner">보안 인증 중...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;