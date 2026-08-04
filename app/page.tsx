"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Environment, RoundedBox, useGLTF } from "@react-three/drei";
import { Component, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import * as THREE from "three";
import Image from "next/image";
import { useTamaStore, type CareAction, type PetAction } from "../src/store/tamaStore";
import { SCENE, THEME } from "../src/config/experience";
import { ASSETS } from "../src/config/assetManifest";

const buttonMap: Array<{ key: PetAction; color: string; x: number; label: string }> = [
  { key: "call", color: THEME.green, x: -0.72, label: "CARE" },
  { key: "play", color: THEME.orange, x: 0, label: "PLAY" },
  { key: "feel", color: THEME.purple, x: 0.72, label: "FEEL" },
];
type Locale = "en" | "zh";
const UI = {
  en: {
    heroKicker: "A WEBGL DIGITAL COMPANION",
    heroTitleA: "A SIGNAL.",
    heroTitleB: "ALIVE.",
    heroCopy: "Scroll closer. Turn the device. Meet the companion waiting inside.",
    scroll: "SCROLL TO CONNECT",
    signals: "CHOOSE A SIGNAL",
    petKicker: "PET HOME · LIVE CARE LOOP",
    meet: "Meet",
    roomKicker: "ROOM · LIVE 3D SPACE",
    roomTitle: "Meowchi’s little world.",
    storyKicker: "OBJECT 01 · DESIGNED FOR CONNECTION",
    storyTitleA: "Transparent,",
    storyTitleB: "tactile,",
    storyTitleC: "alive.",
  },
  zh: {
    heroKicker: "浏览器里的数字陪伴",
    heroTitleA: "信号。",
    heroTitleB: "正在苏醒。",
    heroCopy: "滚动靠近，转动设备，认识屏幕里等待你的伙伴。",
    scroll: "滚动以建立连接",
    signals: "选择一个互动信号",
    petKicker: "宠物主页 · 实时养成",
    meet: "你好，",
    roomKicker: "宠物小家 · 实时 3D 场景",
    roomTitle: "Meowchi 的小小世界。",
    storyKicker: "产品 01 · 为陪伴而设计",
    storyTitleA: "透明，",
    storyTitleB: "可触，",
    storyTitleC: "有生命。",
  },
} as const;

class ModelErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function PlaceholderDevice() {
  return (
    <group>
      <RoundedBox args={[3.4, 4.55, 0.78]} radius={0.76} smoothness={8}>
        <meshPhysicalMaterial color="#84908c" transparent opacity={0.58} transmission={0.22} roughness={0.32} metalness={0.22} />
      </RoundedBox>
      <RoundedBox args={[2.72, 2.36, 0.12]} radius={0.34} position={[0, 0.38, 0.45]} smoothness={6}>
        <meshStandardMaterial color="#101411" />
      </RoundedBox>
    </group>
  );
}

function FormalDeviceModel() {
  const { scene } = useGLTF(ASSETS.device.full.url);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const tuned = materials.map((material) => {
        const next = material.clone();
        if (next instanceof THREE.MeshStandardMaterial) {
          next.roughness = Math.min(next.roughness, 0.2);
          next.metalness = Math.max(next.metalness, 0.22);
          next.envMapIntensity = 0.62;
        }
        return next;
      });
      object.material = Array.isArray(object.material) ? tuned : tuned[0];
    });
    return clone;
  }, [scene]);
  return (
    <group position={ASSETS.device.full.position} rotation={ASSETS.device.full.rotation} scale={ASSETS.device.full.scale}>
      <Center><primitive object={model} /></Center>
    </group>
  );
}

