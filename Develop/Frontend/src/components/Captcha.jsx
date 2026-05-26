import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import './Captcha.css';

// [1] FishTimer 컴포넌트
function FishTimer({ remainingMs, totalMs, className = '' }) {
  const [phase, setPhase] = useState('swimming'); 
  const [reduceMotion, setReduceMotion] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [, setTick] = useState(0);                 

  const containerRef = useRef(null);
  const baseRemainingMsRef = useRef(remainingMs);
  const baseTsRef = useRef(performance.now());
  const rafRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handler = (e) => setReduceMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  useLayoutEffect(() => {
    if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
  }, []);
  
  const progress = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  
  return (
    <div ref={containerRef} className={`fishtimer-container ${className}`} role="progressbar">
      <div className="fishtimer-svg-track" style={{ width: `${progress * 100}%`, background: '#4a8bff', height: '6px', borderRadius: '3px' }} />
    </div>
  );
}

// [2] FlashlightCaptcha 컴포넌트
function FlashlightCaptcha({ spec, onSubmit, onRefresh, onTimeout, onFailure }) {
  const wrapRef = useRef(null); const overlayRef = useRef(null); const ringRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(spec?.time_limit_sec ?? 45); 
  const currentSub = spec?.sub_challenges?.[currentIndex];

  useEffect(() => {
    const tick = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { clearInterval(tick); onTimeout(); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(tick);
  }, [onTimeout]);

  const handleCanvasClick = () => {
    const wrap = wrapRef.current;
    const img = wrap?.querySelector('.flashlight-bg-image');
    if (!wrap || !img || !currentSub) return;
    
    const { x, y } = mouseRef.current;
    const clickedPixelX = x * (img.naturalWidth || 800);
    const clickedPixelY = y * (img.naturalHeight || 600);
    const { x: bx, y: by, width: bw, height: bh } = currentSub.bbox;

    if (clickedPixelX >= bx && clickedPixelX <= (bx + bw) && clickedPixelY >= by && clickedPixelY <= (by + bh)) {
      if (currentIndex < 2) setCurrentIndex(currentIndex + 1); else onSubmit();
    } else {
      onFailure();
    }
  };

  return (
    <div className="captcha-card-layout">
      <div className="captcha-card-header">
        <div className="header-title-group">🔦 <div>손전등 탐색 캡챠</div></div>
        <div className="header-timer-pill">⏱️ {timeLeft}s</div>
      </div>
      <div className="captcha-card-body">
        <div ref={wrapRef} className="flashlight-canvas-wrapper" onMouseMove={(e) => {
          const r = wrapRef.current.getBoundingClientRect();
          mouseRef.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
        }} onClick={handleCanvasClick}>
          <img src={currentSub.image_url} alt="Challenge" className="flashlight-bg-image" />
          <div ref={overlayRef} className="flashlight-dark-mask" />
        </div>
        <FishTimer remainingMs={timeLeft * 1000} totalMs={spec.time_limit_sec * 1000} />
      </div>
    </div>
  );
}

// [3] 최상위 Captcha 메인 컴포넌트
export default function Captcha({ kind = 'flashlight', difficulty = 'easy', onComplete }) {
  const [status, setStatus] = useState('idle');
  const [spec, setSpec] = useState(null);

  const start = useCallback(async () => {
    if (kind !== 'flashlight') return;
    setStatus('loading');
    try {
      // Mock Data Load
      setSpec({
        time_limit_sec: 45,
        sub_challenges: Array(3).fill(0).map((_, i) => ({
          image_url: 'placeholder.jpg',
          bbox: { x: 100, y: 100, width: 50, height: 50 }
        }))
      });
      setStatus('active');
    } catch (err) { setStatus('fail'); }
  }, [kind]);

  useEffect(() => { if (kind === 'flashlight') start(); else setStatus('idle'); }, [kind, start]);

  if (kind !== 'flashlight') {
    return <div className="captcha-status-card-box"><div className="status-sub-desc">🚧 준비 중입니다.</div></div>;
  }

  return (
    <div className="raw-captcha-wrapper">
      {status === 'loading' && <div>로딩 중...</div>}
      {status === 'active' && spec && <FlashlightCaptcha spec={spec} onSubmit={() => setStatus('success')} onRefresh={start} onTimeout={() => setStatus('fail')} onFailure={() => setStatus('fail')} />}
      {status === 'success' && <div>✅ 성공</div>}
      {status === 'fail' && <button onClick={start}>다시 시도</button>}
    </div>
  );
}