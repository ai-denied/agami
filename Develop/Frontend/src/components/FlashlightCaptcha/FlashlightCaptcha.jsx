import React, { useEffect, useRef, useState, useCallback, useId, useLayoutEffect } from 'react';
import './FlashlightCaptcha.css';

// =============================================================================
// [1] FishTimer 컴포넌트
// =============================================================================
const BOT_WIDTH_PX = 50;
const FISH_SIZE_PX = 56;
const FISH_MOUTH_OFFSET_PX = 14;        
const CURVE_AMPLITUDE_PX = 10;          
const CURVE_PERIOD_PX = 120;            
const CONTAINER_HEIGHT_PX = 64;         
const MID_Y = CONTAINER_HEIGHT_PX / 2;
const FISH_SCALE_FED = 1.6;             
const SCALE_TRANSITION_MS = 2100;       
const ROTATE_TRANSITION_MS = 200;       
const CHOMP_DURATION_MS = 200;          
const CHOMP_ITERATIONS = 2;
const EATING_DURATION_MS = 2500;
const BOT_DISAPPEAR_MS = 1500;
const EATING_THRESHOLD_FALLBACK = 0.15;
const PATH_STEP_PX = 4;                 

function curveY(x) {
  return MID_Y + CURVE_AMPLITUDE_PX * Math.sin(2 * Math.PI * (x - BOT_WIDTH_PX) / CURVE_PERIOD_PX);
}

function curveSlope(x) {
  return CURVE_AMPLITUDE_PX * (2 * Math.PI / CURVE_PERIOD_PX) * Math.cos(2 * Math.PI * (x - BOT_WIDTH_PX) / CURVE_PERIOD_PX);
}

