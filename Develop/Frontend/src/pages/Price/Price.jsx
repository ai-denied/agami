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

  const [alertModal, setAlertModal] = useState({ show: false, message: "" });
  const closeAlert = () => setAlertModal({ show: false, message: "" });
  const showAlert = (message) => setAlertModal({ show: true, message });

  // 💡 [수정] 모바일 슬라이더 위치 추적용 상태
  const [activeSlide, setActiveSlide] = useState(0);

  const planHierarchy = { "basic": 1, "pro": 2, "enterprise": 3 };

  const handlePlanClick = async (plan) => {
    const planName = plan.name.toLowerCase();
    if (!user) { navigate(`/login?redirect=/price&plan=${planName}`); return; }

    const currentPlan = (user.plan || "basic").toLowerCase();

    if (planName === "enterprise") {
      showAlert("엔터프라이즈 요금제는 현재 준비 중입니다. 고객센터로 문의해 주세요."); return;
    }
    if (planName === "basic") {
      showAlert("현재 사용 중인 기본 요금제입니다."); return;
    }
    if (planHierarchy[planName] <= planHierarchy[currentPlan]) {
      showAlert("현재 이용 중인 요금제와 같거나 낮은 요금제로는 변경할 수 없습니다."); return;
    }

    if (planName === "pro") {
      try {
        const response = await api.post("/api/payment/ready");
        if (response.data.status === "success") {
          localStorage.setItem("kakao_tid", response.data.tid);
          window.location.href = response.data.next_redirect_pc_url;
        }
      } catch (err) {
        console.error(err);
        showAlert("결제 준비 중 오류가 발생했습니다. 다시 시도해 주세요.");
      }
    }
  };

  const plans = [
    { name: "Basic", price: "0", description: "개인 및 소규모 프로젝트용", features: ["월 10,000건 인증 무료", "기본 위젯 제공", "이메일 지원"], buttonText: "현재 요금제" },
    { name: "Pro", price: "49,000", description: "스타트업 및 성장하는 비즈니스용", features: ["월 100,000건 인증", "대시보드 분석 기능", "우선 지원", "커스텀 테마"], buttonText: "Pro로 업그레이드", highlight: true },
    { name: "Enterprise", price: "문의", description: "대규모 트래픽 및 맞춤형 솔루션", features: ["무제한 인증", "전담 엔지니어 지원", "SLA 보장", "On-Premise 옵션"], buttonText: "문의하기" }
  ];

  // 💡 [수정] 가로 스크롤 시 점(Dot) 위치 업데이트
  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.clientWidth;
    setActiveSlide(Math.round(scrollLeft / width));
  };

  return (
    <div className="pricing-wrapper">
      <WaveBg />
      <div className="pricing-content">
        <div className="pricing-header">
          <h1>Agami 요금제 안내</h1>
          <p>비즈니스 규모에 맞는 최적의 플랜을 선택하세요.</p>
        </div>

        <LiquidGlass style={{ width: '100%', padding: '0', background: 'transparent', boxShadow: 'none', border: 'none' }}>
          {/* 💡 [수정] 스크롤 이벤트 연결 */}
          <div className="pricing-container" onScroll={handleScroll}>
            {plans.map((plan, index) => (
              <div key={index} className={`price-card ${plan.highlight ? 'highlight' : ''}`}>
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
          
          {/* 💡 [수정] 모바일용 슬라이더 인디케이터 (Dot) */}
          <div className="mobile-pagination-dots">
            {plans.map((_, i) => (
              <span key={i} className={`dot ${activeSlide === i ? 'active' : ''}`} />
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