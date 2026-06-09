import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom"; 
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import WaveBg from "@/components/WaveBg/WaveBg";
import "@/pages/Login/Login.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const AuthCallback = () => {
  const { provider } = useParams(); 
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const hasCalled = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    
    // provider가 없거나 코드가 없으면 방어 코드로 차단
    if (!code || !provider || hasCalled.current) return;
    hasCalled.current = true;

    // 백엔드 통신을 통한 로그인 처리
    api.get(`/api/auth/${provider}/callback`, { params: { code } })
      .then(async () => {
        await checkAuth();
        
        // ✅ 수정된 부분: Home("/")이 아닌 대시보드로 이동하도록 변경
        navigate("/mypage/dashboard", { replace: true });
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