import React from 'react';
import './BubbleBtn.css';

const BubbleBtn = ({ children, onClick, className = "", variant = "primary" }) => {
  return (
    <button 
      className={`bubble-btn-shared ${variant} ${className}`} 
      onClick={onClick}
    >
      {/* 텍스트가 버블 위로 오도록 클래스 적용 */}
      <span className="btn-text-content">{children}</span>
      <div className="bubble-wrapper">
        {[...Array(8)].map((_, i) => (
          <span key={i} className={`bubble bubble-${i}`}></span>
        ))}
      </div>
    </button>
  );
};

export default BubbleBtn;