function buildCurvePath(startX, endX, step) {
  if (endX <= startX) return '';
  let d = `M ${startX.toFixed(2)} ${curveY(startX).toFixed(2)}`;
  for (let x = startX + step; x < endX; x += step) {
    d += ` L ${x.toFixed(2)} ${curveY(x).toFixed(2)}`;
  }
  d += ` L ${endX.toFixed(2)} ${curveY(endX).toFixed(2)}`;
  return d;
}

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
  
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    baseRemainingMsRef.current = remainingMs;
    baseTsRef.current = performance.now();
  }, [remainingMs]);

  useEffect(() => {
    setPhase('swimming');
  }, [totalMs]);

  useEffect(() => {
    if (reduceMotion || phase !== 'swimming') return;
    const loop = () => {
      setTick((t) => (t + 1) % 1e9);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [phase, reduceMotion]);

  const now = performance.now();
  const elapsedSinceBase = now - baseTsRef.current;
  const effectiveRemainingMs = reduceMotion
    ? remainingMs
    : Math.max(0, baseRemainingMsRef.current - elapsedSinceBase);

  const progress = totalMs > 0
    ? Math.max(0, Math.min(1, effectiveRemainingMs / totalMs))
    : 0;

  const eatingThreshold = totalMs > 0
    ? Math.min(EATING_DURATION_MS / totalMs, 0.5)
    : EATING_THRESHOLD_FALLBACK;

  const visualProgress = progress > eatingThreshold
    ? (progress - eatingThreshold) / (1 - eatingThreshold)
    : 0;

  useEffect(() => {
    if (phase !== 'swimming') return;
    if (progress <= eatingThreshold) {
      setPhase('eating');
      const t = setTimeout(
        () => setPhase('fed'),
        CHOMP_DURATION_MS * CHOMP_ITERATIONS,
      );
      return () => clearTimeout(t);
    }
  }, [progress, phase, eatingThreshold]);

  const fishScale = phase === 'swimming' ? 1.0 : FISH_SCALE_FED;
  const trackSpan = Math.max(1, containerWidth - BOT_WIDTH_PX);
  const fishLeft = BOT_WIDTH_PX + trackSpan * visualProgress;
  const onCurve = phase === 'swimming' && !reduceMotion;
  const fishTop = onCurve ? curveY(fishLeft) : MID_Y;

  const slopeAtFish = onCurve ? curveSlope(fishLeft) : 0;
  const angleDeg = Math.atan(slopeAtFish) * 180 / Math.PI;

  const mouthFromCenterPx = FISH_SIZE_PX / 2 - FISH_MOUTH_OFFSET_PX;
  const trackEndX = Math.max(BOT_WIDTH_PX, fishLeft - mouthFromCenterPx);

  const pathD = containerWidth > BOT_WIDTH_PX && trackEndX > BOT_WIDTH_PX
    ? buildCurvePath(BOT_WIDTH_PX, trackEndX, PATH_STEP_PX)
    : '';

  const botTransform = phase === 'swimming'
    ? 'translateY(-50%) scale(1) rotate(0deg)'
    : 'translateY(-50%) scale(0.3) rotate(-720deg)';
  const botOpacity = phase === 'swimming' ? 1 : 0;
  const botTransition = reduceMotion
    ? 'none'
    : `transform ${BOT_DISAPPEAR_MS}ms cubic-bezier(.4,0,.2,1), opacity ${BOT_DISAPPEAR_MS}ms ease-in`;

  const fishOuterTransition = reduceMotion
    ? 'none'
    : `transform ${ROTATE_TRANSITION_MS}ms linear`;

  return (
    <div
      ref={containerRef}
      className={`fishtimer-container ${className}`}
      role="progressbar"
      aria-label="남은 시간"
      aria-valuemin={0}
      aria-valuemax={totalMs}
      aria-valuenow={Math.max(0, effectiveRemainingMs)}
    >
      <div
        className="fishtimer-bot"
        style={{
          transform: botTransform,
          opacity: botOpacity,
          transition: botTransition,
        }}
        aria-hidden
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" />
          <path d="M20 14h2" />
          <path d="M15 13v2" />
          <path d="M9 13v2" />
        </svg>
      </div>

      <svg className="fishtimer-svg-track" aria-hidden>
        {pathD && (
          <path d={pathD} stroke="#4a8bff" strokeWidth="6" fill="none" strokeLinecap="round" />
        )}
      </svg>

      {containerWidth > 0 && (
        <div
          className="fishtimer-fish-wrapper"
          style={{
            transform: `translate(-50%, -50%) translate(${fishLeft}px, ${fishTop}px) rotate(${angleDeg}deg) scale(${fishScale})`,
            transition: fishOuterTransition,
          }}
        >
          <div
            className={phase === 'eating' && !reduceMotion ? 'fish-chomp' : ''}
            style={{ width: '100%', height: '100%', transformOrigin: 'center' }}
          >
            <img
              src={`${import.meta.env.BASE_URL || '/'}timer-fish.png`}
              alt=""
              aria-hidden
              width={FISH_SIZE_PX}
              height={FISH_SIZE_PX}
              draggable={false}
              className="fishtimer-fish-img"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// [2] FlashlightCaptcha 컴포넌트
// =============================================================================
function FlashlightCaptcha({ spec, onSubmit, onRefresh, onTimeout, onFailure }) {
  const wrapRef = useRef(null); const overlayRef = useRef(null); const ringRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(spec?.time_limit_sec ?? 45); 
  const [hintVisible, setHintVisible] = useState(false);
  const currentSub = spec?.sub_challenges?.[currentIndex];

  useEffect(() => {
    if (!spec) return; setTimeLeft(spec.time_limit_sec); setHintVisible(false); setCurrentIndex(0);
    const tick = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(tick); onTimeout(); return 0; }
        return t - 1;
      });
    }, 1000);
    if (spec.hint_after_sec) setTimeout(() => setHintVisible(true), spec.hint_after_sec * 1000); return () => clearInterval(tick);
  }, [spec, onTimeout]);

  useEffect(() => {
    if (!spec || !currentSub) return;
    const draw = () => {
      const wrap = wrapRef.current; const overlay = overlayRef.current; const ring = ringRef.current;
      if (!wrap || !overlay) return;
      
      const w = wrap.offsetWidth || 500; const h = wrap.offsetHeight || 375;
      const { x, y } = mouseRef.current; const mx = x * w, my = y * h;
      const radius = (spec.flashlight_radius || 0.12) * Math.min(w, h);
      overlay.style.background = `radial-gradient(circle ${radius}px at ${mx}px ${my}px, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.98) 95%)`;
      if (ring) ring.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      requestAnimationFrame(draw);
    };
    const raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf);
  }, [spec, currentIndex, currentSub]);

  if (!spec || !currentSub) return null;

  const handleCanvasClick = () => {
    if (!currentSub || !currentSub.bbox) return;

    const wrap = wrapRef.current;
    const img = wrap?.querySelector('.flashlight-bg-image');
    if (!wrap || !img) return;

    const { x, y } = mouseRef.current;
    const imgOriginalWidth = img.naturalWidth || 800;
    const imgOriginalHeight = img.naturalHeight || 600;

    const clickedPixelX = x * imgOriginalWidth;
    const clickedPixelY = y * imgOriginalHeight;

    const { x: boxX, y: boxY, width: boxW, height: boxH } = currentSub.bbox;

    const isCorrect = clickedPixelX >= boxX && 
                      clickedPixelX <= (boxX + boxW) && 
                      clickedPixelY >= boxY && 
                      clickedPixelY <= (boxY + boxH);

    if (!isCorrect) {
      if (onFailure) onFailure();
      return; 
    }

    if (currentIndex < 2) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onSubmit();
    }
  };

  return (
    <div className="captcha-card-layout">
      {/* Header */}
      <div className="captcha-card-header">
        <div className="header-title-group">
          <span className="header-icon">🔦</span>
          <div>
            <div className="header-main-title">손전등 탐색 캡챠</div>
            <div className="header-sub-title">어둠 속에 숨겨진 물건을 3번 찾아주세요</div>
          </div>
        </div>
        <div className="header-timer-pill">⏱️ {timeLeft}s</div>
      </div>

      {/* Body */}
      <div className="captcha-card-body">
        {/* Step Indicator */}
        <div className="step-indicator-bar">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`step-dot ${i <= currentIndex ? 'active' : ''}`} />
          ))}
        </div>
        <div className="step-text-label">진행 <span className="highlight-blue">{currentIndex + 1}</span> / 3</div>

        {/* Target Hint Row */}
        <div className="target-hint-row">
          <div className="hint-label-box">
            <span className="hint-title">찾을 물건</span>
            <span className="hint-badge">{currentSub.target_hint?.label}</span>
          </div>
          <div className="difficulty-text">난이도 · <span className="diff-badge">{spec.difficulty}</span></div>
        </div>

        {/* Canvas Wrap */}
        <div
          ref={wrapRef}
          className="flashlight-canvas-wrapper"
          onMouseMove={(e) => {
            const r = wrapRef.current.getBoundingClientRect();
            mouseRef.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
          }}
          onClick={handleCanvasClick}
        >
          <img src={currentSub.image_url} alt="Challenge" className="flashlight-bg-image" />
          <div ref={overlayRef} className="flashlight-dark-mask" />
          <div ref={ringRef} className="flashlight-cursor-ring" />
          {hintVisible && <div className="flashlight-hint-bubble">💡 천천히 둘러보세요</div>}
        </div>

        <FishTimer remainingMs={timeLeft * 1000} totalMs={spec.time_limit_sec * 1000} className="mt-3.5" />
      </div>

      {/* Footer */}
      <div className="captcha-card-footer">
        <span className="footer-protection-text">🛡️ agami로 보호되는 페이지</span>
        <button onClick={onRefresh} className="footer-refresh-btn">🔄 새로고침</button>
      </div>
    </div>
  );
}

