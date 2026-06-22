import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Scrollbar from "@/components/Scrollbar/Scrollbar";
import BubbleBtn from "@/components/BubbleBtn/BubbleBtn";
import './Intro.css';

const CAPTCHA_TYPES = [
  { id: 'handlight', title: '손전등 캡챠', desc: '손전등의 빛을 조절하여 특정 영역을 맞추는 보안 검증 방식입니다.' },
  { id: 'face', title: '안면 인식 캡챠', desc: '사용자의 얼굴 형태를 인식하여 실사용자인지 확인합니다.' },
  { id: 'emotion', title: '감정 추론 캡챠', desc: '표정을 통해 나타나는 감정을 분석하여 인증을 완료합니다.' },
];

const Intro = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(CAPTCHA_TYPES[0].id);
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

    CAPTCHA_TYPES.forEach(type => {
      const el = sectionRefs.current[type.id];
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

            {/* 💡 모든 캡챠 설명이 끝난 최하단에 시작하기 버튼을 배치합니다. */}
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