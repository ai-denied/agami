import React from 'react';
import { motion } from 'framer-motion';
import WaveBg from '../components/WaveBg';
import LiquidGlass from '../components/LiquidGlass';
import './Login.css';

const Login = () => {
  // 카카오 로그인 핸들러
  const handleKakaoLogin = () => {
    const REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
    const REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;
    
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  };

  // 구글 로그인 핸들러 추가
  const handleGoogleLogin = () => {
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
    
    // 구글은 권한(scope) 명시가 필수적입니다.
    const scope = "email profile";
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}`;
    
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="login-wrapper">
      <WaveBg />

      <LiquidGlass
        style={{
          position: 'relative',
          zIndex: '10',
          width: '90%',
          maxWidth: '420px',
          background: 'var(--login-bg)', 
          backdropFilter: 'blur(10px)',
          padding: '60px 45px',
          borderRadius: '32px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
          transition: 'background 0.3s ease, color 0.3s ease'
        }}
      >
        <div className="login-header">
          <img src="/agami-text.png" alt="Agami Logo" className="login-logo" />
          <p className="login-subtitle">봇은 틈새 없이, 유저는 끊김 없이.</p>
        </div>

        <div className="login-buttons">
          <button className="kakao-btn-wrapper" onClick={handleKakaoLogin}>
            <img 
              src="/kakao_login_large_wide.png" 
              alt="카카오 로그인" 
              className="kakao-login-img"
            />
          </button>
          
          {/* 구글 로그인 버튼에 핸들러 연결 */}
          <button className="login-btn google" onClick={handleGoogleLogin}>
            <img src="/google-icon.svg" alt="Google" className="btn-icon" />
            <span>구글로 시작하기</span>
          </button>
        </div>

        <p className="login-footer">Agami의 지능형 보안 서비스를 만나보세요.</p>
      </LiquidGlass>
    </div>
  );
};

export default Login;