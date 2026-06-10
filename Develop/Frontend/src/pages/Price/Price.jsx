import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext"; // 로그인 상태를 가져오기 위해 추가
import "./Price.css";
import BubbleBtn from "@/components/BubbleBtn/BubbleBtn";
import LiquidGlass from "@/components/LiquidGlass/LiquidGlass";
import WaveBg from "@/components/WaveBg/WaveBg";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const Price = () => {
  const navigate = useNavigate();
  // AuthContext에서 user 정보를 가져옵니다.
  const { user } = useAuth(); 

  const handlePlanClick = async (plan) => {
    const planName = plan.name.toLowerCase();

    // 토큰 대신 user 객체가 있는지 확인하여 로그인 여부를 정확히 판별합니다.
    if (!user) {
      navigate(`/login?redirect=/price&plan=${planName}`);
      return;
    }

    // Pro 플랜 선택 시 카카오페이 결제 진행
    if (planName === "pro") {
      try {
        // 1. 백엔드에 결제 준비 요청
        const response = await api.post("/api/payment/ready");
        
        if (response.data.status === "success") {
          // 2. 카카오 결제 고유 번호 저장 (승인할 때 사용하기 위해 로컬에 임시 저장)
          localStorage.setItem("kakao_tid", response.data.tid);
          
          // 3. 카카오페이 결제창으로 페이지 이동
          window.location.href = response.data.next_redirect_pc_url;
        }
      } catch (error) {
        console.error("결제 준비 실패:", error);
        alert("결제 서버와 통신 중 오류가 발생했습니다.");
      }
    } else {
      // Basic이나 Enterprise는 다른 로직 처리
      alert(`${plan.name} 플랜이 선택되었습니다.`);
    }
  };

  const plans = [
    {
      name: "Basic",
      price: "0",
      description: "개인 개발자 및 테스트용",
      features: ["월 1,000회 무료 호출", "표준 캡챠 유형 제공", "기본 분석 데이터"],
      buttonText: "무료로 시작하기",
    },
    {
      name: "Pro",
      price: "49,000",
      description: "성장하는 비즈니스를 위한 최적의 선택",
      features: ["월 100,000회 호출", "모든 캡챠 유형 제공", "상세 분석 대시보드", "도메인 화이트리스트"],
      buttonText: "Pro 시작하기",
    },
    {
      name: "Enterprise",
      price: "문의",
      description: "대규모 트래픽 및 커스텀 보안",
      features: ["호출 횟수 무제한", "커스텀 CAPTCHA 생성", "관리자 대시보드 제공", "실시간 공격 모니터링", "온프레미스 구축 지원"],
      buttonText: "영업팀 문의",
    },
  ];

  return (
    <div className="pricing-wrapper">
      <WaveBg />
      <div className="pricing-content">
        <LiquidGlass>
          <div className="pricing-header">
            <h1>Pricing Plans</h1>
            <p>비즈니스의 규모에 맞는 최적의 플랜을 선택하세요.</p>
          </div>

          <div className="pricing-container">
            {plans.map((plan, index) => (
              <div key={index} className="price-card">
                <div className="card-top">
                  <h2 className="plan-name">{plan.name}</h2>
                  <p className="plan-desc">{plan.description}</p>
                  <div className="plan-price">
                    {plan.price !== "문의" && <span className="currency">₩</span>}
                    <span className="amount">{plan.price}</span>
                    {plan.price !== "문의" && <span className="period">/월</span>}
                  </div>
                </div>
                <ul className="feature-list">
                  {plan.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
                <div className="btn-wrapper">
                  <BubbleBtn
                    className="cta-button-shared"
                    variant="primary"
                    onClick={() => handlePlanClick(plan)}
                  >
                    {plan.buttonText}
                  </BubbleBtn>
                </div>
              </div>
            ))}
          </div>
        </LiquidGlass>
      </div>
    </div>
  );
};

export default Price;