function Device({ progress }: { progress: number }) {
  const group = useRef<THREE.Group>(null);
  const dragging = useRef(false);
  const dragYaw = useRef(0);
  const lastPointerX = useRef(0);
  const wake = useTamaStore((s) => s.wake);
  useFrame(({ pointer }, delta) => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, -0.16 + progress * 0.18 + pointer.x * 0.035 + dragYaw.current, 3.6, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -0.025 + pointer.y * 0.02, 3.6, delta);
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, progress * 0.48, 3.6, delta);
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, 1.55 + progress * 0.14, 3.6, delta));
  });
  return (
    <group
      ref={group}
      rotation={[-0.025, -0.16, 0]}
      scale={1.55}
      onPointerDown={(event) => {
        event.stopPropagation();
        dragging.current = true;
        lastPointerX.current = event.clientX;
        (event.target as Element).setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return;
        const deltaX = event.clientX - lastPointerX.current;
        lastPointerX.current = event.clientX;
        dragYaw.current += THREE.MathUtils.clamp(deltaX * 0.008, -0.18, 0.18);
      }}
      onPointerUp={(event) => {
        dragging.current = false;
        (event.target as Element).releasePointerCapture?.(event.pointerId);
      }}
    >
      <ModelErrorBoundary fallback={<PlaceholderDevice />}>
        <Suspense fallback={<PlaceholderDevice />}><FormalDeviceModel /></Suspense>
      </ModelErrorBoundary>
      <mesh position={[0.12, 0.42, 0.55]} onPointerDown={(e) => { e.stopPropagation(); wake(); }}>
        <planeGeometry args={[1.86, 1.62]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Scene({ progress }: { progress: number }) {
  return (
    <>
      <color attach="background" args={[THEME.background]} />
      <fog attach="fog" args={[THEME.background, 7, 14]} />
      <ambientLight intensity={0.16} color="#b8c8d4" />
      <directionalLight position={[-4, 6, 5]} intensity={3} color="#edf8ff" />
      <spotLight position={[-4.5, 6, 5]} intensity={34} color="#eef9ff" angle={0.31} penumbra={0.82} />
      <spotLight position={[5.5, 3, -2.5]} intensity={19} color="#9274e2" angle={0.48} penumbra={0.9} />
      <pointLight position={[0, -3.1, 2.6]} intensity={6.4} color={THEME.green} distance={6.8} />
      <Device progress={progress} />
      <Environment preset="studio" environmentIntensity={0.16} />
    </>
  );
}

const careActions: Array<{ id: CareAction; icon: string; title: string; copy: string }> = [
  { id: "feed", icon: "◆", title: "FEED", copy: "Fill that tiny tummy" },
  { id: "play", icon: "✦", title: "PLAY", copy: "Turn energy into joy" },
  { id: "comfort", icon: "≈", title: "COMFORT", copy: "Read the feeling, soften the signal" },
  { id: "clean", icon: "✧", title: "CLEAN", copy: "Fresh fur, clear signal" },
  { id: "sleep", icon: "☾", title: "SLEEP", copy: "Rest and recharge" },
];

const expressionNames = [
  "happy",
  "excited",
  "curious",
  "sleepy",
  "shy",
  "sad",
  "angry",
  "loving",
  "surprised",
  "playful",
] as const;

const bondStages = [
  "NEW SIGNAL",
  "FIRST FRIEND",
  "DIGITAL COMPANION",
  "MEMORY KEEPER",
  "SOUL LINK",
] as const;

function PetExpression({ index, className = "" }: { index: number; className?: string }) {
  const expression = expressionNames[index] ?? expressionNames[0];
  return (
    <span
      className={`pet-expression ${className}`}
      style={{ backgroundImage: `url("/reference/phase-three/expression-${expression}-cutout.png")` }}
      aria-hidden="true"
    />
  );
}

function StarGame({ onClose }: { onClose: () => void }) {
  const [time, setTime] = useState(15);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [star, setStar] = useState({ x: 50, y: 45, id: 0 });
  const finishGame = useTamaStore((s) => s.finishGame);
  const finished = useRef(false);
  const lastCatch = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTime((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (time > 0 || finished.current) return;
    finished.current = true;
    finishGame(score);
  }, [time, score, finishGame]);

  const catchStar = () => {
    if (time === 0) return;
    const now = performance.now();
    const nextCombo = now - lastCatch.current < 1200 ? Math.min(4, combo + 1) : 1;
    lastCatch.current = now;
    setCombo(nextCombo);
    setScore((value) => value + nextCombo);
    setStar((current) => ({
      x: 12 + Math.random() * 76,
      y: 16 + Math.random() * 64,
      id: current.id + 1,
    }));
  };

  return (
    <div className="game-overlay" role="dialog" aria-modal="true" aria-label="Catch the signal mini game">
      <div className="game-window">
        <header><div><p className="eyebrow">PLAY MODE · SIGNAL CATCH</p><h3>{time > 0 ? "Catch the stars." : "Signal complete!"}</h3></div><button onClick={onClose} aria-label="Close game">×</button></header>
        <div className="game-hud"><span>TIME <b>{String(time).padStart(2, "0")}</b></span><span>SCORE <b>{String(score).padStart(2, "0")}</b></span><span>COMBO <b>×{combo}</b></span><span>REWARD <b>+{score * 12}</b></span></div>
        <div className="playfield">
          <div className="scanline" />
          {time > 0 ? (
            <button key={star.id} className="catch-star" style={{ left: `${star.x}%`, top: `${star.y}%` }} onClick={catchStar} aria-label="Catch star">★</button>
          ) : (
            <div className="game-result"><PetExpression index={score >= 8 ? 1 : 0} className="result-expression" /><strong>{score}</strong><span>STARS CAUGHT</span><small>+{score * 12} stardust · fun +{score * 2}</small><button onClick={onClose}>RETURN TO MEOWCHI</button></div>
          )}
          <Image src="/reference/phase-three/pet-play-cutout.png" alt="" width={1024} height={1024} />
        </div>
        <footer>CLICK / TAP THE STAR BEFORE IT JUMPS · 15 SECOND ROUND</footer>
      </div>
    </div>
  );
}

function FeedChallenge({ onComplete, onClose }: { onComplete: (quality: number) => void; onClose: () => void }) {
  const foods = [
    { name: "STRAWBERRY", note: "Bright + playful", artwork: "/reference/phase-three/food-strawberry-slice.png" },
    { name: "PUDDING", note: "Soft + comforting", artwork: "/reference/phase-three/food-pudding.png" },
  ];
  const [selected, setSelected] = useState<(typeof foods)[number] | null>(null);
  const [quality, setQuality] = useState<number | null>(null);
  const started = useRef(0);
  useEffect(() => {
    if (selected) started.current = performance.now();
  }, [selected]);
  const stopMeter = () => {
    const phase = ((performance.now() - started.current) % 2200) / 2200;
    const position = phase <= 0.5 ? phase * 200 : (1 - phase) * 200;
    setQuality(Math.max(0.5, 1.5 - Math.abs(position - 50) / 50));
  };
  return (
    <div className="game-overlay" role="dialog" aria-modal="true" aria-label="Feed timing challenge">
      <div className="food-window">
        <header><div><p className="eyebrow">FEED MODE · SWEET SPOT</p><h3>{selected ? "Serve it just right." : "Choose a treat."}</h3></div><button onClick={onClose} aria-label="Close food picker">×</button></header>
        {!selected ? (
          <div className="food-grid">
            {foods.map((food) => (
              <button key={food.name} onClick={() => setSelected(food)}>
                <div className="food-model food-artwork"><Image src={food.artwork} alt={food.name} fill sizes="(max-width: 800px) 90vw, 390px" /></div>
                <b>{food.name}</b><small>{food.note}</small><span>SELECT TREAT →</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="timing-challenge">
            <div className="selected-food"><div className="food-model food-artwork selected"><Image src={selected.artwork} alt={selected.name} fill sizes="(max-width: 800px) 90vw, 390px" /></div><b>{selected.name}</b></div>
            <div className="timing-panel">
              <p>STOP THE SIGNAL INSIDE THE LIME ZONE</p>
              <div className={`timing-meter ${quality !== null ? "stopped" : ""}`}><i /><span /></div>
              {quality === null ? <button onClick={stopMeter}>LOCK SERVE TIMING</button> : <div className="challenge-result"><strong>{quality > 1.28 ? "PERFECT SERVE!" : quality > .9 ? "NICE TIMING" : "MESSY, BUT TASTY"}</strong><small>REWARD ×{quality.toFixed(2)}</small><button onClick={() => onComplete(quality)}>GIVE TO MEOWCHI</button></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const cleanSpots = [
  { left: 20, top: 28 }, { left: 72, top: 22 }, { left: 48, top: 38 },
  { left: 30, top: 63 }, { left: 66, top: 68 }, { left: 50, top: 82 },
];

function CleanChallenge({ onComplete, onClose }: { onComplete: (quality: number) => void; onClose: () => void }) {
  const [remaining, setRemaining] = useState(cleanSpots.map((_, index) => index));
  const [time, setTime] = useState(12);
  const [quality, setQuality] = useState<number | null>(null);
  const remainingCount = useRef(cleanSpots.length);
  useEffect(() => {
    if (quality !== null) return;
    const timer = window.setInterval(() => setTime((value) => {
      if (value <= 1) {
        window.clearInterval(timer);
        setQuality(0.5 + (cleanSpots.length - remainingCount.current) / 12);
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [quality]);
  const clearSpot = (index: number) => {
    const next = remaining.filter((item) => item !== index);
    remainingCount.current = next.length;
    setRemaining(next);
    if (next.length === 0) setQuality(Math.min(1.5, 1 + time / 24));
  };
  return (
    <div className="game-overlay" role="dialog" aria-modal="true" aria-label="Clean pet challenge">
      <div className="care-game-window">
        <header><div><p className="eyebrow">CLEAN MODE · SIGNAL POLISH</p><h3>Tap every glitch spot.</h3></div><button onClick={onClose} aria-label="Close clean game">×</button></header>
        <div className="care-game-hud"><span>TIME <b>{String(time).padStart(2, "0")}</b></span><span>CLEARED <b>{cleanSpots.length - remaining.length}/{cleanSpots.length}</b></span></div>
        <div className="clean-field">
          <Image src="/reference/phase-two/pet-front.png" alt="Meowchi" width={1024} height={1024} />
          {remaining.map((index) => <button key={index} style={{ left: `${cleanSpots[index].left}%`, top: `${cleanSpots[index].top}%` }} onClick={() => clearSpot(index)} aria-label="Clean glitch spot"><i /></button>)}
          {quality !== null && <div className="challenge-result floating"><strong>{remaining.length === 0 ? "SIGNAL SPARKLING!" : "PARTIAL CLEAN"}</strong><small>REWARD ×{quality.toFixed(2)}</small><button onClick={() => onComplete(quality)}>COMPLETE CLEAN</button></div>}
        </div>
      </div>
    </div>
  );
}

function SleepChallenge({ onComplete, onClose }: { onComplete: (quality: number) => void; onClose: () => void }) {
  const [hits, setHits] = useState<number[]>([]);
  const [quality, setQuality] = useState<number | null>(null);
  const started = useRef(0);
  useEffect(() => {
    started.current = performance.now();
  }, []);
  const tapBeat = () => {
    if (quality !== null) return;
    const phase = ((performance.now() - started.current) % 1800) / 1800;
    const distance = Math.min(phase, 1 - phase);
    const accuracy = Math.max(0, 1 - distance * 4);
    const next = [...hits, accuracy];
    setHits(next);
    if (next.length === 5) setQuality(0.5 + next.reduce((sum, value) => sum + value, 0) / next.length);
  };
  return (
    <div className="game-overlay" role="dialog" aria-modal="true" aria-label="Sleep rhythm challenge">
      <div className="care-game-window sleep-window">
        <header><div><p className="eyebrow">SLEEP MODE · DREAM SYNC</p><h3>Tap with the breathing light.</h3></div><button onClick={onClose} aria-label="Close sleep game">×</button></header>
        <div className="sleep-field">
          <button className="breath-orb" onClick={tapBeat} disabled={quality !== null}><i /><span>TAP</span></button>
          <div className="beat-notes">{[0, 1, 2, 3, 4].map((index) => <i key={index} className={hits[index] === undefined ? "" : hits[index] > .7 ? "perfect" : "hit"} />)}</div>
          <p>Follow five slow pulses. Tap when the rings meet.</p>
          {quality !== null && <div className="challenge-result"><strong>{quality > 1.28 ? "DREAM SYNC PERFECT" : quality > .9 ? "PEACEFUL RHYTHM" : "RESTLESS, STILL COZY"}</strong><small>REWARD ×{quality.toFixed(2)}</small><button onClick={() => onComplete(quality)}>TUCK MEOWCHI IN</button></div>}
        </div>
      </div>
    </div>
  );
}

const comfortMoods = [
  { key: "sleepy", index: 3, label: "TIRED", zh: "困倦", hint: "Slow down and stay close." },
  { key: "shy", index: 4, label: "SHY", zh: "害羞", hint: "Give a little space, not silence." },
  { key: "sad", index: 5, label: "SAD", zh: "难过", hint: "A gentle signal is enough." },
  { key: "angry", index: 6, label: "OVERLOADED", zh: "过载", hint: "Let the feeling pass before fixing it." },
  { key: "curious", index: 2, label: "CURIOUS", zh: "好奇", hint: "Follow the small spark." },
] as const;

function ComfortChallenge({ locale, onComplete, onClose }: { locale: Locale; onComplete: (quality: number) => void; onClose: () => void }) {
  const [target] = useState(() => comfortMoods[Math.floor(Math.random() * comfortMoods.length)]);
  const [phase, setPhase] = useState<"read" | "soothe" | "done">("read");
  const [wrong, setWrong] = useState<string | null>(null);
  const [pulses, setPulses] = useState(0);
  const choices = useMemo(() => {
    const targetIndex = comfortMoods.findIndex((item) => item.key === target.key);
    const others = [comfortMoods[(targetIndex + 2) % comfortMoods.length], comfortMoods[(targetIndex + 3) % comfortMoods.length]];
    return targetIndex % 2 === 0 ? [others[0], target, others[1]] : [target, others[0], others[1]];
  }, [target]);
  const chooseMood = (key: string) => {
    if (key === target.key) {
      setWrong(null);
      setPhase("soothe");
    } else {
      setWrong(key);
      window.setTimeout(() => setWrong(null), 700);
    }
  };
  const soothe = () => {
    const next = pulses + 1;
    setPulses(next);
    if (next >= 4) setPhase("done");
  };
  return (
    <div className="game-overlay comfort-overlay" role="dialog" aria-modal="true" aria-label="Emotional comfort ritual">
      <div className="comfort-window">
        <header><div><p className="eyebrow">FEEL MODE · EMOTION TUNING</p><h3>{phase === "read" ? (locale === "zh" ? "先读懂它的情绪。" : "Read the feeling first.") : phase === "soothe" ? (locale === "zh" ? "跟着呼吸，轻轻安抚。" : "Stay with the breathing signal.") : (locale === "zh" ? "信号慢下来了。" : "The signal feels softer.")}</h3></div><button onClick={onClose} aria-label="Close comfort ritual">×</button></header>
        <div className={`comfort-body phase-${phase}`}>
          <div className="comfort-pet">
            <PetExpression index={phase === "done" ? 7 : target.index} className="comfort-expression" />
            <div className="comfort-waves"><i /><i /><i /></div>
            <small>{phase === "done" ? "SAFE SIGNAL · RECEIVED" : target.hint}</small>
          </div>
          {phase === "read" && <div className="mood-choice"><p>{locale === "zh" ? "你觉得 Meowchi 现在是什么感受？" : "What do you think Meowchi is feeling?"}</p>{choices.map((choice) => <button key={choice.key} className={wrong === choice.key ? "wrong" : ""} onClick={() => chooseMood(choice.key)}><span>{choice.index === 3 ? "— ω —" : choice.index === 5 ? "T_T" : choice.index === 6 ? ">:(" : choice.index === 4 ? "> <" : "o o"}</span><b>{locale === "zh" ? choice.zh : choice.label}</b></button>)}</div>}
          {phase === "soothe" && <div className="soothe-ritual"><p>{locale === "zh" ? "每次光环收拢时，点一下。" : "Tap as each slow breath arrives."}</p><button onClick={soothe} className="soothe-orb"><i /><span>{pulses + 1} / 4</span></button><div className="soothe-progress">{[0, 1, 2, 3].map((item) => <i key={item} className={item < pulses ? "done" : ""} />)}</div></div>}
          {phase === "done" && <div className="comfort-complete"><strong>{locale === "zh" ? "你没有替它解决情绪，只是陪它待了一会儿。" : "You did not fix the feeling. You stayed with it."}</strong><small>BOND + · SIGNAL ENERGY + · MEMORY TRACE</small><button onClick={() => onComplete(1.35)}>{locale === "zh" ? "保存这次安抚" : "KEEP THIS MOMENT"}</button></div>}
        </div>
      </div>
    </div>
  );
}

function TouchPet({ locale, action }: { locale: Locale; action: PetAction }) {
  const receiveTouch = useTamaStore((state) => state.receiveTouch);
  const [expression, setExpression] = useState(2);
  const [message, setMessage] = useState(locale === "zh" ? "摸摸头、脸颊或小肚子" : "TOUCH HEAD · CHEEK · TUMMY");
  const [ripple, setRipple] = useState(0);
  const lastReward = useRef(0);
  const visibleExpression = action === "play" ? 9 : action === "feel" ? 7 : action === "call" ? 1 : expression;
  const touch = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const zone = y < 0.42 ? "head" : x < 0.3 || x > 0.7 ? "cheek" : "tummy";
    const feedback = zone === "head"
      ? { index: 7, en: "PURR… I FEEL SAFE.", zh: "呼噜……这里很安心。" }
      : zone === "cheek"
        ? { index: 9, en: "TICKLY! AGAIN?", zh: "好痒！还要再来吗？" }
        : { index: 0, en: "WARM SIGNAL RECEIVED.", zh: "收到一枚暖暖的信号。" };
    setExpression(feedback.index);
    setMessage(locale === "zh" ? feedback.zh : feedback.en);
    setRipple((value) => value + 1);
    const now = performance.now();
    if (now - lastReward.current > 900) {
      receiveTouch();
      lastReward.current = now;
    }
  };
  return (
    <div className="touch-companion">
      <button
        className="touch-pet"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty("--touch-x", `${event.clientX - rect.left}px`);
          event.currentTarget.style.setProperty("--touch-y", `${event.clientY - rect.top}px`);
        }}
        onPointerDown={touch}
        aria-label="Touch Meowchi to see an emotional response"
      >
        <span key={ripple} className="fur-ripple" />
        <span className="fur-light" />
        <PetExpression index={visibleExpression} className="touch-expression" />
        <span className="touch-crosshair">+</span>
      </button>
      <div className="touch-feedback"><i /> <span>{message}</span><small>{locale === "zh" ? "触摸会改变毛绒高光与表情" : "FUR LIGHT + EXPRESSION RESPOND TO TOUCH"}</small></div>
    </div>
  );
}

function CareHub({ locale }: { locale: Locale }) {
  const [gameOpen, setGameOpen] = useState(false);
  const [foodOpen, setFoodOpen] = useState(false);
  const [comfortOpen, setComfortOpen] = useState(false);
  const [cleanOpen, setCleanOpen] = useState(false);
  const [sleepOpen, setSleepOpen] = useState(false);
  const [eventNotice, setEventNotice] = useState<"gift" | "meteor" | "visitor" | null>(null);
  const stats = useTamaStore((s) => s.stats);
  const bond = useTamaStore((s) => s.bond);
  const stardust = useTamaStore((s) => s.stardust);
  const lastCare = useTamaStore((s) => s.lastCare);
  const action = useTamaStore((s) => s.action);
  const equippedCharm = useTamaStore((s) => s.equippedCharm);
  const care = useTamaStore((s) => s.care);
  const equipCharm = useTamaStore((s) => s.equipCharm);
  const careCount = useTamaStore((s) => s.careCount);
  const gameBest = useTamaStore((s) => s.gameBest);
  const dailyClaimed = useTamaStore((s) => s.dailyClaimed);
  const claimDaily = useTamaStore((s) => s.claimDaily);
  const signalEnergy = useTamaStore((s) => s.signalEnergy);
  const careCombo = useTamaStore((s) => s.careCombo);
  const request = useTamaStore((s) => s.request);
  const memories = useTamaStore((s) => s.memories);
  const eventCount = useTamaStore((s) => s.eventCount);
  const triggerRandomEvent = useTamaStore((s) => s.triggerRandomEvent);
  const activateSignalBurst = useTamaStore((s) => s.activateSignalBurst);
  const completeCare = (careAction: CareAction, quality: number) => {
    care(careAction, quality);
    setFoodOpen(false);
    setComfortOpen(false);
    setCleanOpen(false);
    setSleepOpen(false);
    if (Math.random() < 0.34) {
      const events = ["gift", "meteor", "visitor"] as const;
      const event = events[Math.floor(Math.random() * events.length)];
      triggerRandomEvent(event);
      setEventNotice(event);
      window.setTimeout(() => setEventNotice(null), 4200);
    }
  };
  const mood = bond > 82 ? "radiant" : bond > 64 ? "content" : "curious";
  const bondLevel = Math.min(5, Math.max(1, Math.ceil(bond / 20)));
  const careCopy = locale === "zh" ? {
    feed: ["喂食", "选择点心，填饱肚子"],
    play: ["玩耍", "进入接星星小游戏"],
    comfort: ["安抚", "读懂情绪，陪它慢下来"],
    clean: ["清洁", "让毛发重新闪亮"],
    sleep: ["睡觉", "休息并恢复精力"],
  } : {
    feed: ["FEED", "Fill that tiny tummy"],
    play: ["PLAY", "Turn energy into joy"],
    comfort: ["COMFORT", "Read the feeling, soften the signal"],
    clean: ["CLEAN", "Fresh fur, clear signal"],
    sleep: ["SLEEP", "Rest and recharge"],
  };
  const statRows = [
    [locale === "zh" ? "饱食" : "HUNGER", stats.hunger],
    [locale === "zh" ? "快乐" : "FUN", stats.fun],
    [locale === "zh" ? "清洁" : "CLEAN", stats.clean],
    [locale === "zh" ? "睡眠" : "SLEEP", stats.sleep],
  ] as const;

  return (
    <section className="care-hub" id="pet-home">
      <div className="hub-heading">
        <div>
          <p className="eyebrow">{UI[locale].petKicker}</p>
          <h2>{UI[locale].meet} <span>Meowchi.</span></h2>
        </div>
        <div className="currency"><i /> {stardust.toLocaleString()} <small>STARDUST</small></div>
      </div>

      <div className="signal-console">
        <div className="pet-request">
          <span className="request-pulse" />
          <div><small>{locale === "zh" ? "MEOWCHI 当前想要" : "MEOWCHI WANTS"}</small><b>{careCopy[request][0]}</b></div>
          <em>{locale === "zh" ? "完成请求可获得额外能量与亲密度" : "Match the request for bonus energy + bond"}</em>
        </div>
        <div className="signal-energy">
          <div><span>{locale === "zh" ? "信号能量" : "SIGNAL ENERGY"}</span><strong>{signalEnergy}%</strong></div>
          <div className="energy-track"><i style={{ width: `${signalEnergy}%` }} /></div>
          <small>{locale === "zh" ? `连续组合 ×${careCombo} · 回忆 ${memories} · 奇遇 ${eventCount}` : `CARE COMBO ×${careCombo} · MEMORIES ${memories} · EVENTS ${eventCount}`}</small>
        </div>
        <button className={signalEnergy >= 100 ? "ready" : ""} disabled={signalEnergy < 100 || action !== "idle"} onClick={activateSignalBurst}>
          <span>✦</span><b>{locale === "zh" ? "释放信号爆发" : "ACTIVATE SIGNAL BURST"}</b><small>{signalEnergy >= 100 ? (locale === "zh" ? "领取回忆与奖励" : "CLAIM MEMORY + REWARD") : (locale === "zh" ? "能量达到 100% 后解锁" : "CHARGE TO 100%")}</small>
        </button>
      </div>

      <div className="hub-layout">
        <aside className="hub-column">
          <div className="panel status-panel">
            <div className="panel-title"><span>♡</span> {locale === "zh" ? "状态" : "STATUS"} <small>{locale === "zh" ? "实时" : "LIVE"}</small></div>
            {statRows.map(([label, value]) => (
              <div className="stat-row" key={label}>
                <b>{label}</b>
                <div className="stat-track"><span style={{ width: `${value}%` }} /></div>
                <strong>{value}%</strong>
              </div>
            ))}
          </div>
          <div className="panel mood-panel">
            <div className="panel-title"><span>◉</span> {locale === "zh" ? "心情" : "MOOD"}</div>
            <p>{locale === "zh" ? (mood === "radiant" ? "闪闪发光" : mood === "content" ? "满足" : "好奇") : mood}</p>
            <PetExpression index={mood === "radiant" ? 7 : mood === "content" ? 0 : 2} className="mood-expression" />
            <small>Bond responds to every care action.</small>
          </div>
        </aside>

        <div className="pet-stage">
          <div className={`pet-aura ${action !== "idle" ? "active" : ""}`} />
          <div className="expression-orbit" aria-hidden="true">
            <PetExpression index={0} className="orbit-expression orbit-a" />
            <PetExpression index={1} className="orbit-expression orbit-b" />
            <PetExpression index={7} className="orbit-expression orbit-c" />
            <PetExpression index={9} className="orbit-expression orbit-d" />
          </div>
          <TouchPet locale={locale} action={action} />
          <div className="pet-message" data-visible={action !== "idle"}>
            <PetExpression index={lastCare === "feed" ? 7 : lastCare === "play" ? 9 : lastCare === "comfort" ? 0 : lastCare === "clean" ? 0 : lastCare === "sleep" ? 3 : 2} className="feedback-expression" />
            <span>{lastCare === "feed" ? "YUM! +18 HUNGER" : lastCare === "play" ? "WHEE! +14 FUN" : lastCare === "comfort" ? "SAFE… +8 CALM" : lastCare === "clean" ? "SPARKLY! +22 CLEAN" : lastCare === "sleep" ? "ZZZ… +24 SLEEP" : "SIGNAL RECEIVED"}</span>
          </div>
          <div className="bond-card">
            <span>♥</span>
            <div><small>BOND LV. {String(bondLevel).padStart(2, "0")} · {bondStages[bondLevel - 1]}</small><div className="bond-track"><i style={{ width: `${bond}%` }} /></div></div>
            <strong>{bond}%</strong>
          </div>
        </div>

        <aside className="hub-column right">
          <div className="panel charms-panel">
            <div className="panel-title"><span>⌁</span> {locale === "zh" ? "挂件" : "CHARMS"} <small>2 / 2</small></div>
            <div className="charm-grid">
              <button className={equippedCharm === "lucky-star" ? "selected" : ""} onClick={() => equipCharm("lucky-star")}>
                <b>★</b><span>Lucky Star</span><small>{equippedCharm === "lucky-star" ? "EQUIPPED" : "EQUIP"}</small>
              </button>
              <button className={equippedCharm === "glow-cube" ? "selected" : ""} onClick={() => equipCharm("glow-cube")}>
                <b>♥</b><span>Glow Cube</span><small>{equippedCharm === "glow-cube" ? "EQUIPPED" : "EQUIP"}</small>
              </button>
              <button className={`${equippedCharm === "rainy-day" ? "selected" : ""} ${gameBest < 8 ? "locked" : ""}`} onClick={() => equipCharm("rainy-day")}>
                <b>☂</b><span>Rainy Day</span><small>{gameBest < 8 ? `${gameBest}/8 STARS` : equippedCharm === "rainy-day" ? "EQUIPPED" : "UNLOCKED"}</small>
              </button>
            </div>
          </div>
          <div className="panel actions-panel">
            <div className="panel-title"><span>↳</span> {locale === "zh" ? "养成操作" : "CARE ACTIONS"}</div>
            {careActions.map((item) => (
              <button key={item.id} onClick={() => item.id === "play" ? setGameOpen(true) : item.id === "feed" ? setFoodOpen(true) : item.id === "comfort" ? setComfortOpen(true) : item.id === "clean" ? setCleanOpen(true) : setSleepOpen(true)} disabled={action !== "idle"} className={lastCare === item.id ? "active" : ""}>
                <i>{item.icon}</i><span><b>{careCopy[item.id][0]}</b><small>{careCopy[item.id][1]}</small></span>
              </button>
            ))}
          </div>
        </aside>
      </div>
      <div className="daily-strip">
        <div><p className="eyebrow">{locale === "zh" ? "每日连接 · 01" : "DAILY LINK · 01"}</p><h3>{locale === "zh" ? "完成今天的陪伴任务。" : "Complete today’s care signal."}</h3></div>
        <div className={careCount >= 3 ? "done" : ""}><span>01</span><b>CARE ×3</b><small>{Math.min(careCount, 3)} / 3</small></div>
        <div className={gameBest >= 5 ? "done" : ""}><span>02</span><b>CATCH ×5</b><small>{Math.min(gameBest, 5)} / 5</small></div>
        <button disabled={dailyClaimed || careCount < 3 || gameBest < 5} onClick={claimDaily}>{dailyClaimed ? "CLAIMED ✓" : "CLAIM +250"}</button>
      </div>
      <div className="memory-strip">
        <header>
          <p className="eyebrow">{locale === "zh" ? "回忆档案 · 奖励收藏" : "MEMORY ARCHIVE · REWARD COLLECTION"}</p>
          <h3>{locale === "zh" ? "把陪伴变成可收藏的故事。" : "Turn care into collectible stories."}</h3>
          <small>{locale === "zh" ? "每次释放信号爆发解锁一枚回忆碎片。" : "Every Signal Burst unlocks one memory fragment."}</small>
        </header>
        {[1, 3, 5].map((threshold, index) => {
          const unlocked = memories >= threshold;
          return (
            <article className={`memory-card ${unlocked ? "unlocked" : "locked"}`} key={threshold}>
              <div className="memory-art">{unlocked ? `MEMORY SIGNAL 0${index + 1}` : "ILLUSTRATION SLOT"}</div>
              <b>{locale === "zh" ? ["初次连接", "深夜零食", "秘密花园"][index] : ["FIRST LINK", "MIDNIGHT SNACK", "SECRET GARDEN"][index]}</b>
              <small>{unlocked ? (locale === "zh" ? "已捕获" : "CAPTURED") : `${memories} / ${threshold} BURSTS`}</small>
            </article>
          );
        })}
      </div>
      {gameOpen && <StarGame onClose={() => setGameOpen(false)} />}
      {foodOpen && <FeedChallenge onClose={() => setFoodOpen(false)} onComplete={(quality) => completeCare("feed", quality)} />}
      {comfortOpen && <ComfortChallenge locale={locale} onClose={() => setComfortOpen(false)} onComplete={(quality) => completeCare("comfort", quality)} />}
      {cleanOpen && <CleanChallenge onClose={() => setCleanOpen(false)} onComplete={(quality) => completeCare("clean", quality)} />}
      {sleepOpen && <SleepChallenge onClose={() => setSleepOpen(false)} onComplete={(quality) => completeCare("sleep", quality)} />}
      {eventNotice && (
        <div className={`random-event ${eventNotice}`}>
          <PetExpression index={eventNotice === "gift" ? 8 : eventNotice === "meteor" ? 1 : 2} className="event-expression" />
          <div><small>RARE SIGNAL DETECTED</small><b>{eventNotice === "gift" ? "MYSTERY GIFT" : eventNotice === "meteor" ? "PIXEL METEOR" : "TINY VISITOR"}</b><span>Bonus stardust · energy +12 · bond +2</span></div>
          <button onClick={() => setEventNotice(null)} aria-label="Dismiss event">×</button>
        </div>
      )}
    </section>
  );
}

function PixelCursor() {
  const cursor = useRef<HTMLDivElement>(null);
  const [pixels, setPixels] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const last = useRef(0);
  useEffect(() => {
    let id = 0;
    const move = (event: PointerEvent) => {
      if (cursor.current) cursor.current.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`;
      const now = performance.now();
      if (now - last.current < 38) return;
      last.current = now;
      const point = { x: event.clientX, y: event.clientY, id: id++ };
      setPixels((current) => [...current.slice(-9), point]);
      window.setTimeout(() => setPixels((current) => current.filter((item) => item.id !== point.id)), 420);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <div className="pixel-cursor-layer" aria-hidden="true">
      {pixels.map((pixel, index) => <i key={pixel.id} style={{ left: pixel.x, top: pixel.y, opacity: (index + 1) / pixels.length }} />)}
      <div ref={cursor} className="pixel-cursor"><span /></div>
    </div>
  );
}

type RoomMode = "black" | "white";

function RoomEnvironmentModel({ mode }: { mode: RoomMode }) {
  const { scene } = useGLTF(mode === "black" ? ASSETS.scenes.petHomeBlack : ASSETS.scenes.petHomeWhite);
  const model = useMemo(() => scene.clone(true), [scene]);
  return <group scale={4.4} position={[-0.1, -0.25, -0.85]} rotation={[0, Math.PI / 4, 0]}><Center><primitive object={model} /></Center></group>;
}

function PetRoom({ locale }: { locale: Locale }) {
  const [mode, setMode] = useState<RoomMode>("black");
  const lighting = mode === "black"
    ? { key: "#a887ff", fill: "#b8ff5f", label: "BLACK ROOM", bonus: "+ CURIOUS" }
    : { key: "#fff1cf", fill: "#b8d9ff", label: "WHITE ROOM", bonus: "+ HAPPY" };
  return (
    <section className={`pet-room theme-${mode}`} id="room">
      <div className="room-head">
        <div><p className="eyebrow">{UI[locale].roomKicker}</p><h2>{UI[locale].roomTitle}</h2></div>
        <div className="theme-switcher">
          {(["black", "white"] as const).map((item) => (
            <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>
              {item === "black" ? (locale === "zh" ? "黑色空间" : "BLACK MODE") : (locale === "zh" ? "白色空间" : "WHITE MODE")}
            </button>
          ))}
        </div>
      </div>
      <div className="room-stage">
        <Canvas camera={{ position: [0, 0.45, 6], fov: 42 }} dpr={[1, 1.5]}>
          <color attach="background" args={[mode === "black" ? "#020403" : "#e9ede6"]} />
          <ambientLight intensity={mode === "black" ? 0.72 : 1.32} color={mode === "black" ? "#d9d4ff" : "#fff8e8"} />
          <spotLight position={[-4, 6, 4]} intensity={22} color={lighting.key} angle={0.5} penumbra={1} />
          <spotLight position={[5, 2, 3]} intensity={10} color={lighting.fill} angle={0.5} penumbra={1} />
          <pointLight position={[0, 0.2, 2]} intensity={mode === "black" ? 5 : 8} color="#fff1d5" distance={5} />
          <ModelErrorBoundary fallback={<></>}><Suspense fallback={null}><RoomEnvironmentModel key={mode} mode={mode} /></Suspense></ModelErrorBoundary>
          <Environment preset={mode === "black" ? "night" : "apartment"} environmentIntensity={mode === "black" ? 0.28 : 0.48} />
        </Canvas>
        <Image className="room-pet-sprite" src="/reference/phase-three/pet-play-cutout.png" alt="Meowchi in the selected room" width={1024} height={1024} />
        <div className="room-badge"><i /> {lighting.label}<small>MODEL SPACE ACTIVE</small></div>
        <div className="room-effect">{lighting.bonus}<small>{mode === "black" ? "NIGHT CURIOSITY BOOST" : "COZY MOOD BOOST"}</small></div>
        <div className="room-controls"><span>45° ROOM VIEW</span><span>SPACE AFFECTS MOOD</span></div>
      </div>
    </section>
  );
}

function ProductStory({ locale }: { locale: Locale }) {
  return (
    <section className="product-story">
      <div className="story-copy">
        <p className="eyebrow">{UI[locale].storyKicker}</p>
        <h2>{UI[locale].storyTitleA}<br />{UI[locale].storyTitleB} <span>{UI[locale].storyTitleC}</span></h2>
        <p>{locale === "zh" ? "透明外壳展示内部结构，三枚颜色不同的按钮把陪伴变成可以触摸的仪式，每次按压都会得到不同的情绪回应。" : "The shell reveals the technology inside while three color-coded buttons turn care into a physical ritual. Every press has a different emotional response."}</p>
        <div className="material-list">
          <span><i className="swatch shell" /> TRANSPARENT PC</span>
          <span><i className="swatch lime" /> LIME SIGNAL</span>
          <span><i className="swatch amber" /> AMBER PLAY</span>
          <span><i className="swatch violet" /> VIOLET FEEL</span>
        </div>
      </div>
      <div className="device-gallery">
        <Image src="/reference/phase-two/device-back-reference.png" alt="TAMA LINK transparent device back view" width={1024} height={1365} />
        <div className="gallery-label"><span>360° OBJECT STUDY</span><small>MODEL IN PRODUCTION</small></div>
      </div>
    </section>
  );
}

function ProjectRationale({ locale }: { locale: Locale }) {
  const zh = locale === "zh";
  const [activeTab, setActiveTab] = useState<"context" | "system" | "ai" | "series">("context");
  const projectTabs = zh ? [
    ["context", "项目缘起", "WHY NOW"],
    ["system", "体验系统", "PRODUCT LOOP"],
    ["ai", "AI 方法", "HUMAN / AI"],
    ["series", "影像叙事", "SHORT VIDEO"],
  ] as const : [
    ["context", "CONTEXT", "WHY NOW"],
    ["system", "EXPERIENCE", "PRODUCT LOOP"],
    ["ai", "AI METHOD", "HUMAN / AI"],
    ["series", "VIDEO STORY", "SHORT FORM"],
  ] as const;
  const opportunity = zh ? [
    ["从惩罚转向陪伴", "经典电子宠物依赖饥饿、生病与死亡制造压力；新的数字陪伴更适合用回应、记忆和低压力回访建立关系。"],
    ["从点击转向触感", "拖动设备、按下实体按钮、抚摸毛绒与跟随呼吸，让浏览器交互重新获得身体感。"],
    ["从日活转向小仪式", "产品不要求长时间在线，只提供 30–90 秒的情绪签到、安抚与一段可保存的回忆。"],
  ] : [
    ["FROM PUNISHMENT TO CARE", "Classic virtual pets create pressure through hunger, illness and loss. A modern companion can build return through response, memory and low-pressure care."],
    ["FROM CLICKS TO TOUCH", "Dragging the device, pressing physical buttons, brushing fur and following breath gives a browser interaction a body again."],
    ["FROM DAU TO RITUAL", "The product asks for 30–90 seconds: check a feeling, offer comfort and keep one small memory—not endless engagement."],
  ];
  const episodes = zh ? [
    ["01", "为什么数字宠物又回来了", "怀旧只是入口，真正回归的是对轻关系与低压力陪伴的需要。"],
    ["02", "把电子宠物做成 WebGL 设备", "拆解设备、场景、2D 表情与状态系统，形成可替换的资产管线。"],
    ["03", "设计可被触摸的情绪", "比较点击按钮与触摸毛绒反馈，迭代表情、光线、声音与触点。"],
    ["04", "AI Coding 如何改变设计过程", "让 AI 加速结构与变体，把人的时间留给判断、审美与伦理。"],
    ["05", "不把陪伴做成控制", "复盘数据边界、情绪误读、成瘾机制与非医疗声明。"],
  ] : [
    ["01", "WHY DIGITAL PETS RETURN", "Nostalgia opens the door; the deeper need is light connection without social pressure."],
    ["02", "BUILDING A WEBGL COMPANION", "A replaceable pipeline joins device, room, 2D expression and persistent state."],
    ["03", "DESIGNING TOUCHABLE EMOTION", "Touch points, fur light, expressions, sound and motion are tested as one response."],
    ["04", "WHAT AI CODING CHANGES", "AI accelerates structure and variants so human time stays with judgment, taste and ethics."],
    ["05", "CARE WITHOUT CONTROL", "The closing reflection covers data limits, misread emotion, dark patterns and non-clinical scope."],
  ];
  return (
    <section className="rationale-section" id="why-tama-link">
      <nav className="project-tabs" aria-label={zh ? "项目探索页签" : "Project exploration tabs"}>
        <div><p className="eyebrow">TAMA LINK · CASE STUDY</p><span>{zh ? "从体验原型到产品论证" : "FROM EXPERIENCE PROTOTYPE TO PRODUCT ARGUMENT"}</span></div>
        {projectTabs.map(([key, label, note], index) => <button key={key} className={activeTab === key ? "active" : ""} onClick={() => setActiveTab(key)}><i>0{index + 1}</i><b>{label}</b><small>{note}</small></button>)}
      </nav>
      <header className="rationale-hero" hidden={activeTab !== "context"}>
        <p className="eyebrow">{zh ? "项目背景 · 为什么是现在" : "PROJECT CONTEXT · WHY NOW"}</p>
        <h2>{zh ? <>怀旧不是答案。<br />被回应的需要，<span>一直都在。</span></> : <>Nostalgia is not the answer.<br />The need to be <span>answered</span> is.</>}</h2>
        <p>{zh ? "TAMA LINK 不是把拓麻歌子的玩法搬进网页，也不是一款医疗产品。它探索的是：当硬件感、角色关系、短时减压和浏览器原生交互重新组合，数字宠物能否成为一个每天愿意打开几十秒的情绪接口。" : "TAMA LINK is neither a browser remake of Tamagotchi nor a medical product. It asks whether hardware tactility, character relationship, short decompression and browser-native interaction can become an emotional interface worth opening for a minute each day."}</p>
      </header>
      <div className="context-signal" hidden={activeTab !== "context"}>
        <div className="context-year"><small>2018</small><strong>QQ PET</strong><span>{zh ? "停止运营" : "SERVICE ENDS"}</span></div>
        <i />
        <div className="context-year active"><small>2026</small><strong>{zh ? "数字宠物回归" : "DIGITAL PET RETURN"}</strong><span>{zh ? "3D · 触摸反馈 · AI 性格 · 日记" : "3D · TOUCH · AI PERSONA · DIARY"}</span></div>
        <i />
        <div className="context-year tama"><small>NEXT</small><strong>TAMA LINK</strong><span>{zh ? "可触摸的浏览器陪伴" : "A TOUCHABLE WEB COMPANION"}</span></div>
      </div>
      <div className="opportunity-grid" hidden={activeTab !== "context"}>
        {opportunity.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}
      </div>
      <div className="value-loop" hidden={activeTab !== "system"}>
        <div className="value-copy"><p className="eyebrow">{zh ? "核心价值 · 不是治愈承诺" : "CORE VALUE · NOT A CURE CLAIM"}</p><h3>{zh ? "把情绪照护缩小成一枚可以完成的信号。" : "Make emotional care small enough to complete."}</h3><p>{zh ? "研究提示，与动物或虚拟角色互动可能支持部分情绪体验与社会临场感，但证据仍复杂。产品因此只承诺轻量自我觉察、放松和关系反馈，不诊断，不替代专业帮助。" : "Research suggests that animal or virtual-companion interaction may support aspects of affect and social presence, while the evidence remains nuanced. The product promises only light self-awareness, decompression and relational feedback—never diagnosis or replacement for professional care."}</p></div>
        <div className="loop-orbit">
          <div><span>01</span><b>{zh ? "触摸" : "TOUCH"}</b><small>{zh ? "身体输入" : "embodied input"}</small></div>
          <div><span>02</span><b>{zh ? "理解" : "READ"}</b><small>{zh ? "辨认感受" : "notice feeling"}</small></div>
          <div><span>03</span><b>{zh ? "安抚" : "SOOTHE"}</b><small>{zh ? "呼吸同步" : "co-regulate"}</small></div>
          <div><span>04</span><b>{zh ? "记住" : "REMEMBER"}</b><small>{zh ? "关系延续" : "relationship trace"}</small></div>
          <PetExpression index={7} className="loop-expression" />
        </div>
      </div>
      <div className="ai-boundary" hidden={activeTab !== "ai"}>
        <header><p className="eyebrow">{zh ? "AI CODING · 工作方法与边界" : "AI CODING · METHOD AND BOUNDARY"}</p><h3>{zh ? "AI 扩大探索，人负责方向。" : "AI expands exploration. People own direction."}</h3></header>
        <article><small>HUMAN</small><b>{zh ? "定义意义" : "DEFINE MEANING"}</b><p>{zh ? "设定情绪意图、产品伦理、品牌审美、交互取舍与最终验收。" : "Emotional intent, ethics, brand taste, interaction trade-offs and final acceptance."}</p></article>
        <article><small>AI</small><b>{zh ? "加速成形" : "ACCELERATE FORM"}</b><p>{zh ? "生成工程骨架、状态逻辑、原型变体、资产接入与重复性检查。" : "Scaffolding, state logic, prototype variants, asset integration and repetitive checks."}</p></article>
        <article className="shared"><small>SHARED</small><b>{zh ? "持续批评" : "ITERATE CRITICALLY"}</b><p>{zh ? "人提出可验证的判断，AI 快速实现，再用真实体验推翻或保留方案。" : "A person frames a testable judgment, AI implements quickly, and lived experience rejects or keeps it."}</p></article>
        <footer>{zh ? "数据边界：当前体验默认本地存储，不推断心理状态，不上传情绪记录；未来若引入模型，必须取得明确授权并允许删除。" : "DATA BOUNDARY: state stays local by default. No psychological inference, no emotional-record upload. Any future model requires explicit consent and deletion controls."}</footer>
      </div>
      <div className="video-arc" hidden={activeTab !== "series"}>
        <header><p className="eyebrow">{zh ? "短视频叙事 · 从问题到反思" : "SHORT-FORM SERIES · PROBLEM TO REFLECTION"}</p><h3>{zh ? "让制作过程本身成为作品。" : "Make the making part of the work."}</h3></header>
        {episodes.map(([number, title, copy]) => <article key={number}><span>{number}</span><div><b>{title}</b><p>{copy}</p></div></article>)}
      </div>
      <div className="research-notes" hidden={activeTab !== "context"}>
        <p className="eyebrow">{zh ? "研究依据 · 延伸阅读" : "RESEARCH NOTES · FURTHER READING"}</p>
        <a href="https://app.dahecube.com/nweb/spider/20260727/828870ncdd43bef3c9.htm?artid=828870" target="_blank" rel="noreferrer"><span>01</span><b>{zh ? "QQ 宠物于 2026 年 7 月正式回归" : "QQ Pet officially returned in July 2026"}</b><small>Dahe Cube · Tencent QQ announcement</small></a>
        <a href="https://www.iheima.com/article-400043.html" target="_blank" rel="noreferrer"><span>02</span><b>{zh ? "3D 触摸反馈、AI 性格、宠物日记与跨界面陪伴" : "3D touch, AI persona, pet diary and cross-interface companionship"}</b><small>iHeima · product feature report</small></a>
        <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8388427/" target="_blank" rel="noreferrer"><span>03</span><b>{zh ? "伴侣动物与压力情境下的情绪缓冲研究" : "Companion animals and affect under stress"}</b><small>Peer-reviewed experience sampling study</small></a>
        <a href="https://www.sciencedirect.com/science/article/pii/S1875952125000382" target="_blank" rel="noreferrer"><span>04</span><b>{zh ? "虚拟宠物在娱乐之外的健康与学习应用综述" : "Review of virtual pets beyond entertainment"}</b><small>Entertainment Computing · 2025 review</small></a>
      </div>
    </section>
  );
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem("tama-link-locale");
    return saved === "zh" || saved === "en" ? saved : "en";
  });
  const [target, setTarget] = useState(0);
  const [progress, setProgress] = useState(0);
  const action = useTamaStore((s) => s.action);
  const awake = useTamaStore((s) => s.awake);
  const bond = useTamaStore((s) => s.bond);
  const trigger = useTamaStore((s) => s.trigger);
  const reset = useTamaStore((s) => s.reset);
  const frame = useRef<number | null>(null);
  const reduced = useMemo(() => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const copy = UI[locale];
  const changeLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    window.localStorage.setItem("tama-link-locale", nextLocale);
  };

  useEffect(() => {
    const animate = () => {
      setProgress((p) => {
        const next = reduced ? target : THREE.MathUtils.lerp(p, target, 0.075);
        return Math.abs(next - target) < 0.001 ? target : next;
      });
      frame.current = requestAnimationFrame(animate);
    };
    frame.current = requestAnimationFrame(animate);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [target, reduced]);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (window.scrollY < window.innerHeight * 0.5 && (target < 1 || event.deltaY < 0)) {
        event.preventDefault();
        setTarget((v) => THREE.MathUtils.clamp(v + event.deltaY * SCENE.wheelSensitivity, 0, 1));
      }
    };
    const onKey = (event: KeyboardEvent) => {
      const mapping: Record<string, PetAction> = { a: "call", s: "play", d: "feel" };
      if (mapping[event.key.toLowerCase()]) trigger(mapping[event.key.toLowerCase()]);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("wheel", onWheel); window.removeEventListener("keydown", onKey); };
  }, [target, trigger]);

  return (
    <main>
      <PixelCursor />
      <section className="hero">
        <header className="topbar">
          <a className="brand" href="#top" aria-label="TAMA LINK home">TAMA LINK</a>
          <div className="top-actions">
            <div className="locale-switch" aria-label="Language">
              <button className={locale === "en" ? "active" : ""} onClick={() => changeLocale("en")}>EN</button>
              <button className={locale === "zh" ? "active" : ""} onClick={() => changeLocale("zh")}>中文</button>
            </div>
            <button className="connect-button" onClick={() => setTarget(1)}><i /> {progress > 0.92 ? "CONNECTED" : "CONNECT"}</button>
          </div>
        </header>
        <div className="copy" style={{ opacity: 1 - progress * 1.35 }}>
          <p className="eyebrow">{copy.heroKicker}</p>
          <h1>{copy.heroTitleA}<br /><em>{copy.heroTitleB}</em></h1>
          <p className="lede">{copy.heroCopy}</p>
          <div className="scroll-cue" style={{ opacity: Math.max(0, 1 - progress * 8) }}><span>{copy.scroll}</span><b>↓</b></div>
        </div>
        <div className="signal-thread" style={{ opacity: Math.max(0, 0.38 - progress * 0.6) }} />
        <div className="canvas-wrap"><Canvas camera={{ position: [0, 0, 8], fov: 38 }} dpr={[1, 1.6]}><Scene progress={progress} /></Canvas></div>
        <div className="device-readout" style={{ opacity: Math.max(0.2, 1 - progress * 0.7) }}>
          <small>COMPANION SIGNAL</small><b>MEOWCHI · ONLINE</b><span>BOND {bond}%</span>
        </div>
        <div className="object-cue" style={{ opacity: Math.max(0, 1 - progress * 2.4) }}><span>DRAG TO ROTATE</span><i /> <span>SCROLL TO ENTER</span></div>
        <div className="near-hint" data-visible={progress > 0.62}><span>PRESS A BUTTON</span><b>CARE · PLAY · FEEL</b></div>
        <div className="hero-controls" data-visible={progress > 0.66}>
          {buttonMap.map((item) => (
            <button key={item.key} onClick={() => trigger(item.key)} style={{ "--signal-color": item.color } as CSSProperties}>
              <i /> <span>{item.label}<small>{item.key === "call" ? (locale === "zh" ? "照顾" : "CARE SIGNAL") : item.key === "play" ? (locale === "zh" ? "玩耍" : "HAPPY JUMP") : (locale === "zh" ? "情绪" : "SHARE A FEELING")}</small></span>
            </button>
          ))}
        </div>
        <div className="action-readout" data-visible={action !== "idle"}>{action === "call" ? "CARE · SIGNAL RECEIVED" : action === "play" ? "PLAY · HAPPY JUMP" : action === "feel" ? "FEEL · MOOD SIGNAL" : ""}</div>
        <div className="progress"><span style={{ transform: `scaleX(${progress})` }} /></div>
      </section>
      <CareHub locale={locale} />
      <PetRoom locale={locale} />
      <ProductStory locale={locale} />
      <ProjectRationale locale={locale} />
      <section className="home-section">
        <div>
          <p className="eyebrow">PHASE 02 · SYSTEM READY</p>
          <h2>{awake ? "Your care loop\nis now active." : "Tap the screen\nto wake your pet."}</h2>
          <p>Feed, play, clean and rest now update Meowchi’s persistent state. Formal 3D models can replace the visual layer without rewriting this loop.</p>
          <button onClick={reset}>RESET LINK</button>
        </div>
        <div className="signal-grid">
          {buttonMap.map((item, index) => <article key={item.key}><span>0{index + 1}</span><b style={{ color: item.color }}>{item.label}</b><p>{index === 0 ? "Come closer" : index === 1 ? "Jump & play" : "Share a feeling"}</p></article>)}
        </div>
      </section>
    </main>
  );
}
