import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import "./Price.css";
import BubbleBtn from "@/components/BubbleBtn/BubbleBtn";
import LiquidGlass from "@/components/LiquidGlass/LiquidGlass";
import WaveBg from "@/components/WaveBg/WaveBg";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const Price = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); 

  // 커스텀 알림 모달 상태 관리
  const [alertModal, setAlertModal] = useState({ show: false, message: "" });
  const closeAlert = () => setAlertModal({ show: false, message: "" });
  const showAlert = (message) => setAlertModal({ show: true, message });

  // 💡 모바일 슬라이더 관련 상태 및 Ref 추가
  const [activeSlide, setActiveSlide] = useState(0);
  const containerRef = useRef(null);

  // 요금제 등급 (비교용)
  const planHierarchy = {
    "basic": 1,
    "pro": 2,
    "enterprise": 3
  };

  const handlePlanClick = async (plan) => {
    const planName = plan.name.toLowerCase();

    if (!user) {
      navigate(`/login?redirect=/price&plan=${planName}`);
      return;
    }

    // 현재 유저의 플랜 (없으면 기본값 'basic')
    const currentPlan = (user.plan || "basic").toLowerCase();

    // 1. 엔터프라이즈 문의하기 처리
    if (planName === "enterprise") {
      showAlert("엔터프라이즈 요금제는 고객센터를 통해 맞춤형으로 제공됩니다.\nsupport@agami.com으로 문의해주세요.");
      return;
    }

    // 2. 이미 사용 중이거나 하위 플랜인 경우 차단
    if (planHierarchy[planName] === planHierarchy[currentPlan]) {
      showAlert(`이미 ${plan.name} 플랜을 사용 중입니다.`);
      return;
    }
    
    if (planHierarchy[planName] < planHierarchy[currentPlan]) {
      const currentPlanDisplay = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);
      showAlert(`현재 상위 요금제인 ${currentPlanDisplay} 플랜을 사용 중입니다.\n다운그레이드는 마이페이지에서 신청해주세요.`);
      return;
    }

    // 3. Pro 결제 진행 (Basic -> Pro)
    if (planName === "pro") {
      try {
        const response = await api.post("/api/payment/ready");
        if (response.data.status === "success") {
          localStorage.setItem("kakao_tid", response.data.tid);
          window.location.href = response.data.next_redirect_pc_url;
        }
      } catch (error) {
        console.error("결제 준비 실패:", error);
        showAlert("결제 서버와 통신 중 오류가 발생했습니다.");
      }
    }
  };

  // 💡 컨테이너 스크롤 시 현재 인덱스 계산 로직
  const handleScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const card = container.children[0];
    if (!card) return;
    
    const style = window.getComputedStyle(container);
    const gap = parseFloat(style.gap) || 0;
    const itemWidth = card.offsetWidth + gap;
    const newIndex = Math.round(container.scrollLeft / itemWidth);
    
    if (newIndex !== activeSlide) {
      setActiveSlide(newIndex);
    }
  };

  // 💡 하단 점 클릭 시 해당 카드로 스크롤 이동
  const scrollToSlide = (index) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const card = container.children[0];
    if (!card) return;

    const style = window.getComputedStyle(container);
    const gap = parseFloat(style.gap) || 0;
    const itemWidth = card.offsetWidth + gap;

    container.scrollTo({ left: index * itemWidth, behavior: "smooth" });
    setActiveSlide(index);
  };

  const plans = [
    { name: "Basic", price: "0", description: "개인 개발자 및 테스트용", features: ["월 1,000회 무료 호출", "표준 캡챠 유형 제공", "기본 분석 데이터"], buttonText: "무료로 시작하기" },
    { name: "Pro", price: "49,000", description: "성장하는 비즈니스를 위한 최적의 선택", features: ["월 100,000회 호출", "모든 캡챠 유형 제공", "상세 분석 대시보드", "도메인 화이트리스트"], buttonText: "Pro 시작하기" },
    { name: "Enterprise", price: "문의", description: "대규모 트래픽 및 커스텀 보안", features: ["호출 횟수 무제한", "커스텀 CAPTCHA 생성", "관리자 대시보드 제공", "실시간 공격 모니터링", "온프레미스 구축 지원"], buttonText: "영업팀 문의" },
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

          <div 
            className="pricing-container" 
            ref={containerRef} 
            onScroll={handleScroll}
          >
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
                  {plan.features.map((feature, i) => <li key={i}>{feature}</li>)}
                </ul>
                <div className="btn-wrapper">
                  <BubbleBtn variant="primary" onClick={() => handlePlanClick(plan)}>
                    {plan.buttonText}
                  </BubbleBtn>
                </div>
              </div>
            ))}
          </div>

          {/* 💡 모바일 전용 슬라이드 인디케이터 (PC에서는 CSS로 숨김 처리) */}
          <div className="slider-dots">
            {plans.map((_, index) => (
              <div
                key={index}
                className={`slider-dot ${activeSlide === index ? "active" : ""}`}
                onClick={() => scrollToSlide(index)}
              />
            ))}
          </div>
        </LiquidGlass>
      </div>

      {/* 자체 Alert 모달 */}
      {alertModal.show && (
        <div className="custom-sys-modal-overlay" onClick={closeAlert}>
          <div className="custom-sys-modal-box" onClick={e => e.stopPropagation()}>
            <div className="custom-sys-modal-text">{alertModal.message}</div>
            <div className="custom-sys-modal-actions">
              <button className="btn-sys-ok" onClick={closeAlert}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Price;