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
          <section className="captcha-description" style={{ borderTop: 'none', marginTop: 0 }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '10px', color: 'var(--text-primary)' }}>
              {selectedType.title}
            </h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '30px', color: 'var(--text-secondary)' }}>
              {selectedType.desc}
            </p>
            
            {/* 실제 캡챠 로직을 제거하고 소개용 사진/영상 영역으로 변경 */}
            <div className="intro-image-placeholder" style={{
              width: '100%', height: '400px', background: 'var(--bg-card)', 
              borderRadius: '16px', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)'
            }}>
              {/* 각 캡챠별로 보여줄 이미지나 영상을 이곳에 넣으시면 됩니다. */}
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