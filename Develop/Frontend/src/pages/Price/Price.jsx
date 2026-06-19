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
  
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const [alertModal, setAlertModal] = useState({ show: false, message: "" });
  const closeAlert = () => setAlertModal({ show: false, message: "" });
  const showAlert = (message) => setAlertModal({ show: true, message });

  const planHierarchy = { "basic": 1, "pro": 2, "enterprise": 3 };

  const handlePlanClick = async (plan) => {
    const planName = plan.name.toLowerCase();
    if (!user) { navigate(`/login?redirect=/price&plan=${planName}`); return; }

    const currentPlan = (user.plan || "basic").toLowerCase();

    if (planName === "enterprise") { showAlert("엔터프라이즈 요금제는 현재 준비 중입니다. 고객센터로 문의해주세요."); return; }
    if (planHierarchy[planName] < planHierarchy[currentPlan]) { showAlert("현재 이용 중인 요금제보다 하위 요금제로 다운그레이드할 수 없습니다."); return; }
    if (planName === currentPlan) { showAlert("이미 이용 중인 요금제입니다."); return; }

    if (planName === "pro") {
      try {
        const response = await api.post("/api/payment/ready");
        if (response.data.status === "success") {
          localStorage.setItem("kakao_tid", response.data.tid);
          window.location.href = response.data.next_redirect_pc_url; 
        }
      } catch (error) { console.error(error); showAlert("결제 준비 중 오류가 발생했습니다."); }
    }
  };

  const pricingPlans = [
    { name: "Basic", description: "개인 프로젝트 및 소규모 웹사이트를 위한 완벽한 시작", price: "0", features: ["월 10,000건 인증 제공", "손전등 캡챠 모델 이용 가능", "기본 트래픽 분석 대시보드", "1개 도메인 등록", "커뮤니티 기술 지원"], buttonText: "무료로 시작하기" },
    { name: "Pro", description: "성장하는 비즈니스와 전문 개발자를 위한 강력한 성능", price: "49,000", features: ["월 100,000건 인증 제공", "전체 캡챠 모델 무제한 제공", "심층 트래픽 및 공격 유형 분석", "최대 5개 도메인 등록", "우선 이메일 기술 지원"], buttonText: "Pro 플랜 선택" },
    { name: "Enterprise", description: "대규모 트래픽과 최고 수준의 보안이 필요한 기업", price: "문의", features: ["맞춤형 인증 한도 제공", "SLA 보장 및 전담 엔지니어", "커스텀 캡챠 모델 구축", "무제한 도메인 등록 지원", "24/7 연중무휴 핫라인 지원"], buttonText: "도입 문의하기" }
  ];

  // 💡 [핵심] 스크롤 비율을 계산해 0, 1, 2번째 닷을 정확히 활성화
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) return;
    const ratio = scrollLeft / maxScroll;
    const index = Math.round(ratio * (pricingPlans.length - 1));
    setActiveIndex(index);
  };

  return (
    <div className="pricing-wrapper">
      <WaveBg />
      <div className="pricing-content">
        <LiquidGlass style={{ padding: "50px 40px" }}>
          <div className="pricing-header">
            <h1>당신의 서비스에 맞는 요금제를 선택하세요</h1>
            <p>agami의 투명하고 합리적인 가격 정책</p>
          </div>
          
          <div className="pricing-container" ref={scrollRef} onScroll={handleScroll}>
            {pricingPlans.map((plan, index) => (
              <div key={index} className="price-card">
                <div className="card-top">
                  <h2 className="plan-name">{plan.name}</h2>
                  <p className="plan-desc">{plan.description}</p>
                  <div className="plan-price">
                    {plan.price !== "문의" && <span className="currency\">₩</span>}
                    <span className="amount">{plan.price}</span>
                    {plan.price !== "문의" && <span className="period\">/월</span>}
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
          
          <div className="mobile-slider-dots">
            {pricingPlans.map((_, i) => (
              <span key={i} className={`dot ${activeIndex === i ? 'active' : ''}`} />
            ))}
          </div>
        </LiquidGlass>
      </div>

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