import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import WaveBg from "../components/WaveBg";
import "../pages/Login.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const KakaoCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const hasCalled = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code || hasCalled.current) return;
    hasCalled.current = true;

    api.get(`/api/auth/kakao/callback`, { params: { code } })
      .then(async () => {
        await checkAuth();
        navigate("/", { replace: true });
      })
      .catch((err) => {
        console.error("로그인 처리 실패:", err);
        navigate("/login");
      });
  }, [searchParams, navigate, checkAuth]);

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
export default KakaoCallback;