import React, { useState, useRef, useEffect } from 'react';
import Scrollbar from "@/components/Scrollbar/Scrollbar";
import './Intro.css';

const CAPTCHA_TYPES = [
  { id: 'handlight', title: '손전등 캡챠', desc: '손전등의 빛을 조절하여 특정 영역을 맞추는 보안 검증 방식입니다.' },
  { id: 'face', title: '안면 인식 캡챠', desc: '사용자의 얼굴 형태를 인식하여 실사용자인지 확인합니다.' },
  { id: 'emotion', title: '감정 추론 캡챠', desc: '표정을 통해 나타나는 감정을 분석하여 인증을 완료합니다.' },
];

const Intro = () => {
  const [activeSection, setActiveSection] = useState(CAPTCHA_TYPES[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 각 섹션의 DOM 위치를 기억하기 위한 Ref
  const sectionRefs = useRef({});

  // 💡 스크롤을 감지하여 현재 화면에 보이는 섹션으로 사이드바 Active 상태를 자동 변경 (Scroll Spy)
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
        root: scrollContainer, // 스크롤이 발생하는 컨테이너 기준
        rootMargin: "-10% 0px -60% 0px", // 화면 상단 10~40% 지점을 지날 때 감지
        threshold: 0 
      }
    );

    CAPTCHA_TYPES.forEach(type => {
      const el = sectionRefs.current[type.id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // 💡 사이드바 메뉴 클릭 시 해당 섹션으로 부드럽게 스크롤 이동
  const scrollToSection = (id) => {
    setIsSidebarOpen(false); // 모바일 메뉴 자동 닫기
    setActiveSection(id);
    const element = sectionRefs.current[id];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="page-wrapper">
      <div className="layout-container">
        
        {/* 모바일 전용 토글 버튼 */}
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

        {/* 모바일 전용 오버레이 */}
        <div 
          className={`mobile-sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} 
          onClick={() => setIsSidebarOpen(false)} 
        />

        <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header-mobile">
            <h3>캡챠 종류</h3>
            <button className="mobile-sidebar-close" onClick={() => setIsSidebarOpen(false)}>✕</button>
          </div>
          <ul>
            {CAPTCHA_TYPES.map((type) => (
              <li 
                key={type.id} 
                className={activeSection === type.id ? 'active' : ''}
                onClick={() => scrollToSection(type.id)}
              >
                {type.title}
              </li>
            ))}
          </ul>
        </nav>

        {/* 메인 컨텐츠 영역 (Scrollbar 유지) */}
        <Scrollbar className="main-content">
          <div className="intro-sections-wrapper">
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
          </div>
        </Scrollbar>

      </div>
    </div>
  );
};

export default Intro;