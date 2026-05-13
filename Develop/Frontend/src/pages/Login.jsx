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
    
    // 카카오 인가 코드 요청 URL
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;
    
    // 현재 창을 카카오 로그인 페이지로 전환
    window.location.href = kakaoAuthUrl;
  };

  return (
    <div className="login-wrapper">
      {/* 분리된 파도 배경 컴포넌트 */}
      <WaveBg />

      <LiquidGlass
        style={{
          position: 'relative',
          zIndex: '10',
          width: '90%',
          maxWidth: '420px',
          // 고정된 rgba 대신 CSS 변수 사용
          background: 'var(--login-bg)', 
          backdropFilter: 'blur(10px)',
          padding: '60px 45px',
          borderRadius: '32px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
          transition: 'background 0.3s ease, color 0.3s ease' // 부드러운 전환
        }}
      >
        <div className="login-header">
          <img src="/agami-text.png" alt="Agami Logo" className="login-logo" />
          <p className="login-subtitle">봇은 틈새 없이, 유저는 끊김 없이.</p>
        </div>

        <div className="login-buttons">
          <button className="login-btn kakao" onClick={handleKakaoLogin}>
            <img src="/kakao-icon.svg" alt="Kakao" className="btn-icon" />
            <span>카카오로 시작하기</span>
          </button>
          
          <button className="login-btn google" onClick={() => console.log("Google Login")}>
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