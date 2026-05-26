import React, { useState } from 'react';
import Captcha from '../components/Captcha';
import './Test.css';

const CAPTCHA_TYPES = [
  { id: 'flashlight', title: '손전등 캡챠', desc: '손전등의 빛을 조절하여 특정 영역을 맞추는 보안 검증 방식입니다.' },
  { id: 'face', title: '안면인식 캡챠', desc: '사용자의 얼굴 형태를 인식하여 실사용자인지 확인합니다.' },
  { id: 'emotion', title: '감정 추론 캡챠', desc: '표정을 통해 나타나는 감정을 분석하여 인증을 완료합니다.' },
];

const Test = () => {
  const [selectedType, setSelectedType] = useState(CAPTCHA_TYPES[0]);

  return (
    <div className="page-wrapper">
      <div className="layout-container">
        <nav className="sidebar">
          <ul>
            {CAPTCHA_TYPES.map((type) => (
              <li 
                key={type.id} 
                className={selectedType.id === type.id ? 'active' : ''}
                onClick={() => setSelectedType(type)}
              >
                {type.title}
              </li>
            ))}
          </ul>
        </nav>

        <main className="main-content">
          {/* 사이드바 선택에 따른 렌더링 로직 */}
          {selectedType.id === 'flashlight' ? (
            <Captcha 
              kind="flashlight" 
              difficulty="easy" 
              onComplete={(token) => console.log('인증 토큰:', token)} 
            />
          ) : (
            <div className="captcha-status-card-box">
              <div className="status-main-title">🚧 준비 중입니다.</div>
              <div className="status-sub-desc">해당 캡챠 방식은 현재 개발 중에 있습니다.</div>
            </div>
          )}

          <section className="captcha-description">
            <h3>{selectedType.title} 상세 설명</h3>
            <p>{selectedType.desc}</p>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Test;