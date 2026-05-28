import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import WaveBg from "../components/WaveBg";
import "../pages/Login.css";
import { motion } from "framer-motion";

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
      .catch(() => navigate("/login"));
  }, [searchParams, navigate, checkAuth]);

  return (
    <div className="login-wrapper">
      <WaveBg />
      <motion.img src="/agami-fish.svg" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }} />
    </div>
  );
};
export default KakaoCallback;