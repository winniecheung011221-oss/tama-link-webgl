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
    heroKicker: "一只住在浏览器里的电子宠物",
    heroTitleA: "信号抵达。",
    heroTitleB: "陪伴苏醒。",
    heroCopy: "滚动靠近，转动设备。屏幕另一端，有个小家伙正在等你回应。",
    scroll: "向下滚动，建立连接",
    signals: "选择一种回应方式",
    petKicker: "MEOWCHI 的家 · 今日陪伴",
    meet: "今天也来看看",
    roomKicker: "可探索房间 · 点击场景移动",
    roomTitle: "Meowchi 的房间，会回应你的选择。",
    storyKicker: "产品设计 · 把陪伴做成可触摸的物件",
    storyTitleA: "结构可见，",
    storyTitleB: "触摸有回应，",
    storyTitleC: "关系会生长。",
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

function StarGame({ locale, onClose }: { locale: Locale; onClose: () => void }) {
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
        <header><div><p className="eyebrow">{locale === "zh" ? "玩耍模式 · 接住星光" : "PLAY MODE · SIGNAL CATCH"}</p><h3>{time > 0 ? (locale === "zh" ? "接住跳动的星星。" : "Catch the stars.") : (locale === "zh" ? "这次信号收集完成。" : "Signal complete!")}</h3></div><button onClick={onClose} aria-label="Close game">×</button></header>
        <div className="game-hud"><span>{locale === "zh" ? "时间" : "TIME"} <b>{String(time).padStart(2, "0")}</b></span><span>{locale === "zh" ? "得分" : "SCORE"} <b>{String(score).padStart(2, "0")}</b></span><span>{locale === "zh" ? "连击" : "COMBO"} <b>×{combo}</b></span><span>{locale === "zh" ? "奖励" : "REWARD"} <b>+{score * 12}</b></span></div>
        <div className="playfield">
          <div className="scanline" />
          {time > 0 ? (
            <button key={star.id} className="catch-star" style={{ left: `${star.x}%`, top: `${star.y}%` }} onClick={catchStar} aria-label="Catch star">★</button>
          ) : (
            <div className="game-result"><PetExpression index={score >= 8 ? 1 : 0} className="result-expression" /><strong>{score}</strong><span>{locale === "zh" ? "颗星星被接住" : "STARS CAUGHT"}</span><small>+{score * 12} {locale === "zh" ? "星尘 · 快乐" : "stardust · fun"} +{score * 2}</small><button onClick={onClose}>{locale === "zh" ? "回到 MEOWCHI 身边" : "RETURN TO MEOWCHI"}</button></div>
          )}
          <Image src="/reference/phase-three/expression-playful-cutout.png" alt="" width={1024} height={1024} />
        </div>
        <footer>{locale === "zh" ? "在星星跳走前点中它 · 每局 15 秒" : "CLICK / TAP THE STAR BEFORE IT JUMPS · 15 SECOND ROUND"}</footer>
      </div>
    </div>
  );
}

