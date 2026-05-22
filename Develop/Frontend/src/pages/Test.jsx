import React, { useState } from 'react';
import './Test.css';

const CAPTCHA_TYPES = [
  { id: 'flashlight', title: '손전등 캡챠', desc: '손전등의 빛을 조절하여 특정 영역을 맞추는 보안 검증 방식입니다.' },
  { id: 'face', title: '안면인식 캡챠', desc: '사용자의 얼굴 형태를 인식하여 실사용자인지 확인합니다.' },
  { id: 'emotion', title: '감정 추론 캡챠', desc: '표정을 통해 나타나는 감정을 분석하여 인증을 완료합니다.' },
];

const CaptchaPage = () => {
  const [selectedType, setSelectedType] = useState(CAPTCHA_TYPES[0]);

  return (
    <div className="layout-container">
      <nav className="sidebar">
        <h2>Captcha Lab</h2>
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
        <div className="captcha-widget-card">
          <div className="widget-header">
            <h3>{selectedType.title}</h3>
          </div>
          <div className="widget-body">
            {selectedType.title} 인터페이스 영역
          </div>
          <button className="primary-btn">확인</button>
        </div>

        <section className="captcha-description">
          <h3>{selectedType.title} 상세 설명</h3>
          <p>{selectedType.desc}</p>
        </section>
      </main>
    </div>
  );
};

export default CaptchaPage;