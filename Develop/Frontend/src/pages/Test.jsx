import React from 'react';
import { motion } from 'framer-motion';
import LiquidGlass from '../components/LiquidGlass';
import './Test.css';

const Test = () => {
  const { status, spec, token, error, start, submit, reset } = useCaptcha({ 
    kind: 'context_inference', 
    difficulty: 'easy' 
  });

  const handleSubmit = (payload) => submit(payload);

  return (
    <div className="test-wrapper">
      <LiquidGlass className="test-container">
        <header className="test-header">
          <div className="brand-label">AGAMI CAPTCHA</div>
          <h1 className="title">감정 맥락 추론</h1>
          <p className="subtitle">사진 속 인물이 느낄 감정을 골라주세요</p>
        </header>

        {/* Status: idle */}
        {status === 'idle' && (
          <div className="captcha-box">
            <div className="icon">🧠</div>
            <h2 className="box-title">4지선다 감정 추론</h2>
            <p className="box-desc">이미지를 보고 가장 어울리는 감정을 선택하세요.</p>
            <button className="primary-btn" onClick={start}>캡챠 시작</button>
          </div>
        )}

        {/* Status: loading */}
        {status === 'loading' && (
          <div className="captcha-box loading">
            <div className="spinner"></div>
            <p>챌린지를 발급받는 중…</p>
          </div>
        )}

        {/* Status: active */}
        {status === 'active' && spec && (
          <div className="captcha-active-area">
            <ImageGridCaptcha
              spec={spec}
              status={status}
              error={error}
              onSubmit={handleSubmit}
              onRefresh={start}
            />
          </div>
        )}

        {/* Status: success/fail */}
        {(status === 'success' || status === 'fail') && (
          <div className={`captcha-box ${status}`}>
            <div className="status-icon">{status === 'success' ? '✅' : '❌'}</div>
            <h2 className="box-title">{status === 'success' ? '검증 성공' : '검증 실패'}</h2>
            <p className="box-desc">{status === 'success' ? '인증 토큰이 발급되었습니다.' : error?.message}</p>
            {status === 'success' && <pre className="token-pre">{token}</pre>}
            <button className="secondary-btn" onClick={reset}>처음으로</button>
          </div>
        )}
      </LiquidGlass>
    </div>
  );
};

export default Test;