// =============================================================================
// [3] 최상위 Captcha 메인 컴포넌트
// =============================================================================
export default function Captcha({ kind = 'flashlight', difficulty = 'easy', onComplete }) {
  const [status, setStatus] = useState('idle');
  const [spec, setSpec] = useState(null);

  const start = useCallback(async () => {
    // 💡 변경 지점: kind가 'flashlight'가 아니라면 아예 로딩이나 검증 발급을 수행하지 않고 중단
    if (kind !== 'flashlight') return;

    setStatus('loading');
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      
      const selectedIds = [];
      while (selectedIds.length < 3) {
        const randIndex = Math.floor(Math.random() * 1000) + 1;
        const formattedId = `captcha_${String(randIndex).padStart(4, '0')}`; 
        if (!selectedIds.includes(formattedId)) {
          selectedIds.push(formattedId);
        }
      }

      const subChallenges = await Promise.all(
        selectedIds.map(async (id, index) => {
          const response = await fetch(`${cleanBaseUrl}captcha_labels/${id}.json`);
          if (!response.ok) throw new Error(`데이터 세트를 불러올 수 없습니다: ${id}`);
          
          const data = await response.json();
          
          let targetLabel = "지정된 물건";
          if (data.target_object) {
            const lowerObj = data.target_object.toLowerCase();
            if (lowerObj.includes("key")) targetLabel = "열쇠 (Key)";
            else if (lowerObj.includes("pencil")) targetLabel = "연필 (Pencil)";
            else if (lowerObj.includes("ring")) targetLabel = "반지 (Ring)";
            else if (lowerObj.includes("watch")) targetLabel = "시계 (Watch)";
            else targetLabel = data.target_object;
          }

          return {
            index,
            image_url: `${cleanBaseUrl}captcha_images/${id}.jpg`,
            target_hint: { label: targetLabel },
            bbox: data.bbox 
          };
        })
      );

      const localSpec = {
        challenge_id: `agami_${Math.random().toString(36).substr(2, 9)}`,
        kind: "flashlight",
        difficulty: difficulty,
        time_limit_sec: 45,
        flashlight_radius: 0.18, 
        hint_after_sec: 5,
        sub_challenges: subChallenges
      };

      setSpec(localSpec);
      setStatus('active');
    } catch (err) {
      console.error("캡챠 초기화 에러:", err);
      setStatus('fail');
    }
  }, [kind, difficulty]);

  const submit = useCallback(() => {
    setStatus('success');
    if (onComplete) onComplete({ success: true });
  }, [onComplete]);

  const handleFailure = useCallback(() => {
    setStatus('fail');
    if (onComplete) onComplete({ success: false });
  }, [onComplete]);

  useEffect(() => {
    start();
  }, [kind, start]);

  // 💡 변경 지점: 손전등 캡챠가 선택되지 않았을 때는 예외 조건 분기 없이 완전한 빈 화면(null) 반환
  if (kind !== 'flashlight') {
    return null;
  }

  return (
    <div className="raw-captcha-wrapper">
      {status === 'loading' && (
        <div className="captcha-status-card-box">
          <div className="loading-spinner-group">
            <span className="spin-circle" />
            <span className="loading-text">챌린지를 발급받는 중…</span>
          </div>
        </div>
      )}

      {status === 'active' && spec && (
        <FlashlightCaptcha 
          spec={spec} 
          onSubmit={submit} 
          onRefresh={start} 
          onTimeout={handleFailure}
          onFailure={handleFailure} 
        />
      )}

      {status === 'success' && (
        <div className="captcha-status-card-box border-green">
          <div className="status-success-row">
            <div className="success-badge-circle">✅</div>
            <div>
              <div className="status-main-title">검증 성공</div>
              <div className="status-sub-desc">보안 검증 결과 처리가 완료되었습니다.</div>
            </div>
          </div>
        </div>
      )}

      {status === 'fail' && (
        <div className="captcha-status-card-box border-red">
          <div className="status-success-row">
            <div className="fail-badge-circle">❌</div>
            <div>
              <div className="status-main-title">검증 실패</div>
              <div className="status-sub-desc text-red">잘못된 위치를 클릭했거나 제한 시간이 만료되었습니다.</div>
            </div>
          </div>
          <button onClick={start} className="captcha-retry-action-btn">다시 시도</button>
        </div>
      )}
    </div>
  );
}