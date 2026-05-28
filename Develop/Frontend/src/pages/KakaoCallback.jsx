import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import WaveBg from "../components/WaveBg";
import "../pages/Login.css";

// 쿠키를 포함하여 통신하기 위한 axios 인스턴스 생성
const api = axios.create({
  baseURL: "https://agami-captcha.cloud", // baseURL을 명시적으로 지정하는 것이 안전합니다.
  withCredentials: true,
});

const KakaoCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("code");
  const hasCalled = useRef(false);

  useEffect(() => {
    if (!code || hasCalled.current) return;
    hasCalled.current = true;

    // 생성한 api 인스턴스 사용
    api.get(`/api/auth/kakao/callback`, { params: { code } })
      .then((res) => {
        const { data } = res;

        if (data.status === "success") {
          // 토큰은 쿠키에 자동 저장되므로 저장 불필요
          localStorage.setItem("nickname", data.user.nickname);
          localStorage.setItem("userName", data.user.nickname);

          const rawProfile = data.user.profile;
          if (rawProfile) {
            const secureProfile = rawProfile.replace(/^http:\/\//i, "https://");
            localStorage.setItem("profile", secureProfile);
            localStorage.setItem("userImage", secureProfile);
          }

          navigate("/", { replace: true });
        } else {
          navigate("/login");
        }
      })
      .catch((err) => {
        console.error("로그인 처리 실패:", err);
        navigate("/login");
      });
  }, [code, navigate]);

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