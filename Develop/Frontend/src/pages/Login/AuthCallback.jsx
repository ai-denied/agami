import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom"; // useParams 추가
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import WaveBg from "../../components/WaveBg/WaveBg";
import "../pages/Login.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const AuthCallback = () => {
  const { provider } = useParams(); // URL에서 'kakao' 또는 'google' 추출
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const hasCalled = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    
    // provider가 없거나 코드가 없으면 방어 코드로 차단
    if (!code || !provider || hasCalled.current) return;
    hasCalled.current = true;

    // provider 변수를 사용하여 백엔드 엔드포인트를 동적으로 지정합니다.
    // 백엔드에는 /api/auth/kakao/callback 과 /api/auth/google/callback 이 준비되어 있어야 합니다.
    api.get(`/api/auth/${provider}/callback`, { params: { code } })
      .then(async () => {
        await checkAuth();
        navigate("/", { replace: true });
      })
      .catch((err) => {
        console.error(`${provider} 로그인 처리 실패:`, err);
        navigate("/login");
      });
  }, [searchParams, navigate, checkAuth, provider]);

  return (
    <div className="login-wrapper">
      <WaveBg />
      <div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
        <motion.img
          src="/agami-fish.svg"
          alt="Loading..."
          style={{ width: "80px", height: "auto" }}
          animate={{ rotate: 360, y: [0, -15, 0] }}
          transition={{
            rotate: { repeat: Infinity, duration: 2, ease: "linear" },
            y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
          }}
        />
      </div>
    </div>
  );
};

export default AuthCallback;