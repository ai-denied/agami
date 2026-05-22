import React, { useState } from 'react';
import './test.css'; // 위젯 스타일 분리

const test = ({ type, onComplete }) => {
  return (
    <div className="captcha-widget-card">
      <div className="widget-header">
        {type === 'flashlight' && <h3>손전등 캡챠</h3>}
        {type === 'face' && <h3>안면인식 캡챠</h3>}
        {type === 'emotion' && <h3>감정 추론 캡챠</h3>}
      </div>
      
      {/* 여기서 실제 캡챠 로직이 위젯 형태로 렌더링됩니다 */}
      <div className="widget-body">
        {/* 각 캡챠 컴포넌트가 들어갈 자리 */}
        <div className="placeholder-content">위젯 UI 출력 영역</div>
      </div>
      
      <button className="primary-btn" onClick={onComplete}>확인</button>
    </div>
  );
};

export default test;