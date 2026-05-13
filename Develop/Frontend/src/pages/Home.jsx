import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; 

import LiquidGlass from '../components/LiquidGlass';
import BubbleBtn from '../components/BubbleBtn';
import './Home.css';

// --- 먹이 로봇 컴포넌트 ---
const FoodBot = ({ x, y, color }) => (
  <motion.img
    src="/bot.svg"
    className="food-bot"
    initial={{ opacity: 1, y: y, x: x - 40, scale: 0.5 }}
    animate={{ y: y + 500, opacity: 0, rotate: 180 }}
    transition={{ duration: 2.5, ease: "linear" }}
    style={{ 
      filter: `sepia(1) saturate(10) hue-rotate(${color}deg) brightness(1.1)`,
      position: 'absolute',
      zIndex: 15,
      width: '80px',
      willChange: 'transform, opacity'
    }}
  />
);

// --- 반응형 물고기 컴포넌트 ---
const ScaredFish = ({ index, isFeeding, mousePos, allFishRefs, isFirstVisit }) => {
  const fishProps = useMemo(() => {
    const scale = 0.35 + Math.random() * 0.45;
    let startX, startY;
    const margin = 400;
    const side = Math.floor(Math.random() * 4);

    if (side === 0) { startX = window.innerWidth + margin; startY = Math.random() * window.innerHeight; }
    else if (side === 1) { startX = -margin; startY = Math.random() * window.innerHeight; }
    else if (side === 2) { startX = Math.random() * window.innerWidth; startY = -margin; }
    else { startX = Math.random() * window.innerWidth; startY = window.innerHeight + margin; }

    return {
      scale, startX, startY,
      initialX: (Math.random() * 0.45 + 0.5) * window.innerWidth, 
      initialY: (Math.random() * 0.7) * window.innerHeight, 
      stiffness: 100 + Math.random() * 50,
      damping: 28,
      scareRadius: 200,
      followRadius: 400,
      personalSpace: 60 + (scale * 40),
      floatSpeed: 0.0005 + Math.random() * 0.0007,
      floatIntensity: 20,
    };
  }, [isFirstVisit]);

  const mX = useMotionValue(isFirstVisit ? fishProps.startX : fishProps.initialX);
  const mY = useMotionValue(isFirstVisit ? fishProps.startY : fishProps.initialY);
  const mRotate = useMotionValue(0);

  const springX = useSpring(mX, { stiffness: fishProps.stiffness, damping: fishProps.damping });
  const springY = useSpring(mY, { stiffness: fishProps.stiffness, damping: fishProps.damping });
  const springRotate = useSpring(mRotate, { stiffness: 150, damping: 20 });
  
  const isFeedingRef = useRef(isFeeding);
  useEffect(() => { isFeedingRef.current = isFeeding; }, [isFeeding]);

  useEffect(() => {
    allFishRefs.current[index] = { x: mX, y: mY };
    let requestRef;
    const delayTime = isFirstVisit ? 5000 : 0;
    let frameCount = 0;

    const animate = (time) => {
      const curX = mX.get();
      const curY = mY.get();
      const centerX = window.innerWidth * 0.9;
      const centerY = window.innerHeight * 0.5;
      const limitRadius = window.innerWidth * 0.5; 

      let targetX = fishProps.initialX + Math.sin(time * fishProps.floatSpeed) * fishProps.floatIntensity;
      let targetY = fishProps.initialY + Math.cos(time * fishProps.floatSpeed * 0.8) * fishProps.floatIntensity;

      const dx = mousePos.current.x - curX;
      const dy = (mousePos.current.y - (window.innerHeight * 0.2)) - curY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const mDx = mousePos.current.x - centerX;
      const mDy = mousePos.current.y - centerY;
      const mDistFromCenter = Math.sqrt(mDx * mDx + mDy * mDy);
      const isMouseInCircle = mDistFromCenter < limitRadius;

      let speedFactor = 0.02; 

      if (isFeedingRef.current && isMouseInCircle) {
        if (dist < fishProps.followRadius) {
          speedFactor = 0.07;
          targetX = mousePos.current.x - (dx / (dist || 1)) * 70;
          targetY = (mousePos.current.y - (window.innerHeight * 0.2)) - (dy / (dist || 1))
        }
      } else if (dist < fishProps.scareRadius && isMouseInCircle) {
        speedFactor = 0.15;
        const angle = Math.atan2(dy, dx);
        targetX = curX - Math.cos(angle) * (fishProps.scareRadius - dist) * 3;
        targetY = curY - Math.sin(angle) * (fishProps.scareRadius - dist) * 3;
      }

      let sepX = 0, sepY = 0;
      if (frameCount % 2 === 0) {
        allFishRefs.current.forEach((other, i) => {
          if (i === index || !other) return;
          const ox = curX - other.x.get();
          const oy = curY - other.y.get();
          const dSq = ox * ox + oy * oy;
          const pSpaceSq = fishProps.personalSpace * fishProps.personalSpace;
          if (dSq < pSpaceSq && dSq > 0) {
            const d = Math.sqrt(dSq);
            const force = (fishProps.personalSpace - d) / fishProps.personalSpace;
            sepX += (ox / d) * force * 15;
            sepY += (oy / d) * force * 15;
          }
        });
      }

      let nextX = curX + (targetX + sepX - curX) * speedFactor;
      let nextY = curY + (targetY + sepY - curY) * speedFactor;

      const nDx = nextX - centerX;
      const nDy = nextY - centerY;
      const nDist = Math.sqrt(nDx * nDx + nDy * nDy);
      if (nDist > limitRadius - 50) {
        const angle = Math.atan2(nDy, nDx);
        nextX = centerX + Math.cos(angle) * (limitRadius - 50);
        nextY = centerY + Math.sin(angle) * (limitRadius - 50);
      }

      const rotateAngle = Math.atan2(nextY - curY, nextX - curX) * 180 / Math.PI;
      if (Math.abs(nextX - curX) > 0.1) { mRotate.set(rotateAngle); }
      
      mX.set(nextX);
      mY.set(nextY);
      frameCount++;
      requestRef = requestAnimationFrame(animate);
    };

    const timer = setTimeout(() => { requestRef = requestAnimationFrame(animate); }, delayTime);
    return () => { clearTimeout(timer); cancelAnimationFrame(requestRef); };
  }, [fishProps, index, allFishRefs, isFirstVisit, mX, mY, mRotate, mousePos]);

  return (
    <motion.div 
      className="fish-wrapper" 
      style={{ x: springX, y: springY, rotate: springRotate, scale: fishProps.scale, willChange: 'transform' }}
    >
      <img src="/agami-fish.svg" alt="fish" style={{ width: '6vw', transform: 'scaleX(-1)', display: 'block' }} />
    </motion.div>
  );
};

