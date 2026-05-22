import React from 'react';
import './Test.css';

const CaptchaWidget = ({ type, onComplete }) => {
  // 캡챠 타입별 헤더 텍스트 설정
  const getHeaderTitle = () => {
    switch (type) {
      case 'flashlight': return '손전등 캡챠';
      case 'face': return '안면인식 캡챠';
      case 'emotion': return '감정 추론 캡챠';
      default: return '보안 확인';
    }
  };

  return (
    <div className="captcha-widget-card">
      <div className="widget-header">
        <h3>{getHeaderTitle()}</h3>
      </div>
      
      <div className="widget-body">
        <div className="placeholder-content">
          {/* 각 캡챠 로직에 따른 컴포넌트가 렌더링될 영역 */}
          {type} 모드 활성화됨
        </div>
      </div>
      
      <button className="primary-btn" onClick={onComplete}>
        확인
      </button>
    </div>
  );
};

export default CaptchaWidget;