import { useNavigate } from "react-router-dom";
import React from "react";
import "./price.css";
import BubbleBtn from "../components/BubbleBtn";
import WaveBg from "../components/WaveBg";
import LiquidGlass from "../components/LiquidGlass";

const PricePage = () => {
  const navigate = useNavigate();

  const handlePlanClick = (plan) => {
    const planName = plan.name.toLowerCase();

    // JWT 존재 여부 확인
    const token = localStorage.getItem("accessToken");

    // 로그인 안 된 경우
    if (!token) {
      navigate(`/login?redirect=/checkout&plan=${planName}`);
      return;
    }

    // 로그인 된 경우
    navigate(`/checkout?plan=${planName}`);
  };

  const plans = [
    {
      name: "Basic",
      price: "0",
      description: "개인 개발자 및 테스트용",
      features: [
        "월 1,000회 무료 호출",
        "표준 캡챠 유형 제공",
        "기본 분석 데이터",
      ],
      buttonText: "무료로 시작하기",
    },
    {
      name: "Pro",
      price: "49,000",
      description: "성장하는 비즈니스를 위한 최적의 선택",
      features: [
        "월 100,000회 호출",
        "모든 캡챠 유형 제공",
        "상세 분석 대시보드",
        "도메인 화이트리스트",
      ],
      buttonText: "Pro 시작하기",
    },
    {
      name: "Enterprise",
      price: "문의",
      description: "대규모 트래픽 및 커스텀 보안",
      features: [
        "호출 횟수 무제한",
        "커스텀 CAPTCHA 생성",
        "관리자 대시보드 제공",
        "실시간 공격 모니터링",
        "온프레미스 구축 지원",
      ],
      buttonText: "영업팀 문의",
    },
  ];

  return (
    <div className="pricing-wrapper">
      <WaveBg />
      <div className="pricing-content">
        {/* 인라인 백그라운드 스타일을 제거하여 CSS 변수가 적용되도록 함 */}
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
                    {plan.price !== "문의" && (
                      <span className="currency">₩</span>
                    )}
                    <span className="amount">{plan.price}</span>
                    {plan.price !== "문의" && (
                      <span className="period">/월</span>
                    )}
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

export default PricePage;
