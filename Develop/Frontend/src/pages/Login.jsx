import React from 'react';
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

  // 구글 로그인 핸들러
  const handleGoogleLogin = () => {
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
    
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
          {/* 카카오 로그인 버튼 */}
          <button className="kakao-btn-wrapper" onClick={handleKakaoLogin}>
            <img 
              src="/kakao_login_large_wide.png" 
              alt="카카오 로그인" 
              className="kakao-login-img"
            />
          </button>
          
          {/* 구글 공식 가이드라인 버튼 적용 */}
          <button className="gsi-material-button" onClick={handleGoogleLogin}>
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              {/* 표시 텍스트 수정 */}
              <span className="gsi-material-button-contents">Google 계정으로 로그인</span>
              <span style={{ display: 'none' }}>Google 계정으로 로그인</span>
            </div>
          </button>
        </div>

        <p className="login-footer">Agami의 지능형 보안 서비스를 만나보세요.</p>
      </LiquidGlass>
    </div>
  );
};

export default Login;