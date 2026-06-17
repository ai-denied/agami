import React, { useState } from 'react';
import Flashlight from "@/components/FlashlightCaptcha/FlashlightCaptcha";
import Scrollbar from "@/components/Scrollbar/Scrollbar";
import './Test.css';

const CAPTCHA_TYPES = [
  { id: 'flashlight', title: '손전등 캡챠', desc: '손전등의 빛을 조절하여 특정 영역을 맞추는 보안 검증 방식입니다.' },
  { id: 'face', title: '안면인식 캡챠', desc: '사용자의 얼굴 형태를 인식하여 실사용자인지 확인합니다.' },
  { id: 'emotion', title: '감정 추론 캡챠', desc: '표정을 통해 나타나는 감정을 분석하여 인증을 완료합니다.' },
];

const Test = () => {
  const [selectedType, setSelectedType] = useState(CAPTCHA_TYPES[0]);

  // 임시 테스트용 클라이언트 키 (테스트가 끝나면 백엔드 API에서 동적으로 받아오도록 수정하세요)
  const TEST_CLIENT_KEY = "agami_site_98376a2a377e26ff9ce15a91b1ef2fd8";

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

        <Scrollbar className="main-content">
          {/* 조건부 렌더링 로직 */}
          {selectedType.id === 'flashlight' ? (
            // 기존 손전등 캡챠 (직접 렌더링)
            <Flashlight 
              kind="flashlight" 
              difficulty="easy" 
              onComplete={(token) => console.log('인증 토큰:', token)} 
            />
          ) : (
            // 안면인식 & 감정추론 캡챠 (iframe 방식)
            // 백엔드 업데이트에 맞춰 kind 파라미터가 동적으로 들어갑니다. (현재는 모두 손전등 위젯이 뜰 것입니다)
            <div className="iframe-wrapper" style={{ width: '100%', margin: '20px 0', display: 'flex', justifyContent: 'center' }}>
              <iframe 
                src={`https://agami-captcha.cloud/widget/embed?kind=${selectedType.id}&difficulty=easy&client_key=${TEST_CLIENT_KEY}`}
                width="100%" 
                height="500px" 
                frameBorder="0"
                title={`${selectedType.title} 위젯`}
                scrolling="no"
              ></iframe>
            </div>
          )}

          <section className="captcha-description">
            <h3>{selectedType.title} 상세 설명</h3>
            <p>{selectedType.desc}</p>
          </section>
        </Scrollbar>
      </div>
    </div>
  );
};

export default Test;