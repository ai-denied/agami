import React, { useState } from "react";
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
  const isMobile = window.innerWidth <= 768; // 모바일 감지

  const [alertModal, setAlertModal] = useState({ show: false, message: "" });
  const closeAlert = () => setAlertModal({ show: false, message: "" });
  const showAlert = (message) => setAlertModal({ show: true, message });

  // 💡 [추가] 모바일 가로 스크롤 도트(Dot) 연동 상태
  const [activeSlide, setActiveSlide] = useState(0);

  const planHierarchy = { "basic": 1, "pro": 2, "enterprise": 3 };

  const handlePlanClick = async (plan) => {
    const planName = plan.name.toLowerCase();
    if (!user) { navigate(`/login?redirect=/price&plan=${planName}`); return; }

    const currentPlan = (user.plan || "basic").toLowerCase();

    if (planName === "enterprise") {
      showAlert("엔터프라이즈 요금제는 현재 준비 중입니다. 고객센터로 문의해 주세요.");
      return;
    }
    if (planName === "basic") {
      showAlert("현재 이미 Basic 요금제를 이용 중입니다.");
      return;
    }
    if (planHierarchy[currentPlan] >= planHierarchy[planName]) {
      showAlert(`이미 ${user.plan} 요금제를 이용 중이므로 하위 요금제로 변경할 수 없습니다.`);
      return;
    }

    try {
      const response = await api.post("/api/payment/ready");
      if (response.data.status === "success") {
        localStorage.setItem("kakao_tid", response.data.tid);
        window.location.href = response.data.next_redirect_pc_url;
      }
    } catch (error) {
      console.error(error);
      showAlert("결제 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const plans = [
    { name: "Basic", price: "0", period: "/월", description: "개인 프로젝트 및 소규모 웹사이트를 위한 기본 캡챠 서비스", buttonText: "현재 요금제", features: ["월 10,000회 검증 무료", "기본 손전등 캡챠 모델 지원", "커뮤니티 지원"] },
    { name: "Pro", price: "49,000", period: "/월", description: "전문적인 보안이 필요한 기업 및 성장하는 서비스를 위한 고급 솔루션", buttonText: "Pro로 업그레이드", features: ["월 500,000회 검증 제공", "모든 캡챠 모델(안면, 감정 등) 완벽 지원", "우선 이메일 기술 지원", "상세 트래픽 분석 대시보드"] },
    { name: "Enterprise", price: "문의", period: "", description: "대규모 트래픽과 완벽한 맞춤형 보안 정책이 필요한 대기업용 플랜", buttonText: "도입 문의하기", features: ["무제한 검증 및 SLA 보장", "고객사 맞춤형 캡챠 모델 학습", "전담 엔지니어 24/7 지원", "On-Premise 구축 지원"] }
  ];

  return (
    <div className="pricing-wrapper">
      <WaveBg />
      <div className="pricing-content">
        <LiquidGlass style={{ width: "90%", maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "20px" : "60px 40px" }}>
          
          <div className="pricing-header">
            <h1>합리적인 가격으로 강력한 보안을 도입하세요</h1>
            <p>agami는 서비스의 규모에 맞는 최적의 플랜을 제공합니다.</p>
          </div>
          
          {/* 💡 [추가] 모바일 가로 스크롤 이벤트 연결 */}
          <div className="pricing-container" onScroll={(e) => {
            const idx = Math.round(e.target.scrollLeft / e.target.offsetWidth);
            setActiveSlide(idx);
          }}>
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
                  <BubbleBtn variant="primary" onClick={() => handlePlanClick(plan)}>{plan.buttonText}</BubbleBtn>
                </div>
              </div>
            ))}
          </div>

          {/* 💡 [추가] 모바일에서만 노출되는 도트 슬라이드 인디케이터 */}
          {isMobile && (
            <div className="carousel-dots">
              {plans.map((_, i) => <span key={i} className={`dot ${i === activeSlide ? 'active' : ''}`} />)}
            </div>
          )}

        </LiquidGlass>
      </div>

      {alertModal.show && (
        <div className="custom-sys-modal-overlay" onClick={closeAlert}>
          <div className="custom-sys-modal-box" onClick={e => e.stopPropagation()}>
            <div className="custom-sys-modal-text">{alertModal.message}</div>
            <div className="custom-sys-modal-actions"><button className="btn-sys-ok" onClick={closeAlert}>확인</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Price;