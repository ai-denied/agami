import React, { useEffect, useMemo, useRef, useState, memo } from "react";
import { motion, useSpring, useMotionValue, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import LiquidGlass from "@/components/LiquidGlass/LiquidGlass";
import BubbleBtn from "@/components/BubbleBtn/BubbleBtn";
import "./Home.css";

const canvasFishImg = new Image(); canvasFishImg.src = "/agami-fish-right.svg";
const canvasBotImg = new Image(); canvasBotImg.src = "/bot-blue.svg";

const FoodBot = memo(({ x, y, color }) => (
  <motion.img src="/bot.svg" className="food-bot"
    initial={{ opacity: 1, top: y, left: x, x: "-50%", y: "-50%", scale: 0.5 }}
    animate={{ y: y + 500, opacity: 0, rotate: 180 }}
    transition={{ duration: 2.5, ease: "linear" }}
    style={{
      filter: `sepia(1) saturate(10) hue-rotate(${color}deg) brightness(1.1)`,
      position: "absolute", zIndex: 15, width: "80px", pointerEvents: "none", willChange: "transform, opacity",
    }}
  />
));
FoodBot.displayName = "FoodBot";

const ScaredFish = memo(({ index, isFeeding, mousePos, allFishRefs, isFirstVisit }) => {
  const fishProps = useMemo(() => {
    const totalFish = 25; const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const t = index / totalFish; const radius = Math.pow(t, 0.6) * 0.5; const angle = index * goldenAngle;
    const centerRatioX = 0.75; const centerRatioY = 0.55;  
    const margin = 400; const side = index % 4; const spreadOffset = (index * 137.5) % 1;
    return {
      scale: 0.45 + (index % 5) * 0.1, side, spreadOffset, margin, angle, radius, centerRatioX, centerRatioY,
      stiffness: 70 + (index % 5) * 10, damping: 38, scareRadius: 180, followRadius: 350, personalSpace: 80,
      floatSpeed: 0.0005 + (index % 7) * 0.0001, floatIntensity: 12 + (index % 4) * 2, phase: index * 0.5
    };
  }, [index]);

  const initialPositions = useMemo(() => {
    const currentW = Math.max(window.innerWidth, 1200); const currentH = Math.max(window.innerHeight, 720);
    const initialX = (fishProps.centerRatioX + Math.cos(fishProps.angle) * fishProps.radius * 0.6) * currentW;
    const initialY = (fishProps.centerRatioY + Math.sin(fishProps.angle) * fishProps.radius) * currentH;
    let startX, startY;
    if (fishProps.side === 0) { startX = currentW + fishProps.margin; startY = fishProps.spreadOffset * currentH; } 
    else if (fishProps.side === 1) { startX = -fishProps.margin; startY = fishProps.spreadOffset * currentH; } 
    else if (fishProps.side === 2) { startX = fishProps.spreadOffset * currentW; startY = -fishProps.margin; } 
    else { startX = fishProps.spreadOffset * currentW; startY = currentH + fishProps.margin; }
    return { startX, startY, initialX, initialY };
  }, [fishProps]);

  const mX = useMotionValue(isFirstVisit ? initialPositions.startX : initialPositions.initialX);
  const mY = useMotionValue(isFirstVisit ? initialPositions.startY : initialPositions.initialY);
  const mRotate = useMotionValue(0);

  const springX = useSpring(mX, { stiffness: fishProps.stiffness, damping: fishProps.damping });
  const springY = useSpring(mY, { stiffness: fishProps.stiffness, damping: fishProps.damping });
  const springRotate = useSpring(mRotate, { stiffness: 120, damping: 25 });

  const isFeedingRef = useRef(isFeeding);
  useEffect(() => { isFeedingRef.current = isFeeding; }, [isFeeding]);

  useEffect(() => {
    allFishRefs.current[index] = { x: mX, y: mY };
    let requestRef; const delayTime = isFirstVisit ? 5500 : 0; let frameCount = 0;

    const animate = (time) => {
      const currentW = Math.max(window.innerWidth, 1200); const currentH = Math.max(window.innerHeight, 720);
      const centerX = currentW * fishProps.centerRatioX; const centerY = currentH * fishProps.centerRatioY;
      const limitRadius = currentW * 0.5; const limitRadiusSq = (limitRadius - 50) * (limitRadius - 50);
      const dynamicInitialX = (fishProps.centerRatioX + Math.cos(fishProps.angle) * fishProps.radius * 0.6) * currentW;
      const dynamicInitialY = (fishProps.centerRatioY + Math.sin(fishProps.angle) * fishProps.radius) * currentH;
      const curX = mX.get(); const curY = mY.get();

      let targetX = dynamicInitialX + Math.sin(time * fishProps.floatSpeed + fishProps.phase) * fishProps.floatIntensity;
      let targetY = dynamicInitialY + Math.cos(time * fishProps.floatSpeed * 0.8 + fishProps.phase) * fishProps.floatIntensity;

      const mouseX = mousePos.current.x; const mouseY = mousePos.current.y;
      const dx = mouseX - curX; const dy = mouseY - curY; const distSq = dx * dx + dy * dy;
      const mDistSq = (mouseX - centerX) * (mouseX - centerX) + (mouseY - centerY) * (mouseY - centerY);
      let speedFactor = 0.02;

      if (mDistSq < limitRadius * limitRadius) {
        if (isFeedingRef.current && distSq < fishProps.followRadius * fishProps.followRadius) {
          speedFactor = 0.07; targetX = mouseX; targetY = mouseY;
        } else if (distSq < fishProps.scareRadius * fishProps.scareRadius) {
          speedFactor = 0.15; const dist = Math.sqrt(distSq);
          if (dist > 0) { targetX = curX - (dx / dist) * (fishProps.scareRadius - dist) * 3; targetY = curY - (dy / dist) * (fishProps.scareRadius - dist) * 3; }
        }
      }

      let sepX = 0; let sepY = 0;
      if (frameCount % 6 === 0) {
        const fishRefs = allFishRefs.current;
        for (let i = 0; i < fishRefs.length; i++) {
          if (i === index || !fishRefs[i]) continue;
          const ox = curX - fishRefs[i].x.get(); const oy = curY - fishRefs[i].y.get();
          const dSq = ox * ox + oy * oy;
          if (dSq < 6400 && dSq > 0) {
            const d = Math.sqrt(dSq); const factor = (80 - d) * 0.5 / d;
            sepX += ox * factor; sepY += oy * factor;
          }
        }
      }

      let nextX = curX + (targetX + sepX - curX) * speedFactor;
      let nextY = curY + (targetY + sepY - curY) * speedFactor;
      const nDx = nextX - centerX; const nDy = nextY - centerY; const nDistSq = nDx * nDx + nDy * nDy;
      
      if (nDistSq > limitRadiusSq) {
        const nDist = Math.sqrt(nDistSq);
        nextX = centerX + (nDx / nDist) * (limitRadius - 50); nextY = centerY + (nDy / nDist) * (limitRadius - 50);
      }

      if (Math.abs(nextX - curX) > 0.05) mRotate.set((Math.atan2(nextY - curY, nextX - curX) * 180) / Math.PI);

      mX.set(nextX); mY.set(nextY); frameCount++; requestRef = requestAnimationFrame(animate);
    };

    const timer = setTimeout(() => { requestRef = requestAnimationFrame(animate); }, delayTime);
    return () => { clearTimeout(timer); cancelAnimationFrame(requestRef); };
  }, [fishProps, index, allFishRefs, isFirstVisit, mX, mY, mRotate, mousePos]);

  return (
    <motion.div className="fish-wrapper" style={{ position: "absolute", left: 0, top: 0, x: springX, y: springY, translateX: "-50%", translateY: "-50%", rotate: springRotate, scale: fishProps.scale, pointerEvents: "none", willChange: "transform", zIndex: 25, }}>
      <img src="/agami-fish.svg" alt="fish" style={{ width: "100px", transform: "scaleX(-1)", display: "block", backfaceVisibility: "hidden", transformStyle: "preserve-3d" }} />
    </motion.div>
  );
});
ScaredFish.displayName = "ScaredFish";

const ParticleNetwork = memo(({ windowSize, isMobile }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    let sphereParticles = []; let bgParticles = []; let animationFrameId;

    const getSphereRadius = () => {
      const currentW = Math.max(windowSize.width, 1200); const currentH = Math.max(windowSize.height, 720);
      return isMobile ? Math.min(currentW, currentH) * 0.35 : Math.min(currentW, currentH) * 0.38;
    };

    const updateCanvasSize = () => {
      canvas.width = isMobile ? windowSize.width : Math.max(windowSize.width, 1200);
      canvas.height = isMobile ? windowSize.height : Math.max(windowSize.height, 720);
      init();
    };

    class BGParticle {
      constructor() {
        this.initPosition(); this.size = 15 + Math.random() * 8;
        this.speedX = Math.random() * 0.4 - 0.2; this.speedY = Math.random() * 0.4 - 0.2;
        this.opacity = 0.8 + Math.random() * 0.2;
      }
      initPosition() {
        const radius = getSphereRadius() + 50; const centerX = canvas.width >> 1; const centerY = canvas.height >> 1;
        let x, y, distSq; const radiusSq = radius * radius;
        do {
          x = Math.random() * canvas.width; y = Math.random() * canvas.height;
          distSq = (x - centerX) * (x - centerX) + (y - centerY) * (y - centerY);
        } while (distSq < radiusSq);
        this.x = x; this.y = y;
      }
      update() {
        this.x += this.speedX; this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        const radius = getSphereRadius() + 50; const centerX = canvas.width >> 1; const centerY = canvas.height >> 1;
        const distSq = (this.x - centerX) * (this.x - centerX) + (this.y - centerY) * (this.y - centerY);
        if (distSq < radius * radius) {
          const angle = Math.atan2(this.y - centerY, this.x - centerX);
          this.x = centerX + Math.cos(angle) * radius; this.y = centerY + Math.sin(angle) * radius;
          this.speedX *= -1; this.speedY *= -1;
        }
      }
      draw() {
        if (!canvasBotImg.complete) return;
        ctx.globalAlpha = this.opacity; ctx.drawImage(canvasBotImg, this.x - (this.size >> 1), this.y - (this.size >> 1), this.size, this.size);
      }
    }

    class SphereParticle {
      constructor(phi, theta, radius) {
        this.phi = phi; this.theta = theta; this.radius = radius;
        this.x = 0; this.y = 0; this.z = 0; this.projectedX = 0; this.projectedY = 0;
        this.baseSize = 20 + Math.random() * 10;
      }
      update(time) {
        const rotationSpeed = time * 0.0004; const currentTheta = this.theta + rotationSpeed; const sinPhi = Math.sin(this.phi);
        this.x = this.radius * sinPhi * Math.cos(currentTheta); this.y = this.radius * Math.cos(this.phi); this.z = this.radius * sinPhi * Math.sin(currentTheta) + this.radius;
        const perspective = 1000 / (1000 + this.z);
        this.projectedX = (canvas.width >> 1) + this.x * perspective;
        // 💡 PC와 동일하게 정중앙에 고정 (올라가는 애니메이션은 바깥의 motion.div가 담당)
        this.projectedY = (canvas.height >> 1) + this.y * perspective;
        this.alpha = perspective;
      }
      draw() {
        if (!canvasFishImg.complete) return;
        ctx.globalAlpha = this.alpha; const size = this.baseSize * this.alpha;
        ctx.drawImage(canvasFishImg, this.projectedX - (size / 2), this.projectedY - (size / 2), size, size);
      }
    }

    const init = () => {
      sphereParticles = []; bgParticles = [];
      const radius = getSphereRadius(); const detail = isMobile ? 6 : 8;
      for (let i = 0; i <= detail; i++) {
        const phi = (Math.PI * i) / detail; const numTheta = Math.max(1, Math.floor(Math.sin(phi) * detail * 2.0));
        for (let j = 0; j < numTheta; j++) {
          const theta = (Math.PI * 2 * j) / numTheta;
          sphereParticles.push(new SphereParticle(phi, theta, radius));
        }
      }
      if (!isMobile) { for (let i = 0; i < 35; i++) bgParticles.push(new BGParticle()); }
    };

    updateCanvasSize();
    
    const drawBGNetwork = () => {
      if(isMobile) return; 
      ctx.lineWidth = 0.8; const bgConnDistSq = 250 * 250; ctx.strokeStyle = `rgba(93, 162, 255, 0.18)`; ctx.beginPath();
      for (let i = 0; i < bgParticles.length; i++) {
        const p1 = bgParticles[i];
        for (let j = i + 1; j < bgParticles.length; j++) {
          const p2 = bgParticles[j];
          if ((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y) < bgConnDistSq) { ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); }
        }
      }
      ctx.stroke();
    };

    const animate = (time) => {
      ctx.globalAlpha = 1.0; ctx.fillStyle = "#010c1b"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < bgParticles.length; i++) { bgParticles[i].update(); bgParticles[i].draw(); }
      drawBGNetwork();
      for (let i = 0; i < sphereParticles.length; i++) { sphereParticles[i].update(time); sphereParticles[i].draw(); }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate(0);
    return () => { cancelAnimationFrame(animationFrameId); };
  }, [windowSize, isMobile]); 

  return <canvas ref={canvasRef} className="particle-canvas" style={{ opacity: 0.8, willChange: "transform", pointerEvents: "none" }} />;
});
ParticleNetwork.displayName = "ParticleNetwork";

