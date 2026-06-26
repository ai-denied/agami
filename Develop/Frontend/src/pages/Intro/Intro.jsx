import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Scrollbar from "@/components/Scrollbar/Scrollbar";
import BubbleBtn from "@/components/BubbleBtn/BubbleBtn";
import './Intro.css';

// 💡 전체 사이드바 메뉴 목차
const MENU_ITEMS = [
  { id: 'intro', title: '서비스 소개' },
  { id: 'handlight', title: '손전등 캡챠' },
  { id: 'face', title: '안면 인식 캡챠' },
  { id: 'emotion', title: '감정 추론 캡챠' },
];

// 캡챠 상세 데이터
const CAPTCHA_TYPES = [
  { id: 'handlight', title: '손전등 캡챠', desc: '어둠 속에 숨겨진 물건을 손전등 불빛으로 찾아내는 방식입니다. 마우스의 이동 궤적, 클릭 패턴 등을 분석하여 사람의 자연스러운 움직임인지 판별합니다.' },
  { id: 'face', title: '안면 인식 캡챠', desc: '사용자의 얼굴 형태를 인식하여 실사용자인지 확인합니다. 단순한 이미지가 아닌 3D 라이브니스(Liveness)를 분석하여 우회 공격을 방어합니다.' },
  { id: 'emotion', title: '감정 추론 캡챠', desc: '주어진 상황(Context)에 맞는 적절한 표정을 지어 인증을 완료하는 고도화된 방식입니다. 감정 분석 AI가 사용자의 표정 변화를 실시간으로 추론합니다.' },
];

