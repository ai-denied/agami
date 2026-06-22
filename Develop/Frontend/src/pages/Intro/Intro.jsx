import React, { useState } from 'react';
import Scrollbar from "@/components/Scrollbar/Scrollbar";
import './Intro.css';

const CAPTCHA_TYPES = [
  { id: 'handlight', title: '손전등 캡챠', desc: '손전등의 빛을 조절하여 특정 영역을 맞추는 보안 검증 방식입니다.' },
  { id: 'face', title: '안면 인식 캡챠', desc: '사용자의 얼굴 형태를 인식하여 실사용자인지 확인합니다.' },
  { id: 'emotion', title: '감정 추론 캡챠', desc: '표정을 통해 나타나는 감정을 분석하여 인증을 완료합니다.' },
];

const Intro = () => {
  const [selectedType, setSelectedType] = useState(CAPTCHA_TYPES[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 💡 모바일 사이드바 상태

  // 항목 선택 시 모바일 사이드바 자동 닫힘 처리
  const handleSelect = (type) => {
    setSelectedType(type);
    setIsSidebarOpen(false);
  };

  return (
    <div className="page-wrapper">
      <div className="layout-container">
        
        {/* 💡 모바일 전용 토글 버튼 */}
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

        {/* 💡 모바일 전용 오버레이 (클릭 시 닫힘) */}
        <div 
          className={`mobile-sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} 
          onClick={() => setIsSidebarOpen(false)} 
        />

        <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <ul>
            {CAPTCHA_TYPES.map((type) => (
              <li 
                key={type.id} 
                className={selectedType.id === type.id ? 'active' : ''}
                onClick={() => handleSelect(type)}
              >
                {type.title}
              </li>
            ))}
          </ul>
        </nav>

        <Scrollbar className="main-content">
          <section className="captcha-description" style={{ borderTop: 'none', marginTop: 0 }}>
            <h2 className="content-title" style={{ fontSize: '1.8rem', marginBottom: '10px', color: 'var(--text-primary)' }}>
              {selectedType.title}
            </h2>
            <p className="content-desc" style={{ fontSize: '1.1rem', marginBottom: '30px', color: 'var(--text-secondary)' }}>
              {selectedType.desc}
            </p>
            
            <div className="intro-image-placeholder" style={{
              width: '100%', height: '400px', background: 'var(--bg-card)', 
              borderRadius: '16px', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)'
            }}>
              {selectedType.id === 'handlight' && <span>[손전등 캡챠 데모 소개 사진 / 영상]</span>}
              {selectedType.id === 'face' && <span>[안면 인식 캡챠 데모 소개 사진 / 영상]</span>}
              {selectedType.id === 'emotion' && <span>[감정 추론 캡챠 데모 소개 사진 / 영상]</span>}
            </div>
          </section>
        </Scrollbar>

      </div>
    </div>
  );
};

export default Intro;