import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import WaveBg from "../components/WaveBg";
import "../pages/Login.css"; // 기존 로그인 스타일 재사용

const KakaoCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("code");
  const hasCalled = useRef(false);

  useEffect(() => {
    if (!code || hasCalled.current) return;
    hasCalled.current = true;

    fetch(`http://localhost:8000/auth/kakao/callback?code=${code}`)
      .then((res) => {
        if (!res.ok) throw new Error("서버 응답 에러");
        return res.json();
      })
      .then((data) => {
        if (data.status === "success") {
          // JWT 저장
          localStorage.setItem("accessToken", data.accessToken);

          // 유저 정보 저장
          localStorage.setItem("nickname", data.user.nickname);
          localStorage.setItem("profile", data.user.profile);

          // 홈으로 이동
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
      {/* 로그인 화면과 동일한 파도 배경 */}
      <WaveBg />

      <div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
        {/* 물고기 로고 애니메이션 */}
        <motion.img
          src="/agami-fish.svg"
          alt="Loading..."
          style={{ width: "80px", height: "auto" }}
          animate={{
            rotate: 360,
            y: [0, -15, 0], // 위아래로 살짝 떠있는 듯한 효과 추가
          }}
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