const MotionLiquidGlass = motion.create(LiquidGlass);

const Home = () => {
  const navigate = useNavigate();
  const isMobile = window.innerWidth <= 768; 

  const [isFirstVisit, setIsFirstVisit] = useState(null);
  const [isFeeding, setIsFeeding] = useState(false);
  const [hasFed, setHasFed] = useState(false);
  const [foods, setFoods] = useState([]);
  
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const mousePos = useRef({ x: -1000, y: -1000 });
  const allFishRefs = useRef([]);
  const wrapperRef = useRef(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: -500, y: -500 });
  const [targetFishPos, setTargetFishPos] = useState({ x: 50, y: 50 });
  const [isFound, setIsFound] = useState(false);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const forceScrollTop = () => {
      if (wrapperRef.current) wrapperRef.current.scrollTop = 0;
      window.scrollTo(0, 0);
    };
    forceScrollTop();
    // 브라우저 렌더링 딜레이를 이기기 위해 50ms 후 한 번 더 쐐기를 박습니다.
    const timer = setTimeout(forceScrollTop, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let timeoutId = null;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, 100); 
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") || document.createElement("link");
    link.type = "image/x-icon"; link.rel = "shortcut icon"; link.href = "/agami-home.svg";
    document.getElementsByTagName("head")[0].appendChild(link);
  }, []);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("hasVisitedAgami");
    if (hasVisited || isMobile) {
      setIsFirstVisit(false);
      sessionStorage.setItem("hasVisitedAgami", "true");
    } else {
      setIsFirstVisit(true);
      document.body.classList.add("no-scroll");
      const timer = setTimeout(() => {
        sessionStorage.setItem("hasVisitedAgami", "true");
        document.body.classList.remove("no-scroll");
        setIsFirstVisit(false); 
      }, 5500);
      return () => { clearTimeout(timer); document.body.classList.remove("no-scroll"); };
    }
  }, [isMobile]);

  const setRandomFishPos = () => {
    let x, y, isInsideText;
    do {
      x = Math.random() * 80 + 10; y = Math.random() * 80 + 10;
      isInsideText = x > 35 && x < 65 && y > 35 && y < 65;
    } while (isInsideText);
    setTargetFishPos({ x, y }); setIsFound(false);
  };

  useEffect(() => { setRandomFishPos(); }, []);

  useEffect(() => {
    let interval;
    if (isFeeding && !isMobile) { 
      interval = setInterval(() => {
        setFoods((prev) => [ ...prev.slice(-12), { id: Date.now() + Math.random(), x: mousePos.current.x, y: mousePos.current.y, color: Math.floor(Math.random() * 360) } ]);
      }, 450);
    }
    return () => clearInterval(interval);
  }, [isFeeding, isMobile]);

  const updatePointerPos = (clientX, clientY, currentTarget) => {
    const rect = currentTarget.getBoundingClientRect();
    const relX = clientX - rect.left; const relY = clientY - rect.top;
    mousePos.current.get = () => ({ x: relX, y: relY });
    mousePos.current.x = relX; mousePos.current.y = relY;

    const currentW = Math.max(windowSize.width, 1200);
    if (isFeeding && clientX < currentW * 0.5) setIsFeeding(false);
  };

  const handleMouseMove = (e) => updatePointerPos(e.clientX, e.clientY, e.currentTarget);
  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length > 0) updatePointerPos(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
  };

  const lastSecondMv = useRef(0);
  const updateSpotlightPos = (clientX, clientY, currentTarget) => {
    const now = performance.now();
    if (now - lastSecondMv.current < 16) return;
    lastSecondMv.current = now;
    const rect = currentTarget.getBoundingClientRect();
    setSpotlightPos({ x: clientX - rect.left, y: clientY - rect.top });
  };

  const handleSecondMouseMove = (e) => updateSpotlightPos(e.clientX, e.clientY, e.currentTarget);
  const handleSecondTouchMove = (e) => {
    if (e.touches && e.touches.length > 0) updateSpotlightPos(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
  };

  const handleFishClick = (e) => {
    e.stopPropagation();
    if (isFound) return;
    setIsFound(true);
    setTimeout(() => { setRandomFishPos(); }, 1000);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (wrapperRef.current) {
        const scrollY = wrapperRef.current.scrollTop;
        const currentH = Math.max(windowSize.height, 720);
        if (isFeeding && scrollY > currentH * 0.5) setIsFeeding(false);
      }
    };
    const currentWrapper = wrapperRef.current;
    if (currentWrapper) currentWrapper.addEventListener("scroll", handleScroll, { passive: true });
    return () => { if (currentWrapper) currentWrapper.removeEventListener("scroll", handleScroll); };
  }, [isFeeding, windowSize]);

  if (isFirstVisit === null) return null;

  const scrollToFirst = () => { if (wrapperRef.current) wrapperRef.current.scrollTo({ top: 0, behavior: "smooth" }); };
  const scrollToSecond = () => { if (wrapperRef.current) wrapperRef.current.scrollTo({ top: isMobile ? windowSize.height : Math.max(windowSize.height, 720), behavior: "smooth" }); };
  const scrollToThird = () => { if (wrapperRef.current) wrapperRef.current.scrollTo({ top: (isMobile ? windowSize.height : Math.max(windowSize.height, 720)) * 2, behavior: "smooth" }); };

  const toggleFeeding = () => { setIsFeeding(!isFeeding); if (!hasFed) setHasFed(true); };

  const introFishData = [
    { id: 0, top: "25%", size: 110, delay: 1.0 }, { id: 1, top: "75%", size: 90, delay: 1.2 },
    { id: 2, top: "45%", size: 120, delay: 1.4 }, { id: 3, top: "20%", size: 85, delay: 1.1 },
    { id: 4, top: "80%", size: 100, delay: 1.5 }, { id: 5, top: "35%", size: 95, delay: 0.9 },
  ];

  const mainTransition = isFirstVisit ? { delay: 3.5, duration: 1.5, ease: [0.4, 0, 0.2, 1] } : { duration: 0 };

  return (
    <div className="home-main-wrapper" ref={wrapperRef} style={{ contentVisibility: "auto", overflow: isFirstVisit ? "hidden" : "auto" }}>
      <div className="home-container" onMouseMove={handleMouseMove} onTouchMove={handleTouchMove}>
        <motion.div className="circle" initial={isFirstVisit ? { scale: 2.5 } : { scale: 1 }} animate={{ scale: 1 }} transition={mainTransition} style={{ x: "50%", y: "-50%", willChange: "transform" }}>
          <div className="wave-layer-internal" />
        </motion.div>

        {/* 💡 [핵심] PC버전의 maskImage 마스킹을 오리지널 100% 그대로 원상복구 */}
        <div className="fish-scene-layer" style={{ 
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 25,
          maskImage: `radial-gradient(circle 50vmax at 100% 50%, black 100%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(circle 50vmax at 100% 50%, black 100%, transparent 100%)`,
          maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat"
        }}>
          {!isMobile && foods.map((f) => ( <FoodBot key={f.id} x={f.x} y={f.y} color={f.color} /> ))}
          {Array.from({ length: isMobile ? 10 : 18 }).map((_, i) => ( <ScaredFish key={i} index={i} isFeeding={isFeeding} mousePos={mousePos} allFishRefs={allFishRefs} isFirstVisit={isFirstVisit} /> ))}
        </div>

        {isFirstVisit && !isMobile && (
          <>
            <motion.img src="bot.svg" className="actor bot" initial={{ left: "-150px", x: "0%", y: "-50%" }} animate={{ left: ["-150px", "50%", "50%", "120vw"], x: ["0%", "-50%", "-50%", "0%"] }} transition={{ duration: 3, times: [0, 0.3, 0.45, 1], ease: "easeInOut" }} style={{ willChange: "transform, left" }} />
            {introFishData.map((fish) => ( <motion.img key={fish.id} src="agami-fish-right.svg" className="actor fish" style={{ top: fish.top, width: `${fish.size}px`, willChange: "left" }} initial={{ left: "-250px", y: "-50%" }} animate={{ left: "130vw" }} transition={{ delay: fish.delay, duration: 1.8, ease: [0.42, 0, 1, 1] }} /> ))}
          </>
        )}

        {/* 모바일에서는 흰색 원으로 뭉쳐져 로고/버튼을 감싸게 됨 (CSS에서 제어) */}
        <motion.div className="left-section" initial={isFirstVisit ? { x: -1000, opacity: 0 } : { x: 0, opacity: 1 }} animate={{ x: 0, opacity: 1 }} transition={mainTransition} style={{ willChange: "transform, opacity" }}>
          <img src="/agami-text.png" alt="Agami Logo" className="main-logo" />
          <p className="logo-text">봇은 틈새 없이, 유저는 끊김 없이.<br />차세대 지능형 캡챠 서비스</p>
          <BubbleBtn onClick={scrollToSecond} variant="primary">알아보기</BubbleBtn>
        </motion.div>

        {!isMobile && (
          <motion.div className="bot-fixed-area" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: isFirstVisit ? 5 : 0 }}>
            <AnimatePresence>
              {!hasFed && !isFeeding && ( <motion.div className="bot-speech-bubble" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>봇을 클릭 후 마우스를 움직여보세요!</motion.div> )}
            </AnimatePresence>
            <div className={`bot-container ${isFeeding ? "active" : ""}`} onClick={toggleFeeding}><img src="/bot.svg" alt="Bot" className="bot-image" /></div>
          </motion.div>
        )}
      </div>

      <div className="second-container" onMouseMove={handleSecondMouseMove} onTouchMove={handleSecondTouchMove}>
        <div className="light-sea-layer" style={{ maskImage: `radial-gradient(circle 160px at ${spotlightPos.x}px ${spotlightPos.y}px, black 0%, rgba(0, 0, 0, 0.8) 40%, transparent 100%)`, WebkitMaskImage: `radial-gradient(circle 160px at ${spotlightPos.x}px ${spotlightPos.y}px, black 0%, rgba(0, 0, 0, 0.8) 40%, transparent 100%)`, willChange: "mask-image", zIndex: 2 }}>
          <motion.div className="hidden-fish-wrapper" style={{ left: `${targetFishPos.x}%`, top: `${targetFishPos.y}%` }} initial={{ scale: 0 }} animate={{ scale: isFound ? [1, 1.8, 0] : 1, rotate: isFound ? 360 : 0 }} onClick={handleFishClick}>
            <img src="/agami-fish.svg" alt="hidden-fish" className="hidden-fish-img" />
            {isFound && ( <motion.div className="found-effect" initial={{ opacity: 0 }} animate={{ opacity: 1, scale: 2.5 }} exit={{ opacity: 0 }} /> )}
          </motion.div>
        </div>
        <div className="content-box">
          <h1>agami의 혁신적인 기술</h1>
          <p>사용자 경험을 해치지 않는 스마트한 보안 솔루션입니다.</p>
          <span className="game-tip">어둠 속에서 숨겨진 물고기를 찾아보세요!</span>
        </div>
        <motion.button className="scroll-down-btn" onClick={scrollToThird} animate={{ y: [0, 10, 0] }} transition={{ y: { repeat: Infinity, duration: 1.5 } }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#5da2ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13l5 5 5-5M7 6l5 5 5-5" /></svg>
        </motion.button>
      </div>

      <div className="third-container">
        {/* 💡 [핵심] 팝업창과 함께 구체+로고가 살짝 위로 밀려 올라가는 애니메이션 그룹 (모바일 전용) */}
        <motion.div 
          className="sphere-logo-group"
          initial={isMobile ? { y: 100 } : { y: 0 }}
          whileInView={isMobile ? { y: -80 } : { y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 2, duration: 1, ease: "easeOut" }}
          style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}
        >
          <ParticleNetwork windowSize={windowSize} isMobile={isMobile} />

          <div className="third-logo-wrapper">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}>
              <motion.img src="/agami-logo-text.png" alt="Agami Logo Text" className="third-logo" animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} style={{ position: "relative", willChange: "transform" }} />
            </motion.div>
          </div>
        </motion.div>

        <div className="third-content-wrapper">
          <MotionLiquidGlass initial={{ opacity: 0, y: 150 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 2, duration: 1, ease: "easeOut" }} style={{ width: "100%", maxWidth: "800px", willChange: "transform, opacity" }}>
            <h2 className="box-title">보안을 넘어선 새로운 연결</h2>
            <p className="box-desc">agami는 단순한 인증을 넘어 사용자 친화적인 인터페이스와<br />강력한 지능형 보안 엔진을 결합하여 최상의 디지털 환경을 제공합니다.</p>
            <div className="box-btn-group">
              <BubbleBtn onClick={() => navigate("/price")} variant="fill">시작하기</BubbleBtn>
              <button className="box-btn secondary" onClick={scrollToFirst}>첫 페이지로 돌아가기</button>
            </div>
          </MotionLiquidGlass>
        </div>
      </div>
    </div>
  );
};

export default memo(Home);