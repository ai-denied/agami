import React from 'react';
import './BubbleBtn.css';

const BubbleBtn = ({ children, onClick, className = "", variant = "primary" }) => {
  return (
    <button 
      type="button"
      className={`bubble-btn-shared ${variant} ${className}`} 
      onClick={onClick}
    >
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