function FeedChallenge({ locale, onComplete, onClose }: { locale: Locale; onComplete: (quality: number) => void; onClose: () => void }) {
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
        <header><div><p className="eyebrow">{locale === "zh" ? "喂食模式 · 刚刚好的甜度" : "FEED MODE · SWEET SPOT"}</p><h3>{selected ? (locale === "zh" ? "抓住最合适的投喂时机。" : "Serve it just right.") : (locale === "zh" ? "今天想请它吃什么？" : "Choose a treat.")}</h3></div><button onClick={onClose} aria-label="Close food picker">×</button></header>
        {!selected ? (
          <div className="food-grid">
            {foods.map((food) => (
              <button key={food.name} onClick={() => setSelected(food)}>
                <div className="food-model food-artwork"><Image src={food.artwork} alt={food.name} fill sizes="(max-width: 800px) 90vw, 390px" /></div>
                <b>{locale === "zh" ? (food.name === "STRAWBERRY" ? "草莓" : "布丁") : food.name}</b><small>{locale === "zh" ? (food.name === "STRAWBERRY" ? "清甜、活泼" : "柔软、安心") : food.note}</small><span>{locale === "zh" ? "选择这份点心 →" : "SELECT TREAT →"}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="timing-challenge">
            <div className="selected-food"><div className="food-model food-artwork selected"><Image src={selected.artwork} alt={selected.name} fill sizes="(max-width: 800px) 90vw, 390px" /></div><b>{selected.name}</b></div>
            <div className="timing-panel">
              <p>{locale === "zh" ? "让游标停在绿色甜蜜区" : "STOP THE SIGNAL INSIDE THE LIME ZONE"}</p>
              <div className={`timing-meter ${quality !== null ? "stopped" : ""}`}><i /><span /></div>
              {quality === null ? <button onClick={stopMeter}>{locale === "zh" ? "就是现在" : "LOCK SERVE TIMING"}</button> : <div className="challenge-result"><strong>{locale === "zh" ? (quality > 1.28 ? "刚刚好！" : quality > .9 ? "时机不错" : "有点手忙脚乱，但很好吃") : (quality > 1.28 ? "PERFECT SERVE!" : quality > .9 ? "NICE TIMING" : "MESSY, BUT TASTY")}</strong><small>{locale === "zh" ? "奖励倍率" : "REWARD"} ×{quality.toFixed(2)}</small><button onClick={() => onComplete(quality)}>{locale === "zh" ? "递给 MEOWCHI" : "GIVE TO MEOWCHI"}</button></div>}
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

function CleanChallenge({ locale, onComplete, onClose }: { locale: Locale; onComplete: (quality: number) => void; onClose: () => void }) {
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
        <header><div><p className="eyebrow">{locale === "zh" ? "清洁模式 · 泡泡护理" : "CLEAN MODE · BUBBLE GROOM"}</p><h3>{locale === "zh" ? "点掉毛球，再用泡泡洗干净。" : "Clear the fluff knots with bubbles."}</h3></div><button onClick={onClose} aria-label="Close clean game">×</button></header>
        <div className="care-game-hud"><span>{locale === "zh" ? "剩余时间" : "TIME"} <b>{String(time).padStart(2, "0")}</b></span><span>{locale === "zh" ? "已清理" : "CLEARED"} <b>{cleanSpots.length - remaining.length}/{cleanSpots.length}</b></span></div>
        <div className="clean-field">
          <div className="soap-bubbles" aria-hidden="true">{[0,1,2,3,4,5,6].map((bubble) => <i key={bubble} />)}</div>
          <Image src="/reference/phase-three/expression-happy-cutout.png" alt="Meowchi" width={1024} height={1024} />
          {remaining.map((index) => <button key={index} className="fluff-knot" style={{ left: `${cleanSpots[index].left}%`, top: `${cleanSpots[index].top}%` }} onClick={() => clearSpot(index)} aria-label="Clean fluff knot"><i /></button>)}
          {quality !== null && <div className="challenge-result floating"><strong>{locale === "zh" ? (remaining.length === 0 ? "毛毛蓬松得会发光！" : "还有几处毛球，下次继续") : (remaining.length === 0 ? "FUR FLUFFY AND BRIGHT!" : "PARTIAL GROOM")}</strong><small>{locale === "zh" ? "奖励倍率" : "REWARD"} ×{quality.toFixed(2)}</small><button onClick={() => onComplete(quality)}>{locale === "zh" ? "完成清洁" : "COMPLETE CLEAN"}</button></div>}
        </div>
      </div>
    </div>
  );
}

function SleepChallenge({ locale, onComplete, onClose }: { locale: Locale; onComplete: (quality: number) => void; onClose: () => void }) {
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
        <header><div><p className="eyebrow">{locale === "zh" ? "睡眠模式 · 呼吸同步" : "SLEEP MODE · DREAM SYNC"}</p><h3>{locale === "zh" ? "跟着呼吸光，慢慢安静下来。" : "Tap with the breathing light."}</h3></div><button onClick={onClose} aria-label="Close sleep game">×</button></header>
        <div className="sleep-field">
          <button className="breath-orb" onClick={tapBeat} disabled={quality !== null}><i /><span>TAP</span></button>
          <div className="beat-notes">{[0, 1, 2, 3, 4].map((index) => <i key={index} className={hits[index] === undefined ? "" : hits[index] > .7 ? "perfect" : "hit"} />)}</div>
          <p>{locale === "zh" ? "跟随五次缓慢脉冲，在光环重合时轻点。" : "Follow five slow pulses. Tap when the rings meet."}</p>
          {quality !== null && <div className="challenge-result"><strong>{locale === "zh" ? (quality > 1.28 ? "呼吸完全同步" : quality > .9 ? "节奏很平静" : "没关系，慢下来就好") : (quality > 1.28 ? "DREAM SYNC PERFECT" : quality > .9 ? "PEACEFUL RHYTHM" : "RESTLESS, STILL COZY")}</strong><small>{locale === "zh" ? "奖励倍率" : "REWARD"} ×{quality.toFixed(2)}</small><button onClick={() => onComplete(quality)}>{locale === "zh" ? "陪 MEOWCHI 入睡" : "TUCK MEOWCHI IN"}</button></div>}
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
  const [touchBurst, setTouchBurst] = useState({ id: 0, x: 50, y: 42, zone: "head" });
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
    setTouchBurst((value) => ({ id: value.id + 1, x: x * 100, y: y * 100, zone }));
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
        {touchBurst.id > 0 && (
          <span
            key={touchBurst.id}
            className={`touch-pixel-burst zone-${touchBurst.zone}`}
            style={{ left: `${touchBurst.x}%`, top: `${touchBurst.y}%` }}
            aria-hidden="true"
          >
            <b>{touchBurst.zone === "head" ? "PURR +1" : touchBurst.zone === "cheek" ? "MEW!" : "BOND +1"}</b>
            {Array.from({ length: 8 }, (_, index) => <i key={index} />)}
          </span>
        )}
        <span className="fur-light" />
        <PetExpression index={visibleExpression} className={`touch-expression${visibleExpression === 7 ? " is-loving" : ""}`} />
        {visibleExpression === 7 && <PetExpression index={7} className="touch-expression love-heart-repair" />}
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
  const [charmNotice, setCharmNotice] = useState("");
  const [memoryOpen, setMemoryOpen] = useState<number | null>(null);
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
  const chooseCharm = (charm: "lucky-star" | "glow-cube" | "rainy-day") => {
    const locked = charm === "rainy-day" && gameBest < 8;
    if (!locked) equipCharm(charm);
    setCharmNotice(locked
      ? (locale === "zh" ? `再接住 ${8 - gameBest} 颗星即可解锁「雨天」` : `CATCH ${8 - gameBest} MORE STARS TO UNLOCK`)
      : (locale === "zh" ? `已佩戴：${charm === "lucky-star" ? "幸运星" : charm === "glow-cube" ? "发光方块" : "雨天云朵"}` : `${charm.replaceAll("-", " ").toUpperCase()} EQUIPPED`));
    window.setTimeout(() => setCharmNotice(""), 2400);
  };
  const mood = bond > 82 ? "radiant" : bond > 64 ? "content" : "curious";
  const bondLevel = Math.min(5, Math.max(1, Math.ceil(bond / 20)));
  const careCopy = locale === "zh" ? {
    feed: ["投喂", "选一份点心，抓住最佳投喂时机"],
    play: ["接星星", "追逐跳动信号，连击赢得星尘"],
    comfort: ["听懂它", "辨认情绪，陪它完成四次慢呼吸"],
    clean: ["泡泡护理", "点掉毛球，把毛毛洗得蓬松发亮"],
    sleep: ["陪它入睡", "跟随呼吸光，完成一段安静节奏"],
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
            <small>{locale === "zh" ? "每一次回应，都会改变你们的亲密度。" : "Bond responds to every care action."}</small>
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
            <div className="panel-title"><span>⌁</span> {locale === "zh" ? "随身挂件" : "CHARMS"} <small>{2 + (gameBest >= 8 ? 1 : 0)} / 3</small></div>
            <div className="charm-grid">
              <button className={equippedCharm === "lucky-star" ? "selected" : ""} onClick={() => chooseCharm("lucky-star")}>
                <b>★</b><span>{locale === "zh" ? "幸运星" : "Lucky Star"}</span><small>{equippedCharm === "lucky-star" ? (locale === "zh" ? "佩戴中" : "EQUIPPED") : (locale === "zh" ? "点击佩戴" : "EQUIP")}</small>
              </button>
              <button className={equippedCharm === "glow-cube" ? "selected" : ""} onClick={() => chooseCharm("glow-cube")}>
                <b>♥</b><span>{locale === "zh" ? "发光方块" : "Glow Cube"}</span><small>{equippedCharm === "glow-cube" ? (locale === "zh" ? "佩戴中" : "EQUIPPED") : (locale === "zh" ? "点击佩戴" : "EQUIP")}</small>
              </button>
              <button className={`${equippedCharm === "rainy-day" ? "selected" : ""} ${gameBest < 8 ? "locked" : ""}`} onClick={() => chooseCharm("rainy-day")}>
                <b>☂</b><span>{locale === "zh" ? "雨天云朵" : "Rainy Day"}</span><small>{gameBest < 8 ? `${gameBest}/8 ${locale === "zh" ? "颗星" : "STARS"}` : equippedCharm === "rainy-day" ? (locale === "zh" ? "佩戴中" : "EQUIPPED") : (locale === "zh" ? "已解锁" : "UNLOCKED")}</small>
              </button>
            </div>
            <div className="charm-notice" data-visible={Boolean(charmNotice)} aria-live="polite"><i />{charmNotice || (locale === "zh" ? "点击挂件即可更换" : "CLICK A CHARM TO EQUIP")}</div>
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
      <div className="memory-strip" id="memories">
        <header>
          <p className="eyebrow">{locale === "zh" ? "回忆档案 · 奖励收藏" : "MEMORY ARCHIVE · REWARD COLLECTION"}</p>
          <h3>{locale === "zh" ? "把陪伴变成可收藏的故事。" : "Turn care into collectible stories."}</h3>
          <small>{locale === "zh" ? "每次释放信号爆发解锁一枚回忆碎片。" : "Every Signal Burst unlocks one memory fragment."}</small>
        </header>
        {[1, 3, 5].map((threshold, index) => {
          const unlocked = memories >= threshold;
          const memoryImages = ["/reference/phase-three/expression-curious-cutout.png", "/reference/phase-three/food-pudding.png", "/reference/phase-three/expression-loving-cutout.png"];
          const memoryCopies = locale === "zh"
            ? ["第一次触摸屏幕时，它把你的回应记成了一颗小小的光。", "那天很晚，你们分完一份布丁，房间里只剩柔软的呼吸声。", "当亲密度足够高，房间会长出一座只属于你们的秘密花园。"]
            : ["Your first touch became a tiny light it chose to keep.", "It was late when you shared pudding and listened to the room breathe.", "With enough bond, the room grows a secret garden for the two of you."];
          return (
            <button className={`memory-card ${unlocked ? "unlocked" : "locked"}`} key={threshold} onClick={() => unlocked && setMemoryOpen(index)}>
              <div className="memory-art"><img src={memoryImages[index]} alt="" /><span>{unlocked ? `MEMORY 0${index + 1}` : `${memories} / ${threshold}`}</span></div>
              <b>{locale === "zh" ? ["初次连接", "深夜零食", "秘密花园"][index] : ["FIRST LINK", "MIDNIGHT SNACK", "SECRET GARDEN"][index]}</b>
              <small>{unlocked ? (locale === "zh" ? "点击翻开这段回忆" : "OPEN THIS MEMORY") : (locale === "zh" ? `还需 ${threshold - memories} 次信号爆发` : `${threshold - memories} MORE SIGNAL BURSTS`)}</small>
              <p>{memoryCopies[index]}</p>
            </button>
          );
        })}
      </div>
      {memoryOpen !== null && <div className="game-overlay" role="dialog" aria-modal="true"><div className="memory-modal"><button onClick={() => setMemoryOpen(null)} aria-label="Close memory">×</button><img src={["/reference/phase-three/expression-curious-cutout.png", "/reference/phase-three/food-pudding.png", "/reference/phase-three/expression-loving-cutout.png"][memoryOpen]} alt="" /><p className="eyebrow">MEMORY 0{memoryOpen + 1}</p><h3>{locale === "zh" ? ["第一次有人回应", "一份深夜布丁", "会生长的房间"][memoryOpen] : ["THE FIRST ANSWER", "MIDNIGHT PUDDING", "A ROOM THAT GROWS"][memoryOpen]}</h3></div></div>}
      {gameOpen && <StarGame locale={locale} onClose={() => setGameOpen(false)} />}
      {foodOpen && <FeedChallenge locale={locale} onClose={() => setFoodOpen(false)} onComplete={(quality) => completeCare("feed", quality)} />}
      {comfortOpen && <ComfortChallenge locale={locale} onClose={() => setComfortOpen(false)} onComplete={(quality) => completeCare("comfort", quality)} />}
      {cleanOpen && <CleanChallenge locale={locale} onClose={() => setCleanOpen(false)} onComplete={(quality) => completeCare("clean", quality)} />}
      {sleepOpen && <SleepChallenge locale={locale} onClose={() => setSleepOpen(false)} onComplete={(quality) => completeCare("sleep", quality)} />}
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
  return <group scale={5.65} position={[-0.05, -0.42, -0.72]} rotation={[0, Math.PI / 4, 0]}><Center><primitive object={model} /></Center></group>;
}

function PetRoom({ locale }: { locale: Locale }) {
  const [mode, setMode] = useState<RoomMode>("black");
  const [petPosition, setPetPosition] = useState({ x: 50, y: 76 });
  const [walking, setWalking] = useState(false);
  const [roomFeedback, setRoomFeedback] = useState({ id: 0, fromX: 50, fromY: 76, x: 50, y: 76 });
  const walkTimer = useRef<number | null>(null);
  const lighting = mode === "black"
    ? { key: "#a887ff", fill: "#b8ff5f", label: "BLACK ROOM", bonus: "+ CURIOUS" }
    : { key: "#fff1cf", fill: "#b8d9ff", label: "WHITE ROOM", bonus: "+ HAPPY" };
  const walkPet = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(14, Math.min(86, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(42, Math.min(82, ((event.clientY - rect.top) / rect.height) * 100));
    setRoomFeedback((value) => ({ id: value.id + 1, fromX: petPosition.x, fromY: petPosition.y, x, y }));
    setPetPosition({ x, y });
    setWalking(true);
    if (walkTimer.current) window.clearTimeout(walkTimer.current);
    walkTimer.current = window.setTimeout(() => setWalking(false), 900);
  };
  return (
    <section className={`pet-room theme-${mode}`} id="room">
      <div className="room-head">
        <div><p className="eyebrow">{UI[locale].roomKicker}</p><h2>{UI[locale].roomTitle}</h2></div>
        <div className="theme-switcher">
          {(["black", "white"] as const).map((item) => (
            <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>
              {item === "black" ? (locale === "zh" ? "夜间房间" : "BLACK MODE") : (locale === "zh" ? "日光房间" : "WHITE MODE")}
            </button>
          ))}
        </div>
      </div>
      <div className="room-stage" onPointerDown={walkPet} aria-label={locale === "zh" ? "点击房间任意位置，让 Meowchi 走过去" : "Click anywhere in the room to move Meowchi"}>
        <Canvas camera={{ position: [0, 0.35, 5.3], fov: 42 }} dpr={[1, 1.5]}>
          <color attach="background" args={[mode === "black" ? "#020403" : "#e9ede6"]} />
          <ambientLight intensity={mode === "black" ? 0.72 : 1.32} color={mode === "black" ? "#d9d4ff" : "#fff8e8"} />
          <spotLight position={[-4, 6, 4]} intensity={22} color={lighting.key} angle={0.5} penumbra={1} />
          <spotLight position={[5, 2, 3]} intensity={10} color={lighting.fill} angle={0.5} penumbra={1} />
          <pointLight position={[0, 0.2, 2]} intensity={mode === "black" ? 5 : 8} color="#fff1d5" distance={5} />
          <ModelErrorBoundary fallback={<></>}><Suspense fallback={null}><RoomEnvironmentModel key={mode} mode={mode} /></Suspense></ModelErrorBoundary>
          <Environment preset={mode === "black" ? "night" : "apartment"} environmentIntensity={mode === "black" ? 0.28 : 0.48} />
        </Canvas>
        <div className={`room-pet-agent ${walking ? "walking" : ""}`} style={{ left: `${petPosition.x}%`, top: `${petPosition.y}%` }}>
          <img src={walking ? "/reference/phase-three/expression-excited-cutout.png" : "/reference/phase-three/expression-happy-cutout.png"} alt="Meowchi in the selected room" />
          <i />
        </div>
        {roomFeedback.id > 0 && (
          <div key={roomFeedback.id} className="room-pixel-feedback" aria-hidden="true">
            <div className="room-pixel-trail">
              {Array.from({ length: 6 }, (_, index) => {
                const step = (index + 1) / 7;
                return <i key={index} style={{ left: `${roomFeedback.fromX + (roomFeedback.x - roomFeedback.fromX) * step}%`, top: `${roomFeedback.fromY + (roomFeedback.y - roomFeedback.fromY) * step}%`, "--trail-index": index } as CSSProperties} />;
              })}
            </div>
            <div className="room-target-signal" style={{ left: `${roomFeedback.x}%`, top: `${roomFeedback.y}%` }}>
              <i /><i /><i /><b>{locale === "zh" ? "收到！走这边" : "OK! THIS WAY"}</b>
            </div>
          </div>
        )}
        <div className="room-badge"><i /> {lighting.label}<small>{locale === "zh" ? "45° 场景视角" : "45° MODEL SPACE"}</small></div>
        <div className="room-effect">{lighting.bonus}<small>{locale === "zh" ? (mode === "black" ? "夜晚让好奇心慢慢生长" : "日光让心情更加轻盈") : (mode === "black" ? "NIGHT CURIOSITY BOOST" : "COZY MOOD BOOST")}</small></div>
        <div className="room-walk-hint"><span>⌖</span><b>{locale === "zh" ? "点击房间，让 Meowchi 走过去" : "CLICK THE ROOM TO MOVE MEOWCHI"}</b></div>
        <div className="room-controls"><span>{locale === "zh" ? "场景已放大 · 可探索" : "ENLARGED ROOM · EXPLORE"}</span><span>{locale === "zh" ? "不同空间会影响心情" : "SPACE AFFECTS MOOD"}</span></div>
      </div>
    </section>
  );
}

function ProductStory({ locale }: { locale: Locale }) {
  return (
    <section className="product-story" id="object-study">
      <div className="story-copy">
        <p className="eyebrow">{UI[locale].storyKicker}</p>
        <h2>{UI[locale].storyTitleA}<br />{UI[locale].storyTitleB} <span>{UI[locale].storyTitleC}</span></h2>
        <p>{locale === "zh" ? "透明外壳让内部结构成为视觉的一部分；三枚有明确触感和颜色分工的按钮，则把照顾、玩耍和情绪回应变成一种不用学习就能完成的日常仪式。" : "The shell reveals the technology inside while three color-coded buttons turn care into a physical ritual. Every press has a different emotional response."}</p>
        <div className="material-list">
          <span><i className="swatch shell" /> TRANSPARENT PC</span>
          <span><i className="swatch lime" /> LIME SIGNAL</span>
          <span><i className="swatch amber" /> AMBER PLAY</span>
          <span><i className="swatch violet" /> VIOLET FEEL</span>
        </div>
      </div>
      <div className="device-gallery">
        <img src="/reference/phase-two/device-back-reference.png" alt={locale === "zh" ? "TAMA LINK 透明设备背面结构" : "TAMA LINK transparent device back view"} />
        <div className="gallery-label"><span>{locale === "zh" ? "设备背面 · 结构研究" : "360° OBJECT STUDY"}</span><small>{locale === "zh" ? "透明外壳 / 内部结构 / 可替换电池舱" : "TRANSPARENT SHELL · INTERNAL LAYERS"}</small></div>
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
    ["陪伴可以很轻，但不能没有回应", "从给纸盒狗取名、替芒果核梳毛，到为真实宠物持续消费，人们在意的并非对象是否昂贵，而是照顾动作能否换来一段可感知的关系。"],
    ["由用户决定靠近，也保留随时离开的权利", "TAMA LINK 不用断签、衰弱或死亡惩罚召回用户。你可以随时打开、触摸、安抚，也可以随时结束；状态只留在本机。"],
    ["把短暂互动，积累成共同记忆", "每次投喂、玩耍和安抚都留下细小变化。产品追求的不是占用时长，而是让几十秒的回应逐渐长成一段可回看的关系。"],
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
        <h2>{zh ? <>年轻人寻找的，<br />不是完美关系。<br /><span>而是随时在场，<br />没有负担的回应。</span></> : <>Not a perfect relationship.<br />A response that is <span>present, bounded and light.</span></>}</h2>
        <p>{zh ? "纸盒小狗被牵去散步，芒果核有了名字和日记，宠物消费持续增长，AI 伴侣也进入日常。这些看似分散的现象，共同指向一种轻关系需求：由自己决定何时靠近、何时退出；需要时能得到回应，又不必承担现实饲养与社交的全部压力。TAMA LINK 正是对这种‘有边界的陪伴’进行的一次交互设计实验。" : "Cardboard dogs go for walks, mango pits receive names and diaries, pet spending keeps growing, and AI companions enter daily life. Together they point to a form of bounded companionship: the user chooses when to approach or leave, can receive a response when needed, and does not inherit the full pressure of care or social obligation. TAMA LINK is an interaction-design experiment around that need."}</p>
      </header>
      <div className="context-signal" hidden={activeTab !== "context"}>
        <div className="context-year"><small>2022</small><strong>{zh ? "纸盒小狗" : "CARDBOARD DOGS"}</strong><span>{zh ? "取名 · 遛狗 · 宿舍社交" : "NAMING · WALKING · SOCIAL PLAY"}</span></div>
        <div className="context-year"><small>2023</small><strong>{zh ? "养芒果核" : "MANGO-PIT PETS"}</strong><span>{zh ? "梳毛 · 写日记 · 低成本照顾" : "GROOMING · DIARY · LIGHT CARE"}</span></div>
        <div className="context-year"><small>2024</small><strong>{zh ? "宠物消费 3002 亿元" : "RMB 300.2B PET MARKET"}</strong><span>{zh ? "宠物成为家庭成员与情绪寄托" : "FAMILY · EMOTIONAL SUPPORT"}</span></div>
        <div className="context-year"><small>2025</small><strong>{zh ? "AI 陪伴进入日常" : "AI COMPANIONS"}</strong><span>{zh ? "即时回应，也需要明确边界" : "INSTANT RESPONSE · CLEAR LIMITS"}</span></div>
        <div className="context-year active"><small>2026</small><strong>{zh ? "QQ 宠物回归" : "QQ PET RETURNS"}</strong><span>{zh ? "怀旧之外，重新设计陪伴" : "BEYOND NOSTALGIA"}</span></div>
        <div className="context-year tama"><small>NEXT</small><strong>TAMA LINK</strong><span>{zh ? "可控、可触、随时在场" : "BOUNDED · TACTILE · PRESENT"}</span></div>
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
        <a href="https://app.dahecube.com/nweb/spider/20260727/828870ncdd43bef3c9.htm?artid=828870" target="_blank" rel="noreferrer"><span>01</span><b>{zh ? "QQ 宠物在 2026 年回归：数字宠物重新进入公共视野" : "QQ Pet returned in 2026"}</b><small>Dahe Cube · 2026</small></a>
        <a href="https://www.xinhuanet.com/fashion/20250612/e73e4c067fe64e80b27b3ba47f0a9254/c.html" target="_blank" rel="noreferrer"><span>02</span><b>{zh ? "2024 年城镇犬猫消费市场达到 3002 亿元" : "China's urban dog-and-cat market reached RMB 300.2B in 2024"}</b><small>新华网 · 2025</small></a>
        <a href="https://www.jiemian.com/article/8373192.html" target="_blank" rel="noreferrer"><span>03</span><b>{zh ? "纸盒小狗从宿舍手作变成命名、遛狗与社交游戏" : "Cardboard dogs became naming, walking and social play"}</b><small>界面新闻 · 2022</small></a>
        <a href="https://www.scmp.com/news/people-culture/trending-china/article/3229001/mango-pits-pets-young-people-china-raise-hairy-seeds-dogs-and-cats-grooming-them-even-keeping" target="_blank" rel="noreferrer"><span>04</span><b>{zh ? "年轻人为芒果核梳毛、取名并记录‘宠物日记’" : "Young people groomed, named and kept diaries for mango-pit pets"}</b><small>SCMP · 2023</small></a>
        <a href="https://news.cctv.cn/2025/05/18/ARTIN5bUVWN2uQRmzlcHasE1250518.shtml" target="_blank" rel="noreferrer"><span>05</span><b>{zh ? "AI 伴侣提供全天候回应，也带来依赖与现实关系边界问题" : "AI companions offer constant response while raising dependency concerns"}</b><small>央视网 / 中国青年报 · 2025</small></a>
        <a href="https://pubmed.ncbi.nlm.nih.gov/41999169/" target="_blank" rel="noreferrer"><span>06</span><b>{zh ? "青年主动建立‘有边界的支持性陪伴’" : "Young adults actively construct bounded supportive companionship"}</b><small>Health Communication · 2026</small></a>
        <a href="https://www.sciencedirect.com/science/article/pii/S0040162524001045" target="_blank" rel="noreferrer"><span>07</span><b>{zh ? "虚拟宠物的可爱感、拟社会互动与共同现实感" : "Virtual-pet cuteness, parasocial interaction and shared reality"}</b><small>Technological Forecasting & Social Change · 2024</small></a>
      </div>
    </section>
  );
}

function AuthorContact({ locale }: { locale: Locale }) {
  const zh = locale === "zh";
  return (
    <footer className="author-contact" id="contact">
      <div className="contact-intro">
        <span className="contact-status"><i /> {zh ? "作者联系方式" : "AUTHOR CONTACT"}</span>
        <h2>{zh ? <>如果你也在思考<br /><em>陪伴、触摸与 AI。</em></> : <>Let&apos;s talk about<br /><em>care, touch and AI.</em></>}</h2>
        <p>{zh ? "欢迎交流数字宠物、情绪交互、WebGL 体验与 AI Coding 的设计实践。" : "Open to conversations about digital companions, emotional interaction, WebGL experiences and designing with AI coding."}</p>
      </div>
      <div className="contact-details">
        <a href="mailto:1741499328@qq.com" className="contact-line">
          <span>EMAIL</span><b>1741499328@qq.com</b><i aria-hidden="true" />
        </a>
        <a href="tel:+8613903064594" className="contact-line">
          <span>{zh ? "电话" : "PHONE"}</span><b>139 0306 4594</b><i aria-hidden="true" />
        </a>
        <div className="wechat-contact">
          <div className="wechat-qr"><img src="/reference/contact/wechat-contact.png" alt={zh ? "作者微信二维码" : "Author WeChat QR code"} /></div>
          <div><span>WECHAT</span><b>{zh ? "扫描二维码添加微信" : "Scan to connect on WeChat"}</b><small>{zh ? "备注 TAMA LINK" : "MENTION TAMA LINK"}</small></div>
        </div>
      </div>
      <div className="contact-footer"><span>TAMA LINK · CARE IS A SIGNAL</span><span>© 2026 · DESIGNED WITH HUMAN JUDGMENT + AI CODING</span></div>
    </footer>
  );
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>("en");
  const [target, setTarget] = useState(0);
  const [progress, setProgress] = useState(0);
  const [heroFeedback, setHeroFeedback] = useState(0);
  const [heroSignal, setHeroSignal] = useState<PetAction>("idle");
  const action = useTamaStore((s) => s.action);
  const awake = useTamaStore((s) => s.awake);
  const bond = useTamaStore((s) => s.bond);
  const trigger = useTamaStore((s) => s.trigger);
  const reset = useTamaStore((s) => s.reset);
  const frame = useRef<number | null>(null);
  const heroFeedbackTimer = useRef<number | null>(null);
  const reduced = useMemo(() => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const copy = UI[locale];
  const changeLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    window.localStorage.setItem("tama-link-locale", nextLocale);
  };
  const sendHeroSignal = (nextAction: PetAction) => {
    setHeroFeedback((value) => value + 1);
    setHeroSignal(nextAction);
    if (heroFeedbackTimer.current) window.clearTimeout(heroFeedbackTimer.current);
    heroFeedbackTimer.current = window.setTimeout(() => setHeroSignal("idle"), 1800);
    trigger(nextAction);
  };

  useEffect(() => () => {
    if (heroFeedbackTimer.current) window.clearTimeout(heroFeedbackTimer.current);
  }, []);

  useEffect(() => {
    const restoreLocale = window.setTimeout(() => {
      const saved = window.localStorage.getItem("tama-link-locale");
      if (saved === "zh" || saved === "en") setLocale(saved);
    }, 0);
    return () => window.clearTimeout(restoreLocale);
  }, []);

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
        {heroSignal !== "idle" && (
          <div key={`${heroSignal}-${heroFeedback}`} className={`hero-signal-feedback signal-${heroSignal}`} aria-hidden="true">
            <div className="hero-pixel-field">
              {Array.from({ length: 20 }, (_, index) => <i key={index} style={{ "--pixel-x": `${10 + ((index * 37) % 80)}%`, "--pixel-y": `${8 + ((index * 23) % 82)}%`, "--pixel-delay": `${index * 24}ms` } as CSSProperties} />)}
            </div>
            <div className="hero-signal-reticle"><i /><i /><i /><i /></div>
            <div className="hero-signal-hud">
              <small>{heroSignal === "call" ? "CARE LINK" : heroSignal === "play" ? "PLAY BURST" : "FEEL TRACE"}</small>
              <b>{heroSignal === "call" ? "HEART SYNC" : heroSignal === "play" ? "JOY COMBO" : "MOOD READ"}</b>
              <span>{heroSignal === "call" ? "+ BOND" : heroSignal === "play" ? "× 03" : "SOFT SIGNAL"}</span>
            </div>
          </div>
        )}
        <div className="canvas-wrap"><Canvas camera={{ position: [0, 0, 8], fov: 38 }} dpr={[1, 1.6]}><Scene progress={progress} /></Canvas></div>
        <div className="device-readout" style={{ opacity: Math.max(0.2, 1 - progress * 0.7) }}>
          <small>COMPANION SIGNAL</small><b>MEOWCHI · ONLINE</b><span>BOND {bond}%</span>
        </div>
        <div className="object-cue" style={{ opacity: Math.max(0, 1 - progress * 2.4) }}><span>DRAG TO ROTATE</span><i /> <span>SCROLL TO ENTER</span></div>
        <div className="near-hint" data-visible={progress > 0.62}><span>PRESS A BUTTON</span><b>CARE · PLAY · FEEL</b></div>
        <div className="hero-controls" data-visible={progress > 0.66}>
          {buttonMap.map((item) => (
            <button key={item.key} onClick={() => sendHeroSignal(item.key)} style={{ "--signal-color": item.color } as CSSProperties}>
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
          <p className="eyebrow">{locale === "zh" ? "产品原则 · 陪伴而不施压" : "PRODUCT PRINCIPLE · CARE WITHOUT PRESSURE"}</p>
          <h2>{locale === "zh" ? (awake ? "它会记得\n你如何回应。" : "触摸屏幕，\n建立第一次连接。") : (awake ? "It remembers\nhow you respond." : "Touch the screen\nto begin a bond.")}</h2>
          <p>{locale === "zh" ? "触摸、情绪识别、呼吸安抚、空间选择和回忆收集组成一条短而完整的陪伴循环。进度保存在本地，随时可以清除。" : "Touch, emotion reading, breathing comfort, room choice and memory collection form one short companion loop. Progress stays local and can be cleared at any time."}</p>
          <button onClick={reset}>{locale === "zh" ? "清除本地回忆" : "RESET LOCAL MEMORY"}</button>
        </div>
        <div className="signal-grid">
          {buttonMap.map((item, index) => <article key={item.key}><span>0{index + 1}</span><b style={{ color: item.color }}>{item.label}</b><p>{locale === "zh" ? ["回应需要", "释放压力", "读懂感受"][index] : ["Respond to a need", "Release tension", "Read a feeling"][index]}</p></article>)}
        </div>
      </section>
      <AuthorContact locale={locale} />
    </main>
  );
}
