import React, { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const hasCalled = useRef(false);

  useEffect(() => {
    const pgToken = searchParams.get("pg_token");
    const tid = localStorage.getItem("kakao_tid");

    if (!pgToken || !tid || hasCalled.current) return;
    hasCalled.current = true;

    api.post("/api/payment/approve", { tid, pg_token: pgToken })
      .then(async () => {
        localStorage.removeItem("kakao_tid");
        await checkAuth(); // 유저 Plan 갱신
        alert("결제가 완료되었습니다!");
        navigate("/mypage/settings", { replace: true });
      })
      .catch((err) => {
        console.error(err);
        alert("결제 승인 실패");
        navigate("/price");
      });
  }, [searchParams, navigate, checkAuth]);

  return <div style={{padding: '100px', textAlign: 'center'}}>결제 승인 중...</div>;
};

export default PaymentSuccess;