// --- 지오데식 구 + 배경 네트워크 그래픽 ---
const ParticleNetwork = () => {
  const canvasRef = useRef(null);
  const fishImgRef = useRef(null);
  const botImgRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    
    const fishImg = new Image();
    fishImg.src = "/agami-fish-right.svg";
    fishImgRef.current = fishImg;

    const botImg = new Image();
    botImg.src = "/bot-blue.svg";
    botImgRef.current = botImg;

    let sphereParticles = [];
    let bgParticles = [];
    let animationFrameId;

    const getSphereRadius = () => Math.min(window.innerWidth, window.innerHeight) * 0.38;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    class BGParticle {
      constructor() {
        this.initPosition();
        this.size = 15 + Math.random() * 8; 
        this.speedX = Math.random() * 0.4 - 0.2;
        this.speedY = Math.random() * 0.4 - 0.2;
        this.opacity = 0.8 + Math.random() * 0.2; 
      }

      initPosition() {
        const radius = getSphereRadius() + 50; 
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        let x, y, dist;
        do {
          x = Math.random() * canvas.width;
          y = Math.random() * canvas.height;
          const dx = x - centerX;
          const dy = y - centerY;
          dist = Math.sqrt(dx * dx + dy * dy);
        } while (dist < radius); 

        this.x = x;
        this.y = y;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

        const radius = getSphereRadius() + 50;
        const dx = this.x - canvas.width / 2;
        const dy = this.y - canvas.height / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < radius) {
          const angle = Math.atan2(dy, dx);
          this.x = canvas.width / 2 + Math.cos(angle) * radius;
          this.y = canvas.height / 2 + Math.sin(angle) * radius;
          this.speedX *= -1;
          this.speedY *= -1;
        }
      }

      draw() {
        if (!botImgRef.current.complete) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.drawImage(botImgRef.current, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.restore();
      }
    }

    class SphereParticle {
      constructor(phi, theta, radius) {
        this.phi = phi;
        this.theta = theta;
        this.radius = radius;
        this.x = 0; this.y = 0; this.z = 0;
        this.projectedX = 0; this.projectedY = 0;
        this.baseSize = 20 + Math.random() * 10;
      }
      update(time) {
        const rotationSpeed = time * 0.0004;
        const currentTheta = this.theta + rotationSpeed;
        this.x = this.radius * Math.sin(this.phi) * Math.cos(currentTheta);
        this.y = this.radius * Math.cos(this.phi);
        this.z = this.radius * Math.sin(this.phi) * Math.sin(currentTheta) + this.radius;
        const perspective = 1000 / (1000 + this.z);
        this.projectedX = (canvas.width / 2) + this.x * perspective;
        this.projectedY = (canvas.height / 2) + this.y * perspective;
        this.alpha = perspective;
      }
      draw() {
        if (!fishImgRef.current.complete) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.projectedX, this.projectedY);
        const size = this.baseSize * this.alpha;
        ctx.drawImage(fishImgRef.current, -size / 2, -size / 2, size, size);
        ctx.restore();
      }
    }

    const init = () => {
      sphereParticles = [];
      bgParticles = [];
      const radius = getSphereRadius();
      const detail = 8;

      for (let i = 0; i <= detail; i++) {
        const phi = (Math.PI * i) / detail;
        const numTheta = Math.max(1, Math.floor(Math.sin(phi) * detail * 2.0));
        for (let j = 0; j < numTheta; j++) {
          const theta = (Math.PI * 2 * j) / numTheta;
          sphereParticles.push(new SphereParticle(phi, theta, radius));
        }
      }
      
      for (let i = 0; i < 35; i++) {
        bgParticles.push(new BGParticle());
      }
    };

    const drawSphereLines = () => {
      ctx.lineWidth = 1.0;
      const connectionDistSq = 180 * 180; 
      for (let i = 0; i < sphereParticles.length; i++) {
        const p1 = sphereParticles[i];
        for (let j = i + 1; j < Math.min(i + 20, sphereParticles.length); j++) {
          const p2 = sphereParticles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dz = p1.z - p2.z;
          const dSq = dx * dx + dy * dy + dz * dz;
          
          if (dSq < connectionDistSq) {
            const opacity = Math.min(p1.alpha, p2.alpha) * 0.2; 
            ctx.strokeStyle = `rgba(93, 162, 255, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(p1.projectedX, p1.projectedY);
            ctx.lineTo(p2.projectedX, p2.projectedY);
            ctx.stroke();
          }
        }
      }
    };

    const drawBGNetwork = () => {
      ctx.lineWidth = 0.8;
      const bgConnDistSq = 250 * 250;
      bgParticles.forEach((p1, i) => {
        for (let j = i + 1; j < bgParticles.length; j++) {
          const p2 = bgParticles[j];
          const dSq = (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
          if (dSq < bgConnDistSq) {
            ctx.strokeStyle = `rgba(93, 162, 255, 0.25)`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
    };

    const animate = (time) => {
      ctx.fillStyle = '#050a14'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      bgParticles.forEach(p => { p.update(); p.draw(); });
      drawBGNetwork();

      sphereParticles.forEach(p => p.update(time));
      drawSphereLines();
      sphereParticles.forEach(p => p.draw());

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate(0);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" style={{ opacity: 0.8, willChange: 'transform' }} />;
};

const MotionLiquidGlass = motion.create(LiquidGlass);

const Home = () => {
  const navigate = useNavigate();
  
  const [isFirstVisit, setIsFirstVisit] = useState(null);
  const [isFeeding, setIsFeeding] = useState(false);
  const [hasFed, setHasFed] = useState(false);
  const [foods, setFoods] = useState([]);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const allFishRefs = useRef([]);
  const wrapperRef = useRef(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: -500, y: -500 });
  const [targetFishPos, setTargetFishPos] = useState({ x: 50, y: 50 });
  const [isFound, setIsFound] = useState(false);

  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.type = 'image/x-icon'; link.rel = 'shortcut icon'; link.href = '/agami-home.svg'; 
    document.getElementsByTagName('head')[0].appendChild(link);
    document.title = "Agami - 차세대 지능형 캡챠 서비스";
  }, []);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisitedAgami');
    if (hasVisited) { setIsFirstVisit(false); } 
    else {
      setIsFirstVisit(true);
      document.body.classList.add('no-scroll');
      const timer = setTimeout(() => {
        sessionStorage.setItem('hasVisitedAgami', 'true');
        document.body.classList.remove('no-scroll');
      }, 5500);
      return () => { clearTimeout(timer); document.body.classList.remove('no-scroll'); };
    }
  }, []);

  const setRandomFishPos = () => {
    let x, y, isInsideText;
    do { x = Math.random() * 80 + 10; y = Math.random() * 80 + 10; isInsideText = x > 35 && x < 65 && y > 35 && y < 65; } while (isInsideText);
    setTargetFishPos({ x, y }); setIsFound(false);
  };

  useEffect(() => { setRandomFishPos(); }, []);

  useEffect(() => {
    let interval;
    if (isFeeding) {
      interval = setInterval(() => {
        setFoods(prev => [...prev.slice(-12), { id: Date.now() + Math.random(), x: mousePos.current.x, y: mousePos.current.y, color: Math.floor(Math.random() * 360) }]);
      }, 450);
    }
    return () => clearInterval(interval);
  }, [isFeeding]);

  const handleMouseMove = (e) => {
    mousePos.current = { x: e.clientX, y: e.clientY };
    const threshold = window.innerWidth * 0.5; 
    if (isFeeding && e.clientX < threshold) { setIsFeeding(false); }
  };

  const handleSecondMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpotlightPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFishClick = (e) => {
    e.stopPropagation(); if (isFound) return;
    setIsFound(true); setTimeout(() => { setRandomFishPos(); }, 1000);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (wrapperRef.current) {
        const scrollY = wrapperRef.current.scrollTop;
        if (isFeeding && scrollY > window.innerHeight * 0.5) { setIsFeeding(false); }
      }
    };
    const currentWrapper = wrapperRef.current;
    if (currentWrapper) currentWrapper.addEventListener('scroll', handleScroll);
    return () => { if (currentWrapper) currentWrapper.removeEventListener('scroll', handleScroll); };
  }, [isFeeding]);

  if (isFirstVisit === null) return null;

  const scrollToFirst = () => { if (wrapperRef.current) { wrapperRef.current.scrollTo({ top: 0, behavior: 'smooth' }); } };
  const scrollToSecond = () => { if (wrapperRef.current) { wrapperRef.current.scrollTo({ top: window.innerHeight, behavior: 'smooth' }); } };
  const scrollToThird = () => { if (wrapperRef.current) { wrapperRef.current.scrollTo({ top: window.innerHeight * 2, behavior: 'smooth' }); } };

  const toggleFeeding = () => { setIsFeeding(!isFeeding); if (!hasFed) setHasFed(true); };

  const introFishData = [
    { id: 0, top: '25%', size: 110, delay: 1.0 }, { id: 1, top: '75%', size: 90, delay: 1.2 },
    { id: 2, top: '45%', size: 120, delay: 1.4 }, { id: 3, top: '20%', size: 85, delay: 1.1 },
    { id: 4, top: '80%', size: 100, delay: 1.5 }, { id: 5, top: '35%', size: 95, delay: 0.9 }
  ];

  const mainTransition = isFirstVisit ? { delay: 3.5, duration: 1.5, ease: [0.4, 0, 0.2, 1] } : { duration: 0 };

  return (
    <div className="main-wrapper" ref={wrapperRef}>
      {/* 1번 페이지 */}
      <div className="home-container" onMouseMove={handleMouseMove}>
        <motion.div 
          className="circle" 
          initial={isFirstVisit ? { scale: 2.5 } : { scale: 1 }} 
          animate={{ scale: 1 }} 
          transition={mainTransition} 
          style={{ x: "50%", y: "-50%", willChange: 'transform' }}
        >
          <div className="wave-layer-internal" />
          
          {/* 물고기 씬 레이어를 Circle 내부로 이동시키되, 
              Circle의 중심을 기준으로 전체 화면 좌표를 상쇄하도록 스타일 수정 */}
          <div className="fish-scene-layer" style={{ 
            position: 'absolute', 
            left: '-50vw', // Circle이 부모의 50% 위치에 있으므로 화면 왼쪽으로 보정
            top: '50vh',   // y: -50%를 상쇄하기 위해 보정
            width: '100vw', 
            height: '100vh',
            pointerEvents: 'none'
          }}>
            {foods.map(f => <FoodBot key={f.id} x={f.x} y={f.y} color={f.color} />)}
            {Array.from({ length: 18 }).map((_, i) => (
              <ScaredFish key={i} index={i} isFeeding={isFeeding} mousePos={mousePos} allFishRefs={allFishRefs} isFirstVisit={isFirstVisit} />
            ))}
          </div>
        </motion.div>

        {isFirstVisit && (
          <>
            <motion.img src="bot.svg" className="actor bot" initial={{ left: '-150px', x: '0%', y: '-50%' }} animate={{ left: ['-150px', '50%', '50%', '120vw'], x: ['0%', '-50%', '-50%', '0%'] }} transition={{ duration: 3, times: [0, 0.3, 0.45, 1], ease: "easeInOut" }} />
            {introFishData.map((fish) => (
              <motion.img key={fish.id} src="agami-fish-right.svg" className="actor fish" style={{ top: fish.top, width: `${fish.size}px` }} initial={{ left: '-250px', y: '-50%' }} animate={{ left: '130vw' }} transition={{ delay: fish.delay, duration: 1.8, ease: [0.42, 0, 1, 1] }} />
            ))}
          </>
        )}

        <motion.div className="left-section" initial={isFirstVisit ? { x: -1000, opacity: 0 } : { x: 0, opacity: 1 }} animate={{ x: 0, opacity: 1 }} transition={mainTransition}>
          <img src="/agami-text.png" alt="Agami Logo" className="main-logo" />
          <p className="logo-text">봇은 틈새 없이, 유저는 끊김 없이.<br />차세대 지능형 캡챠 서비스</p>
          <BubbleBtn onClick={scrollToSecond} variant="primary">
            알아보기
          </BubbleBtn>
        </motion.div>

        <motion.div className="bot-fixed-area" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: isFirstVisit ? 5 : 0 }}>
          <AnimatePresence>
            {!hasFed && !isFeeding && (
              <motion.div className="bot-speech-bubble" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>봇을 클릭 후 마우스를 움직여보세요!</motion.div>
            )}
          </AnimatePresence>
          <div className={`bot-container ${isFeeding ? 'active' : ''}`} onClick={toggleFeeding}><img src="/bot.svg" alt="Bot" className="bot-image" /></div>
        </motion.div>
      </div>

      {/* 2번 페이지 */}
      <div className="second-container" onMouseMove={handleSecondMouseMove}>
        <div className="dark-sea-layer" />
        <div className="light-sea-layer" style={{ maskImage: `radial-gradient(circle 160px at ${spotlightPos.x}px ${spotlightPos.y}px, black 0%, rgba(0, 0, 0, 0.8) 40%, transparent 100%)`, WebkitMaskImage: `radial-gradient(circle 160px at ${spotlightPos.x}px ${spotlightPos.y}px, black 0%, rgba(0, 0, 0, 0.8) 40%, transparent 100%)` }}>
          <motion.div className="hidden-fish-wrapper" style={{ left: `${targetFishPos.x}%`, top: `${targetFishPos.y}%` }} initial={{ scale: 0 }} animate={{ scale: isFound ? [1, 1.8, 0] : 1, rotate: isFound ? 360 : 0 }} onClick={handleFishClick}>
            <img src="/agami-fish.svg" alt="hidden-fish" className="hidden-fish-img" />
            {isFound && <motion.div className="found-effect" initial={{ opacity: 0 }} animate={{ opacity: 1, scale: 2.5 }} exit={{ opacity: 0 }} />}
          </motion.div>
        </div>
        <div className="content-box">
          <h1>Agami의 혁신적인 기술</h1>
          <p>사용자 경험을 해치지 않는 스마트한 보안 솔루션입니다.</p>
          <span className="game-tip">어둠 속에서 숨겨진 물고기를 찾아보세요!</span>
        </div>
        <motion.button className="scroll-down-btn" onClick={scrollToThird} animate={{ y: [0, 10, 0] }} transition={{ y: { repeat: Infinity, duration: 1.5 } }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#5da2ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13l5 5 5-5M7 6l5 5 5-5" /></svg>
        </motion.button>
      </div>

      {/* 3번 페이지 */}
      <div className="third-container">
        <ParticleNetwork />
        
        <div className="third-logo-wrapper">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            whileInView={{ opacity: 1, y: 0, scale: 1 }} 
            viewport={{ once: true }} 
            transition={{ 
              duration: 1.5, 
              ease: [0.22, 1, 0.36, 1], 
            }}
          >
            <motion.img 
              src="/agami-logo-text.png" 
              alt="Agami Logo Text" 
              className="third-logo"
              animate={{
                y: [0, -20, 0], 
              }}
              transition={{
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut", 
                delay: 1.5 
              }}
              style={{ position: 'relative' }} 
            />
          </motion.div>
        </div>

        <div className="third-content-wrapper">
          <MotionLiquidGlass
            initial={{ opacity: 0, y: 150 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 2, duration: 1, ease: "easeOut" }}
            style={{ width: '100%', maxWidth: '800px', height: '300px' }}
          >
            <h2 className="box-title">보안을 넘어선 새로운 연결</h2>
            <p className="box-desc">
              Agami는 단순한 인증을 넘어 사용자 친화적인 인터페이스와<br/>
              강력한 지능형 보안 엔진을 결합하여 최상의 디지털 환경을 제공합니다.
            </p>
            
            <div className="box-btn-group">
              <BubbleBtn onClick={() => navigate('/price')} variant="fill">
                시작하기
              </BubbleBtn>
              <button className="box-btn secondary" onClick={scrollToFirst}>
                첫 페이지로 돌아가기
              </button>
            </div>
          </MotionLiquidGlass>
        </div>
      </div>
    </div>
  );
};

export default Home;