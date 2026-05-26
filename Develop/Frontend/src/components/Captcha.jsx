import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import './Captcha.css';

// ==========================================
// [1] FishTimer 컴포넌트
// ==========================================
const BOT_WIDTH_PX = 50; const FISH_SIZE_PX = 56;
const FISH_MOUTH_OFFSET_PX = 14; const CURVE_AMPLITUDE_PX = 10;
const CURVE_PERIOD_PX = 120; const CONTAINER_HEIGHT_PX = 64;
const MID_Y = CONTAINER_HEIGHT_PX / 2; const FISH_SCALE_FED = 1.6;

function curveY(x) { return MID_Y + CURVE_AMPLITUDE_PX * Math.sin(2 * Math.PI * (x - BOT_WIDTH_PX) / CURVE_PERIOD_PX); }

function FishTimer({ remainingMs, totalMs, className = '' }) {
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);
  
  useLayoutEffect(() => { if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth); }, []);
  
  const progress = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  const fishLeft = BOT_WIDTH_PX + Math.max(1, containerWidth - BOT_WIDTH_PX) * progress;

  return (
    <div ref={containerRef} className={`fishtimer-container ${className}`}>
      <div className="fishtimer-fish-wrapper" style={{ transform: `translate(-50%, -50%) translate(${fishLeft}px, ${curveY(fishLeft)}px)` }}>
        <img src="/timer-fish.png" alt="" width={FISH_SIZE_PX} height={FISH_SIZE_PX} />
      </div>
    </div>
  );
}

// ==========================================
// [2] FlashlightCaptcha 컴포넌트
// ==========================================
function FlashlightCaptcha({ spec, onSubmit, onRefresh, onFailure }) {
  const wrapRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSub = spec?.sub_challenges?.[currentIndex];

  const handleCanvasClick = (e) => {
    const r = wrapRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) * (800 / r.width);
    const y = (e.clientY - r.top) * (600 / r.height);
    const { x: bx, y: by, width: bw, height: bh } = currentSub.bbox;
    
    if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
      if (currentIndex < 2) setCurrentIndex(prev => prev + 1); else onSubmit();
    } else { onFailure(); }
  };

  return (
    <div className="captcha-card-layout">
      <div ref={wrapRef} className="flashlight-canvas-wrapper" onClick={handleCanvasClick}>
        <img src={currentSub.image_url} className="flashlight-bg-image" />
      </div>
      <FishTimer remainingMs={45000} totalMs={45000} />
      <button onClick={onRefresh}>새로고침</button>
    </div>
  );
}

// ==========================================
// [3] Main Captcha 컴포넌트
// ==========================================
export default function Captcha({ kind = 'flashlight', difficulty = 'easy', onComplete }) {
  const [status, setStatus] = useState('idle');
  const [spec, setSpec] = useState(null);

  const start = useCallback(async () => {
    if (kind !== 'flashlight') return;
    setStatus('loading');
    try {
      const ids = Array.from({length: 3}, () => `captcha_${String(Math.floor(Math.random() * 1000) + 1).padStart(4, '0')}`);
      const subs = await Promise.all(ids.map(async (id) => {
        const res = await fetch(`/captcha_labels/${id}.json`);
        if (!res.ok) throw new Error("로드 실패");
        const data = await res.json();
        return { image_url: `/captcha_images/${id}.jpg`, bbox: data.bbox, target_hint: { label: data.target_object } };
      }));
      setSpec({ difficulty, sub_challenges: subs });
      setStatus('active');
    } catch (err) { setStatus('fail'); }
  }, [kind, difficulty]);

  useEffect(() => { if (kind === 'flashlight') start(); }, [kind, start]);

  if (kind !== 'flashlight') return null;

  return (
    <div className="raw-captcha-wrapper">
      {status === 'loading' && <div>로딩 중...</div>}
      {status === 'active' && <FlashlightCaptcha spec={spec} onSubmit={() => onComplete?.({success:true})} onRefresh={start} onFailure={() => setStatus('fail')} />}
      {status === 'fail' && <button onClick={start}>다시 시도</button>}
    </div>
  );
}