const Intro = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(MENU_ITEMS[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const sectionRefs = useRef({});

  useEffect(() => {
    const scrollContainer = document.querySelector('.main-content');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { 
        root: scrollContainer, 
        rootMargin: "-10% 0px -60% 0px", 
        threshold: 0 
      }
    );

    MENU_ITEMS.forEach(item => {
      const el = sectionRefs.current[item.id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    setIsSidebarOpen(false); 
    setActiveSection(id);
    const element = sectionRefs.current[id];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="page-wrapper">
      <div className="layout-container">
        
        <button 
          className="mobile-sidebar-toggle" 
          onClick={() => setIsSidebarOpen(true)}
          aria-label="메뉴 열기"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div 
          className={`mobile-sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} 
          onClick={() => setIsSidebarOpen(false)} 
        />

        <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header-mobile">
            <h3>목차</h3>
            <button className="mobile-sidebar-close" onClick={() => setIsSidebarOpen(false)}>✕</button>
          </div>
          <ul>
            {MENU_ITEMS.map((item) => (
              <li 
                key={item.id} 
                className={activeSection === item.id ? 'active' : ''}
                onClick={() => scrollToSection(item.id)}
              >
                {item.title}
              </li>
            ))}
          </ul>
        </nav>

        <Scrollbar className="main-content">
          <div className="intro-sections-wrapper">

            <form method="POST">
              <div class="h-captcha" data-sitekey="9e944bae-7242-4dc4-8126-79021bf05650"></div>
              <script src="https://js.hcaptcha.com/1/api.js" async defer></script>
            </form>
            
            {/* 1. 서비스 소개 및 MLOps / AI 모델링 섹션 */}
            <section 
              id="intro"
              ref={(el) => (sectionRefs.current['intro'] = el)}
              className="captcha-description"
            >
              {/* 💡 agami 로고 이미지 추가 (반응형 & 원형 유지 CSS 클래스 적용) */}
              <div className="intro-logo-wrapper">
                <img 
                  src="/agami.png" 
                  alt="agami logo" 
                  className="intro-logo-img"
                />
              </div>

              <h2 className="content-title">서비스 소개</h2>
              <p className="content-desc">
                <strong>agami(아가미)</strong>는 악성 봇(Bot)의 접근은 완벽하게 차단하고, 실제 사용자에겐 끊김 없는 경험을 제공하는 차세대 지능형 캡챠(CAPTCHA) 서비스입니다. 기존의 번거로운 이미지 찾기나 텍스트 입력 방식을 탈피하여, 마우스 움직임, 표정, 상황 인지 등 사용자의 자연스러운 행동 패턴을 AI가 실시간으로 분석해 인증을 수행합니다.
              </p>

              <div className="sub-section">
                <h3 className="sub-title">지능형 캡챠 AI 모델링</h3>
                <p className="content-desc">
                  agami의 핵심 경쟁력은 사용자의 행동과 생체 데이터를 정밀하게 분석하여 봇(Bot)을 식별하는 독자적인 AI 모델에 있습니다. 손전등 캡챠는 마우스의 이동 좌표, 속도, 방향 등의 시계열 데이터를 <strong>GRU(Gated Recurrent Unit)</strong> 모델로 분석하여 사람 특유의 자연스러운 움직임을 판별합니다. 안면 인식 캡챠는 MediaPipe와 OpenCV를 활용해 얼굴 랜드마크와 프레임별 미세한 변화를 추적하며, 사진이나 영상을 통한 위조 공격을 방어하는 라이브니스(Liveness) 검증을 수행합니다.
                </p>
                <p className="content-desc">
                  특히 감정 추론 캡챠의 경우, 보안성을 극대화하기 위해 자체적인 <strong>'AI 공격 시뮬레이션'</strong>을 도입했습니다. ResNet-18 및 최신 비전 언어 모델(Qwen2.5-VL)을 활용해 7,700여 개의 캡챠 문제를 직접 풀게 한 뒤, AI가 쉽게 정답을 맞히는 취약한 문제들은 자동으로 걸러냅니다. 이를 통해 '사람에게는 직관적이고 쉽지만, AI에게는 매우 어려운' 최적의 문제들만 선별하여 최종 문제은행을 구축했습니다.
                </p>
                <p className="content-desc">
                  이러한 행동 분석, 얼굴 라이브니스, 상황 추론 모델의 학습 및 대규모 검증은 PyTorch 프레임워크와 NVIDIA T4 GPU 기반의 CUDA 환경에서 수행되어 가장 견고한 캡챠 시스템을 완성했습니다.
                </p>
              </div>

              <div className="sub-section">
                <h3 className="sub-title">agami MLOps 파이프라인</h3>
                <p className="content-desc">
                  agami MLOps는 마우스 제스처 기반 봇 탐지, 얼굴 라이브니스 인식, 컨텍스트 감정 인식 등 다양한 AI 모델을 안정적으로 운영하기 위한 머신러닝 파이프라인입니다. 수집된 원시 데이터는 먼저 검증 단계를 거쳐 결측치나 이상치 같은 품질 문제를 점검하고, 이후 모델이 학습할 수 있는 형태로 피처를 추출하고 정규화하는 전처리 과정을 거칩니다. 정제된 데이터로 모델을 학습시킨 뒤에는 정확도, 오탐률 등 다양한 지표로 성능을 평가하며, 이 평가를 통과한 모델만 다음 단계로 넘어갈 수 있습니다.
                </p>
                <p className="content-desc">
                  평가를 마친 신규 모델은 곧바로 운영에 반영되지 않고, 현재 서비스 중인 모델과 성능을 비교하여 더 나은 경우에만 정식 모델로 승격됩니다. 승격이 확정되면 모델은 가볍고 빠른 추론에 적합한 형태로 변환되어 자동으로 빌드되고, 쿠버네티스 클러스터에 배포되어 실시간 API 서버를 통해 서비스에 적용됩니다. 이처럼 데이터 검증부터 전처리, 학습, 평가, 모델 승격, 빌드·배포까지 모든 과정이 자동화된 파이프라인으로 연결되어 있어, 사람의 개입을 최소화하면서도 안정적이고 신뢰할 수 있는 AI 서비스 운영이 가능합니다.
                </p>
                
                {/* 💡 MLOps 파이프라인 이미지 추가 */}
                <div style={{ marginTop: '24px', width: '100%' }}>
                  <img 
                    src="/ML-Architecture.png" 
                    alt="MLOps 파이프라인 아키텍처 다이어그램" 
                    style={{ width: '100%', height: 'auto', borderRadius: '16px', border: '1px solid #e0e7f3', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }} 
                  />
                </div>
              </div>
            </section>

            {/* 2. 캡챠 종류 설명 섹션 */}
            {CAPTCHA_TYPES.map((type) => (
              <section 
                key={type.id} 
                id={type.id}
                ref={(el) => (sectionRefs.current[type.id] = el)}
                className="captcha-description" 
              >
                <h2 className="content-title">
                  {type.title}
                </h2>
                <p className="content-desc">
                  {type.desc}
                </p>
                
                <div className="intro-image-placeholder">
                  {type.id === 'handlight' && <span>[손전등 캡챠 데모 소개 사진 / 영상]</span>}
                  {type.id === 'face' && <span>[안면 인식 캡챠 데모 소개 사진 / 영상]</span>}
                  {type.id === 'emotion' && <span>[감정 추론 캡챠 데모 소개 사진 / 영상]</span>}
                </div>
              </section>
            ))}

            <div className="intro-footer-action">
              <BubbleBtn variant="fill" onClick={() => navigate("/price")}>
                시작하기
              </BubbleBtn>
            </div>
          </div>
        </Scrollbar>

      </div>
    </div>
  );
};

export default Intro;