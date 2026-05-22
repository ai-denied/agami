import React from 'react';
import { motion } from 'framer-motion';
import LiquidGlass from '../components/LiquidGlass';
import './Test.css';

const Test = () => {
  const handleSubmit = (payload) => submit(payload);

  return (
    <div className="test-wrapper">
      <LiquidGlass className="test-container">
        <header className="test-header">
          <div className="brand-label">AGAMI CAPTCHA</div>
          <h1 className="title">감정 맥락 추론</h1>
          <p className="subtitle">사진 속 인물이 느낄 감정을 골라주세요</p>
        </header>
      </LiquidGlass>
    </div>
  );
};

export default Test;