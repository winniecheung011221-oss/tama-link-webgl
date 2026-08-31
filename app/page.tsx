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
    heroKicker: "住在浏览器里的数字伙伴",
    heroTitleA: "信号亮起。",
    heroTitleB: "它在这里。",
    heroCopy: "向下滚动，靠近设备。转动机身，看看屏幕里的 Meowchi。",
    scroll: "向下滚动，连接设备",
    signals: "选择一种回应",
    petKicker: "MEOWCHI 的家 · 今日状态",
    meet: "来看看",
    roomKicker: "MEOWCHI 的房间 · 点击地面移动",
    roomTitle: "Meowchi 的小房间。",
    storyKicker: "产品设计 · 让陪伴可以被触摸",
    storyTitleA: "看得见结构，",
    storyTitleB: "摸得到回应，",
    storyTitleC: "也记得相处。",
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
      style={{ backgroundImage: `url("reference/phase-three/expression-${expression}-cutout.png")` }}
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
        <header><div><p className="eyebrow">{locale === "zh" ? "玩耍 · 接星星" : "PLAY MODE · SIGNAL CATCH"}</p><h3>{time > 0 ? (locale === "zh" ? "在星星溜走前接住它。" : "Catch the stars.") : (locale === "zh" ? "这一局结束了。" : "Signal complete!")}</h3></div><button onClick={onClose} aria-label="Close game">×</button></header>
        <div className="game-hud"><span>{locale === "zh" ? "时间" : "TIME"} <b>{String(time).padStart(2, "0")}</b></span><span>{locale === "zh" ? "得分" : "SCORE"} <b>{String(score).padStart(2, "0")}</b></span><span>{locale === "zh" ? "连击" : "COMBO"} <b>×{combo}</b></span><span>{locale === "zh" ? "奖励" : "REWARD"} <b>+{score * 12}</b></span></div>
        <div className="playfield">
          <div className="scanline" />
          {time > 0 ? (
            <button key={star.id} className="catch-star" style={{ left: `${star.x}%`, top: `${star.y}%` }} onClick={catchStar} aria-label="Catch star">★</button>
          ) : (
            <div className="game-result"><PetExpression index={score >= 8 ? 1 : 0} className="result-expression" /><strong>{score}</strong><span>{locale === "zh" ? "颗星星到手" : "STARS CAUGHT"}</span><small>+{score * 12} {locale === "zh" ? "星尘 · 活力" : "stardust · fun"} +{score * 2}</small><button onClick={onClose}>{locale === "zh" ? "回到 Meowchi 身边" : "RETURN TO MEOWCHI"}</button></div>
          )}
          <Image src="reference/phase-three/expression-playful-cutout.png" alt="" width={1024} height={1024} />
        </div>
        <footer>{locale === "zh" ? "星星会不断换位置 · 每局 15 秒" : "CLICK / TAP THE STAR BEFORE IT JUMPS · 15 SECOND ROUND"}</footer>
      </div>
    </div>
  );
}

function FeedChallenge({ locale, onComplete, onClose }: { locale: Locale; onComplete: (quality: number) => void; onClose: () => void }) {
  const foods = [
    { name: "STRAWBERRY", note: "Bright + playful", artwork: "reference/phase-three/food-strawberry-slice.png" },
    { name: "PUDDING", note: "Soft + comforting", artwork: "reference/phase-three/food-pudding.png" },
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
        <header><div><p className="eyebrow">{locale === "zh" ? "喂食 · 看准时机" : "FEED MODE · SWEET SPOT"}</p><h3>{selected ? (locale === "zh" ? "选好点心，再看准时机。" : "Serve it just right.") : (locale === "zh" ? "今天给 Meowchi 吃什么？" : "Choose a treat.")}</h3></div><button onClick={onClose} aria-label="Close food picker">×</button></header>
        {!selected ? (
          <div className="food-grid">
            {foods.map((food) => (
              <button key={food.name} onClick={() => setSelected(food)}>
                <div className="food-model food-artwork"><Image src={food.artwork} alt={food.name} fill sizes="(max-width: 800px) 90vw, 390px" /></div>
                <b>{locale === "zh" ? (food.name === "STRAWBERRY" ? "草莓" : "布丁") : food.name}</b><small>{locale === "zh" ? (food.name === "STRAWBERRY" ? "酸甜醒神" : "软软甜甜") : food.note}</small><span>{locale === "zh" ? "就选这个 →" : "SELECT TREAT →"}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="timing-challenge">
            <div className="selected-food"><div className="food-model food-artwork selected"><Image src={selected.artwork} alt={selected.name} fill sizes="(max-width: 800px) 90vw, 390px" /></div><b>{locale === "zh" ? (selected.name === "STRAWBERRY" ? "草莓" : "布丁") : selected.name}</b></div>
            <div className="timing-panel">
              <p>{locale === "zh" ? "等游标进入绿色区域" : "STOP THE SIGNAL INSIDE THE LIME ZONE"}</p>
              <div className={`timing-meter ${quality !== null ? "stopped" : ""}`}><i /><span /></div>
              {quality === null ? <button onClick={stopMeter}>{locale === "zh" ? "停" : "LOCK SERVE TIMING"}</button> : <div className="challenge-result"><strong>{locale === "zh" ? (quality > 1.28 ? "刚刚好" : quality > .9 ? "还不错" : "洒出来一点，照样好吃") : (quality > 1.28 ? "PERFECT SERVE!" : quality > .9 ? "NICE TIMING" : "MESSY, BUT TASTY")}</strong><small>{locale === "zh" ? "奖励加成" : "REWARD"} ×{quality.toFixed(2)}</small><button onClick={() => onComplete(quality)}>{locale === "zh" ? "递给 Meowchi" : "GIVE TO MEOWCHI"}</button></div>}
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
        <header><div><p className="eyebrow">{locale === "zh" ? "清洁 · 泡泡梳毛" : "CLEAN MODE · BUBBLE GROOM"}</p><h3>{locale === "zh" ? "把打结的毛团点掉。" : "Clear the fluff knots with bubbles."}</h3></div><button onClick={onClose} aria-label="Close clean game">×</button></header>
        <div className="care-game-hud"><span>{locale === "zh" ? "剩余时间" : "TIME"} <b>{String(time).padStart(2, "0")}</b></span><span>{locale === "zh" ? "已清理" : "CLEARED"} <b>{cleanSpots.length - remaining.length}/{cleanSpots.length}</b></span></div>
        <div className="clean-field">
          <div className="soap-bubbles" aria-hidden="true">{[0,1,2,3,4,5,6].map((bubble) => <i key={bubble} />)}</div>
          <Image src="reference/phase-three/expression-happy-cutout.png" alt="Meowchi" width={1024} height={1024} />
          {remaining.map((index) => <button key={index} className="fluff-knot" style={{ left: `${cleanSpots[index].left}%`, top: `${cleanSpots[index].top}%` }} onClick={() => clearSpot(index)} aria-label="Clean fluff knot"><i /></button>)}
          {quality !== null && <div className="challenge-result floating"><strong>{locale === "zh" ? (remaining.length === 0 ? "毛毛又软又蓬松" : "还有几处没梳开") : (remaining.length === 0 ? "FUR FLUFFY AND BRIGHT!" : "PARTIAL GROOM")}</strong><small>{locale === "zh" ? "奖励加成" : "REWARD"} ×{quality.toFixed(2)}</small><button onClick={() => onComplete(quality)}>{locale === "zh" ? "清洁完成" : "COMPLETE CLEAN"}</button></div>}
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
        <header><div><p className="eyebrow">{locale === "zh" ? "休息 · 跟着呼吸" : "SLEEP MODE · DREAM SYNC"}</p><h3>{locale === "zh" ? "跟着光圈，慢慢放松。" : "Tap with the breathing light."}</h3></div><button onClick={onClose} aria-label="Close sleep game">×</button></header>
        <div className="sleep-field">
          <button className="breath-orb" onClick={tapBeat} disabled={quality !== null}><i /><span>TAP</span></button>
          <div className="beat-notes">{[0, 1, 2, 3, 4].map((index) => <i key={index} className={hits[index] === undefined ? "" : hits[index] > .7 ? "perfect" : "hit"} />)}</div>
          <p>{locale === "zh" ? "一共五次。光圈重合时，轻点一下。" : "Follow five slow pulses. Tap when the rings meet."}</p>
          {quality !== null && <div className="challenge-result"><strong>{locale === "zh" ? (quality > 1.28 ? "呼吸刚好合上了" : quality > .9 ? "节奏很稳" : "慢一点也没关系") : (quality > 1.28 ? "DREAM SYNC PERFECT" : quality > .9 ? "PEACEFUL RHYTHM" : "RESTLESS, STILL COZY")}</strong><small>{locale === "zh" ? "奖励加成" : "REWARD"} ×{quality.toFixed(2)}</small><button onClick={() => onComplete(quality)}>{locale === "zh" ? "陪 Meowchi 睡下" : "TUCK MEOWCHI IN"}</button></div>}
        </div>
      </div>
    </div>
  );
}

const comfortMoods = [
  { key: "sleepy", index: 3, label: "TIRED", zh: "困倦", hint: "Slow down and stay close.", zhHint: "慢一点，陪它待着。" },
  { key: "shy", index: 4, label: "SHY", zh: "害羞", hint: "Give a little space, not silence.", zhHint: "留一点空间，也别走远。" },
  { key: "sad", index: 5, label: "SAD", zh: "难过", hint: "A gentle signal is enough.", zhHint: "轻轻回应一次就好。" },
  { key: "angry", index: 6, label: "OVERLOADED", zh: "过载", hint: "Let the feeling pass before fixing it.", zhHint: "先让情绪过去。" },
  { key: "curious", index: 2, label: "CURIOUS", zh: "好奇", hint: "Follow the small spark.", zhHint: "陪它看看那点亮光。" },
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
        <header><div><p className="eyebrow">{locale === "zh" ? "情绪 · 陪它缓一缓" : "FEEL MODE · EMOTION TUNING"}</p><h3>{phase === "read" ? (locale === "zh" ? "先看看它怎么了。" : "Read the feeling first.") : phase === "soothe" ? (locale === "zh" ? "陪它慢慢呼吸。" : "Stay with the breathing signal.") : (locale === "zh" ? "它放松下来了。" : "The signal feels softer.")}</h3></div><button onClick={onClose} aria-label="Close comfort ritual">×</button></header>
        <div className={`comfort-body phase-${phase}`}>
          <div className="comfort-pet">
            <PetExpression index={phase === "done" ? 7 : target.index} className="comfort-expression" />
            <div className="comfort-waves"><i /><i /><i /></div>
            <small>{locale === "zh" ? (phase === "done" ? "安心信号 · 已收到" : target.zhHint) : (phase === "done" ? "SAFE SIGNAL · RECEIVED" : target.hint)}</small>
          </div>
          {phase === "read" && <div className="mood-choice"><p>{locale === "zh" ? "Meowchi 现在是什么心情？" : "What do you think Meowchi is feeling?"}</p>{choices.map((choice) => <button key={choice.key} className={wrong === choice.key ? "wrong" : ""} onClick={() => chooseMood(choice.key)}><span>{choice.index === 3 ? "— ω —" : choice.index === 5 ? "T_T" : choice.index === 6 ? ">:(" : choice.index === 4 ? "> <" : "o o"}</span><b>{locale === "zh" ? choice.zh : choice.label}</b></button>)}</div>}
          {phase === "soothe" && <div className="soothe-ritual"><p>{locale === "zh" ? "光圈收拢时，轻点一下。" : "Tap as each slow breath arrives."}</p><button onClick={soothe} className="soothe-orb"><i /><span>{pulses + 1} / 4</span></button><div className="soothe-progress">{[0, 1, 2, 3].map((item) => <i key={item} className={item < pulses ? "done" : ""} />)}</div></div>}
          {phase === "done" && <div className="comfort-complete"><strong>{locale === "zh" ? "陪它安静待了一会儿，信号慢慢平稳下来。" : "You did not fix the feeling. You stayed with it."}</strong><small>{locale === "zh" ? "亲密度 + · 连接能量 + · 留下一段回忆" : "BOND + · SIGNAL ENERGY + · MEMORY TRACE"}</small><button onClick={() => onComplete(1.35)}>{locale === "zh" ? "记下这一刻" : "KEEP THIS MOMENT"}</button></div>}
        </div>
      </div>
    </div>
  );
}

function TouchPet({ locale, action }: { locale: Locale; action: PetAction }) {
  const receiveTouch = useTamaStore((state) => state.receiveTouch);
  const [expression, setExpression] = useState(2);
  const [message, setMessage] = useState(locale === "zh" ? "摸摸它的头、脸颊或肚子" : "TOUCH HEAD · CHEEK · TUMMY");
  const [ripple, setRipple] = useState(0);
  const [touchBurst, setTouchBurst] = useState({ id: 0, x: 50, y: 42, zone: "head" });
  const lastReward = useRef(0);
  const visibleExpression = action === "play" ? 9 : action === "feel" ? 7 : action === "call" ? 1 : expression;
  useEffect(() => {
    setMessage(locale === "zh" ? "摸摸它的头、脸颊或肚子" : "TOUCH HEAD · CHEEK · TUMMY");
  }, [locale]);
  const touch = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const zone = y < 0.42 ? "head" : x < 0.3 || x > 0.7 ? "cheek" : "tummy";
    const feedback = zone === "head"
      ? { index: 7, en: "PURR… I FEEL SAFE.", zh: "呼噜……这样很舒服。" }
      : zone === "cheek"
        ? { index: 9, en: "TICKLY! AGAIN?", zh: "好痒，再来一下？" }
        : { index: 0, en: "WARM SIGNAL RECEIVED.", zh: "肚子暖暖的。" };
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
            <b>{locale === "zh" ? (touchBurst.zone === "head" ? "呼噜 +1" : touchBurst.zone === "cheek" ? "喵" : "亲密 +1") : (touchBurst.zone === "head" ? "PURR +1" : touchBurst.zone === "cheek" ? "MEW!" : "BOND +1")}</b>
            {Array.from({ length: 8 }, (_, index) => <i key={index} />)}
          </span>
        )}
        <span className="fur-light" />
        <PetExpression index={visibleExpression} className={`touch-expression${visibleExpression === 7 ? " is-loving" : ""}`} />
        {visibleExpression === 7 && <PetExpression index={7} className="touch-expression love-heart-repair" />}
        <span className="touch-crosshair">+</span>
      </button>
      <div className="touch-feedback"><i /> <span>{message}</span><small>{locale === "zh" ? "轻轻触摸，毛绒和表情都会回应" : "FUR LIGHT + EXPRESSION RESPOND TO TOUCH"}</small></div>
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
    feed: ["喂点东西", "选点心，再看准时机"],
    play: ["接星星", "连击越多，星尘越多"],
    comfort: ["陪它缓一缓", "看懂表情，陪它呼吸四次"],
    clean: ["梳梳毛", "点掉毛结，让毛毛重新蓬松"],
    sleep: ["陪它休息", "跟着光圈，慢慢安静下来"],
  } : {
    feed: ["FEED", "Fill that tiny tummy"],
    play: ["PLAY", "Turn energy into joy"],
    comfort: ["COMFORT", "Read the feeling, soften the signal"],
    clean: ["CLEAN", "Fresh fur, clear signal"],
    sleep: ["SLEEP", "Rest and recharge"],
  };
  const statRows = [
    [locale === "zh" ? "饱腹" : "HUNGER", stats.hunger],
    [locale === "zh" ? "活力" : "FUN", stats.fun],
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
        <div className="currency"><i /> {stardust.toLocaleString()} <small>{locale === "zh" ? "星尘" : "STARDUST"}</small></div>
      </div>

      <div className="signal-console">
        <div className="pet-request">
          <span className="request-pulse" />
          <div><small>{locale === "zh" ? "MEOWCHI 现在想" : "MEOWCHI WANTS"}</small><b>{careCopy[request][0]}</b></div>
          <em>{locale === "zh" ? "回应当前需要，可额外获得能量和亲密度" : "Match the request for bonus energy + bond"}</em>
        </div>
        <div className="signal-energy">
          <div><span>{locale === "zh" ? "连接能量" : "SIGNAL ENERGY"}</span><strong>{signalEnergy}%</strong></div>
          <div className="energy-track"><i style={{ width: `${signalEnergy}%` }} /></div>
          <small>{locale === "zh" ? `连续照顾 ×${careCombo} · 回忆 ${memories} · 奇遇 ${eventCount}` : `CARE COMBO ×${careCombo} · MEMORIES ${memories} · EVENTS ${eventCount}`}</small>
        </div>
        <button className={signalEnergy >= 100 ? "ready" : ""} disabled={signalEnergy < 100 || action !== "idle"} onClick={activateSignalBurst}>
          <span>✦</span><b>{locale === "zh" ? "点亮信号" : "ACTIVATE SIGNAL BURST"}</b><small>{signalEnergy >= 100 ? (locale === "zh" ? "收下回忆和奖励" : "CLAIM MEMORY + REWARD") : (locale === "zh" ? "能量满格后可用" : "CHARGE TO 100%")}</small>
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
            <small>{locale === "zh" ? "它会记住每一次照顾。" : "Bond responds to every care action."}</small>
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
            <span>{locale === "zh" ? (lastCare === "feed" ? "好吃 · 饱腹 +18" : lastCare === "play" ? "再来一次 · 活力 +14" : lastCare === "comfort" ? "安心了 · 平静 +8" : lastCare === "clean" ? "毛毛亮了 · 清洁 +22" : lastCare === "sleep" ? "晚安 · 睡眠 +24" : "收到回应") : (lastCare === "feed" ? "YUM! +18 HUNGER" : lastCare === "play" ? "WHEE! +14 FUN" : lastCare === "comfort" ? "SAFE… +8 CALM" : lastCare === "clean" ? "SPARKLY! +22 CLEAN" : lastCare === "sleep" ? "ZZZ… +24 SLEEP" : "SIGNAL RECEIVED")}</span>
          </div>
          <div className="bond-card">
            <span>♥</span>
            <div><small>{locale === "zh" ? `亲密度 LV. ${String(bondLevel).padStart(2, "0")} · ${["刚刚连接", "有点熟了", "数字伙伴", "回忆收藏家", "心意相通"][bondLevel - 1]}` : `BOND LV. ${String(bondLevel).padStart(2, "0")} · ${bondStages[bondLevel - 1]}`}</small><div className="bond-track"><i style={{ width: `${bond}%` }} /></div></div>
            <strong>{bond}%</strong>
          </div>
        </div>

        <aside className="hub-column right">
          <div className="panel charms-panel">
            <div className="panel-title"><span>⌁</span> {locale === "zh" ? "挂件" : "CHARMS"} <small>{2 + (gameBest >= 8 ? 1 : 0)} / 3</small></div>
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
            <div className="panel-title"><span>↳</span> {locale === "zh" ? "照顾 Meowchi" : "CARE ACTIONS"}</div>
            {careActions.map((item) => (
              <button key={item.id} onClick={() => item.id === "play" ? setGameOpen(true) : item.id === "feed" ? setFoodOpen(true) : item.id === "comfort" ? setComfortOpen(true) : item.id === "clean" ? setCleanOpen(true) : setSleepOpen(true)} disabled={action !== "idle"} className={lastCare === item.id ? "active" : ""}>
                <i>{item.icon}</i><span><b>{careCopy[item.id][0]}</b><small>{careCopy[item.id][1]}</small></span>
              </button>
            ))}
          </div>
        </aside>
      </div>
      <div className="daily-strip">
        <div><p className="eyebrow">{locale === "zh" ? "今日小任务 · 01" : "DAILY LINK · 01"}</p><h3>{locale === "zh" ? "陪它完成今天的小任务。" : "Complete today’s care signal."}</h3></div>
        <div className={careCount >= 3 ? "done" : ""}><span>01</span><b>{locale === "zh" ? "照顾 ×3" : "CARE ×3"}</b><small>{Math.min(careCount, 3)} / 3</small></div>
        <div className={gameBest >= 5 ? "done" : ""}><span>02</span><b>{locale === "zh" ? "接星 ×5" : "CATCH ×5"}</b><small>{Math.min(gameBest, 5)} / 5</small></div>
        <button disabled={dailyClaimed || careCount < 3 || gameBest < 5} onClick={claimDaily}>{locale === "zh" ? (dailyClaimed ? "已领取 ✓" : "领取 +250") : (dailyClaimed ? "CLAIMED ✓" : "CLAIM +250")}</button>
      </div>
      <div className="memory-strip" id="memories">
        <header>
          <p className="eyebrow">{locale === "zh" ? "回忆收藏" : "MEMORY ARCHIVE · REWARD COLLECTION"}</p>
          <h3>{locale === "zh" ? "让相处的片段留下来。" : "Turn care into collectible stories."}</h3>
          <small>{locale === "zh" ? "每次点亮信号，都会解锁一段回忆。" : "Every Signal Burst unlocks one memory fragment."}</small>
        </header>
        {[1, 3, 5].map((threshold, index) => {
          const unlocked = memories >= threshold;
          const memoryImages = ["reference/phase-three/expression-curious-cutout.png", "reference/phase-three/food-pudding.png", "reference/phase-three/expression-loving-cutout.png"];
          const memoryCopies = locale === "zh"
            ? ["第一次触摸屏幕时，它把那次回应记成了一点微光。", "那天很晚，你们分着吃完一份布丁，房间里只剩安静的呼吸声。", "亲密度够高时，房间会多出一座只属于你们的秘密花园。"]
            : ["Your first touch became a tiny light it chose to keep.", "It was late when you shared pudding and listened to the room breathe.", "With enough bond, the room grows a secret garden for the two of you."];
          return (
            <button className={`memory-card ${unlocked ? "unlocked" : "locked"}`} key={threshold} onClick={() => unlocked && setMemoryOpen(index)}>
              <div className="memory-art"><img src={memoryImages[index]} alt="" /><span>{unlocked ? `${locale === "zh" ? "回忆" : "MEMORY"} 0${index + 1}` : `${memories} / ${threshold}`}</span></div>
              <b>{locale === "zh" ? ["初次连接", "深夜零食", "秘密花园"][index] : ["FIRST LINK", "MIDNIGHT SNACK", "SECRET GARDEN"][index]}</b>
              <small>{unlocked ? (locale === "zh" ? "打开看看" : "OPEN THIS MEMORY") : (locale === "zh" ? `再点亮 ${threshold - memories} 次信号` : `${threshold - memories} MORE SIGNAL BURSTS`)}</small>
              <p>{memoryCopies[index]}</p>
            </button>
          );
        })}
      </div>
      {memoryOpen !== null && <div className="game-overlay" role="dialog" aria-modal="true"><div className="memory-modal"><button onClick={() => setMemoryOpen(null)} aria-label="Close memory">×</button><img src={["reference/phase-three/expression-curious-cutout.png", "reference/phase-three/food-pudding.png", "reference/phase-three/expression-loving-cutout.png"][memoryOpen]} alt="" /><p className="eyebrow">{locale === "zh" ? "回忆" : "MEMORY"} 0{memoryOpen + 1}</p><h3>{locale === "zh" ? ["第一次回应", "一份深夜布丁", "慢慢长大的房间"][memoryOpen] : ["THE FIRST ANSWER", "MIDNIGHT PUDDING", "A ROOM THAT GROWS"][memoryOpen]}</h3></div></div>}
      {gameOpen && <StarGame locale={locale} onClose={() => setGameOpen(false)} />}
      {foodOpen && <FeedChallenge locale={locale} onClose={() => setFoodOpen(false)} onComplete={(quality) => completeCare("feed", quality)} />}
      {comfortOpen && <ComfortChallenge locale={locale} onClose={() => setComfortOpen(false)} onComplete={(quality) => completeCare("comfort", quality)} />}
      {cleanOpen && <CleanChallenge locale={locale} onClose={() => setCleanOpen(false)} onComplete={(quality) => completeCare("clean", quality)} />}
      {sleepOpen && <SleepChallenge locale={locale} onClose={() => setSleepOpen(false)} onComplete={(quality) => completeCare("sleep", quality)} />}
      {eventNotice && (
        <div className={`random-event ${eventNotice}`}>
          <PetExpression index={eventNotice === "gift" ? 8 : eventNotice === "meteor" ? 1 : 2} className="event-expression" />
          <div><small>{locale === "zh" ? "发现小惊喜" : "RARE SIGNAL DETECTED"}</small><b>{locale === "zh" ? (eventNotice === "gift" ? "神秘礼物" : eventNotice === "meteor" ? "像素流星" : "小小访客") : (eventNotice === "gift" ? "MYSTERY GIFT" : eventNotice === "meteor" ? "PIXEL METEOR" : "TINY VISITOR")}</b><span>{locale === "zh" ? "额外星尘 · 能量 +12 · 亲密度 +2" : "Bonus stardust · energy +12 · bond +2"}</span></div>
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
    ? { key: "#a887ff", fill: "#b8ff5f", label: locale === "zh" ? "夜间房间" : "BLACK ROOM", bonus: locale === "zh" ? "+ 好奇" : "+ CURIOUS" }
    : { key: "#fff1cf", fill: "#b8d9ff", label: locale === "zh" ? "日光房间" : "WHITE ROOM", bonus: locale === "zh" ? "+ 开心" : "+ HAPPY" };
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
          <img src={walking ? "reference/phase-three/expression-excited-cutout.png" : "reference/phase-three/expression-happy-cutout.png"} alt="Meowchi in the selected room" />
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
              <i /><i /><i /><b>{locale === "zh" ? "好，去那边" : "OK! THIS WAY"}</b>
            </div>
          </div>
        )}
        <div className="room-badge"><i /> {lighting.label}<small>{locale === "zh" ? "45° 房间视角" : "45° MODEL SPACE"}</small></div>
        <div className="room-effect">{lighting.bonus}<small>{locale === "zh" ? (mode === "black" ? "夜晚更容易保持好奇" : "晒晒太阳，心情更轻松") : (mode === "black" ? "NIGHT CURIOSITY BOOST" : "COZY MOOD BOOST")}</small></div>
        <div className="room-walk-hint"><span>⌖</span><b>{locale === "zh" ? "点一下房间，Meowchi 会走过去" : "CLICK THE ROOM TO MOVE MEOWCHI"}</b></div>
        <div className="room-controls"><span>{locale === "zh" ? "房间已放大 · 可以四处看看" : "ENLARGED ROOM · EXPLORE"}</span><span>{locale === "zh" ? "房间会影响心情" : "SPACE AFFECTS MOOD"}</span></div>
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
        <p>{locale === "zh" ? "透明外壳把内部结构露出来。三枚按钮用颜色区分照顾、玩耍和情绪回应，按下去就能得到不同反馈，不需要先学一套操作。" : "The shell reveals the technology inside while three color-coded buttons turn care into a physical ritual. Every press has a different emotional response."}</p>
        <div className="material-list">
          <span><i className="swatch shell" /> TRANSPARENT PC</span>
          <span><i className="swatch lime" /> LIME SIGNAL</span>
          <span><i className="swatch amber" /> AMBER PLAY</span>
          <span><i className="swatch violet" /> VIOLET FEEL</span>
        </div>
      </div>
      <div className="device-gallery">
        <img src="reference/phase-two/device-back-reference.png" alt={locale === "zh" ? "TAMA LINK 透明设备背面结构" : "TAMA LINK transparent device back view"} />
        <div className="gallery-label"><span>{locale === "zh" ? "设备背面 · 结构研究" : "360° OBJECT STUDY"}</span><small>{locale === "zh" ? "透明外壳 · 内部结构 · 可更换电池仓" : "TRANSPARENT SHELL · INTERNAL LAYERS"}</small></div>
      </div>
    </section>
  );
}

function ProjectRationale({ locale }: { locale: Locale }) {
  const zh = locale === "zh";
  const [activeTab, setActiveTab] = useState<"context" | "system" | "ai" | "series">("context");
  const projectTabs = zh ? [
    ["context", "项目背景", "WHY NOW"],
    ["system", "产品体验", "PRODUCT LOOP"],
    ["ai", "人与 AI", "HUMAN / AI"],
    ["series", "短片叙事", "SHORT VIDEO"],
  ] as const : [
    ["context", "CONTEXT", "WHY NOW"],
    ["system", "EXPERIENCE", "PRODUCT LOOP"],
    ["ai", "AI METHOD", "HUMAN / AI"],
    ["series", "VIDEO STORY", "SHORT FORM"],
  ] as const;
  const opportunity = zh ? [
    ["轻轻照顾，也能建立关系", "给纸盒狗取名、替芒果核梳毛、为真实宠物持续花费，人们在意的是照顾有没有被回应，以及这段关系是否真实可感。"],
    ["什么时候靠近，由用户决定", "TAMA LINK 不用签到、衰弱或死亡来制造焦虑。想打开就打开，想离开就离开；所有状态只保存在本机。"],
    ["短短几十秒，也能留下共同记忆", "投喂、玩耍和安抚都会留下小变化。每天只用几十秒，回头看时，已经有了一段共同经历。"],
  ] : [
    ["FROM PUNISHMENT TO CARE", "Classic virtual pets create pressure through hunger, illness and loss. A modern companion can build return through response, memory and low-pressure care."],
    ["FROM CLICKS TO TOUCH", "Dragging the device, pressing physical buttons, brushing fur and following breath gives a browser interaction a body again."],
    ["FROM DAU TO RITUAL", "The product asks for 30–90 seconds: check a feeling, offer comfort and keep one small memory—not endless engagement."],
  ];
  const episodes = zh ? [
    ["01", "数字宠物为什么又回来了", "怀旧让人点开，轻量、低压力的陪伴让人愿意留下。"],
    ["02", "把电子宠物做进 WebGL", "设备、房间、2D 表情和状态逻辑各自独立，素材可以随时替换。"],
    ["03", "让情绪反馈可以被触摸", "对比按钮、毛绒触摸、表情、光线和声音，找到最自然的回应方式。"],
    ["04", "AI Coding 改变了什么", "AI 负责加速搭建和试错，人把时间留给判断、审美和边界。"],
    ["05", "陪伴不该变成控制", "回看数据边界、情绪误读、成瘾设计和非医疗声明。"],
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
        <div><p className="eyebrow">TAMA LINK · CASE STUDY</p><span>{zh ? "从交互原型到产品思考" : "FROM EXPERIENCE PROTOTYPE TO PRODUCT ARGUMENT"}</span></div>
        {projectTabs.map(([key, label, note], index) => <button key={key} className={activeTab === key ? "active" : ""} onClick={() => setActiveTab(key)}><i>0{index + 1}</i><b>{label}</b><small>{note}</small></button>)}
      </nav>
      <header className="rationale-hero" hidden={activeTab !== "context"}>
        <p className="eyebrow">{zh ? "项目背景 · 为什么是现在" : "PROJECT CONTEXT · WHY NOW"}</p>
        <h2>{zh ? <>想要的陪伴，<br />可以随时靠近，<br />也能轻松离开。<br /><span>需要时，它会回应。</span></> : <>Not a perfect relationship.<br />A response that is <span>present, bounded and light.</span></>}</h2>
        <p>{zh ? "有人给纸盒小狗取名、遛弯，也有人替芒果核梳毛、写日记；宠物消费持续增长，AI 伴侣也越来越常见。对象不同，动作却很像：人们主动照顾一个被自己赋予性格的存在，并从回应中确认关系。TAMA LINK 试着把这种陪伴收进浏览器里，让靠近和离开都由用户决定。" : "Cardboard dogs go for walks, mango pits receive names and diaries, pet spending keeps growing, and AI companions enter daily life. Together they point to a form of bounded companionship: the user chooses when to approach or leave, can receive a response when needed, and does not inherit the full pressure of care or social obligation. TAMA LINK is an interaction-design experiment around that need."}</p>
      </header>
      <div className="context-signal" hidden={activeTab !== "context"}>
        <div className="context-year"><small>2022</small><strong>{zh ? "纸盒小狗" : "CARDBOARD DOGS"}</strong><span>{zh ? "取名 · 遛狗 · 宿舍社交" : "NAMING · WALKING · SOCIAL PLAY"}</span></div>
        <div className="context-year"><small>2023</small><strong>{zh ? "养芒果核" : "MANGO-PIT PETS"}</strong><span>{zh ? "梳毛 · 写日记 · 轻量陪伴" : "GROOMING · DIARY · LIGHT CARE"}</span></div>
        <div className="context-year"><small>2024</small><strong>{zh ? "宠物消费 3002 亿元" : "RMB 300.2B PET MARKET"}</strong><span>{zh ? "宠物成为家人，也承接情绪" : "FAMILY · EMOTIONAL SUPPORT"}</span></div>
        <div className="context-year"><small>2025</small><strong>{zh ? "AI 陪伴进入日常" : "AI COMPANIONS"}</strong><span>{zh ? "随时回应，也要守住边界" : "INSTANT RESPONSE · CLEAR LIMITS"}</span></div>
        <div className="context-year active"><small>2026</small><strong>{zh ? "QQ 宠物回归" : "QQ PET RETURNS"}</strong><span>{zh ? "怀旧之外，陪伴方式再设计" : "BEYOND NOSTALGIA"}</span></div>
        <div className="context-year tama"><small>NEXT</small><strong>TAMA LINK</strong><span>{zh ? "想靠近时，它就在" : "BOUNDED · TACTILE · PRESENT"}</span></div>
      </div>
      <div className="opportunity-grid" hidden={activeTab !== "context"}>
        {opportunity.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}
      </div>
      <div className="value-loop" hidden={activeTab !== "system"}>
        <div className="value-copy"><p className="eyebrow">{zh ? "核心价值 · 保持非医疗边界" : "CORE VALUE · NOT A CURE CLAIM"}</p><h3>{zh ? "把一次情绪照顾，做成几十秒能完成的小动作。" : "Make emotional care small enough to complete."}</h3><p>{zh ? "一些研究发现，与动物或虚拟角色互动，可能改善部分情绪体验和陪伴感，但结论并不简单。TAMA LINK 只提供轻量的自我觉察、放松和关系反馈，不做诊断，也不能代替专业帮助。" : "Research suggests that animal or virtual-companion interaction may support aspects of affect and social presence, while the evidence remains nuanced. The product promises only light self-awareness, decompression and relational feedback—never diagnosis or replacement for professional care."}</p></div>
        <div className="loop-orbit">
          <div><span>01</span><b>{zh ? "触摸" : "TOUCH"}</b><small>{zh ? "感受反馈" : "embodied input"}</small></div>
          <div><span>02</span><b>{zh ? "辨认" : "READ"}</b><small>{zh ? "看看它怎么了" : "notice feeling"}</small></div>
          <div><span>03</span><b>{zh ? "安抚" : "SOOTHE"}</b><small>{zh ? "一起慢慢呼吸" : "co-regulate"}</small></div>
          <div><span>04</span><b>{zh ? "记住" : "REMEMBER"}</b><small>{zh ? "留下一段回忆" : "relationship trace"}</small></div>
          <PetExpression index={7} className="loop-expression" />
        </div>
      </div>
      <div className="ai-boundary" hidden={activeTab !== "ai"}>
        <header><p className="eyebrow">{zh ? "AI CODING · 工作方法与边界" : "AI CODING · METHOD AND BOUNDARY"}</p><h3>{zh ? "AI 帮忙加速，人来做决定。" : "AI expands exploration. People own direction."}</h3></header>
        <article><small>HUMAN</small><b>{zh ? "做判断" : "DEFINE MEANING"}</b><p>{zh ? "确定产品为何存在，守住情绪边界，决定审美、取舍并完成最终验收。" : "Emotional intent, ethics, brand taste, interaction trade-offs and final acceptance."}</p></article>
        <article><small>AI</small><b>{zh ? "加快试做" : "ACCELERATE FORM"}</b><p>{zh ? "搭建工程结构、补齐状态逻辑、生成原型变体、接入素材并检查重复问题。" : "Scaffolding, state logic, prototype variants, asset integration and repetitive checks."}</p></article>
        <article className="shared"><small>SHARED</small><b>{zh ? "反复验证" : "ITERATE CRITICALLY"}</b><p>{zh ? "先提出能被验证的判断，再让 AI 快速实现；实际体验决定方案留下还是重做。" : "A person frames a testable judgment, AI implements quickly, and lived experience rejects or keeps it."}</p></article>
        <footer>{zh ? "数据边界：当前版本只在本机保存进度，不推断心理状态，也不上传情绪记录。以后若接入模型，会先征得同意，并提供清除数据的入口。" : "DATA BOUNDARY: state stays local by default. No psychological inference, no emotional-record upload. Any future model requires explicit consent and deletion controls."}</footer>
      </div>
      <div className="video-arc" hidden={activeTab !== "series"}>
        <header><p className="eyebrow">{zh ? "短片叙事 · 把过程讲清楚" : "SHORT-FORM SERIES · PROBLEM TO REFLECTION"}</p><h3>{zh ? "把为什么做、怎么做和做完后的反思都讲清楚。" : "Make the making part of the work."}</h3></header>
        {episodes.map(([number, title, copy]) => <article key={number}><span>{number}</span><div><b>{title}</b><p>{copy}</p></div></article>)}
      </div>
      <div className="research-notes" hidden={activeTab !== "context"}>
        <p className="eyebrow">{zh ? "研究依据 · 延伸阅读" : "RESEARCH NOTES · FURTHER READING"}</p>
        <a href="https://app.dahecube.com/nweb/spider/20260727/828870ncdd43bef3c9.htm?artid=828870" target="_blank" rel="noreferrer"><span>01</span><b>{zh ? "QQ 宠物在 2026 年回归：数字宠物重新进入公共视野" : "QQ Pet returned in 2026"}</b><small>Dahe Cube · 2026</small></a>
        <a href="https://www.xinhuanet.com/fashion/20250612/e73e4c067fe64e80b27b3ba47f0a9254/c.html" target="_blank" rel="noreferrer"><span>02</span><b>{zh ? "2024 年城镇犬猫消费市场达到 3002 亿元" : "China's urban dog-and-cat market reached RMB 300.2B in 2024"}</b><small>新华网 · 2025</small></a>
        <a href="https://www.jiemian.com/article/8373192.html" target="_blank" rel="noreferrer"><span>03</span><b>{zh ? "纸盒小狗：从宿舍手作到取名、遛弯与社交" : "Cardboard dogs became naming, walking and social play"}</b><small>界面新闻 · 2022</small></a>
        <a href="https://www.scmp.com/news/people-culture/trending-china/article/3229001/mango-pits-pets-young-people-china-raise-hairy-seeds-dogs-and-cats-grooming-them-even-keeping" target="_blank" rel="noreferrer"><span>04</span><b>{zh ? "年轻人给芒果核梳毛、取名，还写下「宠物日记」" : "Young people groomed, named and kept diaries for mango-pit pets"}</b><small>SCMP · 2023</small></a>
        <a href="https://news.cctv.cn/2025/05/18/ARTIN5bUVWN2uQRmzlcHasE1250518.shtml" target="_blank" rel="noreferrer"><span>05</span><b>{zh ? "AI 伴侣随时回应，也带来依赖和现实关系边界" : "AI companions offer constant response while raising dependency concerns"}</b><small>央视网 / 中国青年报 · 2025</small></a>
        <a href="https://pubmed.ncbi.nlm.nih.gov/41999169/" target="_blank" rel="noreferrer"><span>06</span><b>{zh ? "年轻人如何主动建立「有边界的支持性陪伴」" : "Young adults actively construct bounded supportive companionship"}</b><small>Health Communication · 2026</small></a>
        <a href="https://www.sciencedirect.com/science/article/pii/S0040162524001045" target="_blank" rel="noreferrer"><span>07</span><b>{zh ? "可爱感与拟社会互动，为什么会让虚拟宠物显得真实" : "Virtual-pet cuteness, parasocial interaction and shared reality"}</b><small>Technological Forecasting & Social Change · 2024</small></a>
      </div>
    </section>
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
            <button className="connect-button" onClick={() => setTarget(1)}><i /> {locale === "zh" ? (progress > 0.92 ? "已连接" : "连接设备") : (progress > 0.92 ? "CONNECTED" : "CONNECT")}</button>
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
              <small>{locale === "zh" ? (heroSignal === "call" ? "照顾连接" : heroSignal === "play" ? "玩耍脉冲" : "情绪轨迹") : (heroSignal === "call" ? "CARE LINK" : heroSignal === "play" ? "PLAY BURST" : "FEEL TRACE")}</small>
              <b>{locale === "zh" ? (heroSignal === "call" ? "心意同步" : heroSignal === "play" ? "快乐连击" : "读懂心情") : (heroSignal === "call" ? "HEART SYNC" : heroSignal === "play" ? "JOY COMBO" : "MOOD READ")}</b>
              <span>{locale === "zh" ? (heroSignal === "call" ? "+ 亲密度" : heroSignal === "play" ? "× 03" : "柔和信号") : (heroSignal === "call" ? "+ BOND" : heroSignal === "play" ? "× 03" : "SOFT SIGNAL")}</span>
            </div>
          </div>
        )}
        <div className="canvas-wrap"><Canvas camera={{ position: [0, 0, 8], fov: 38 }} dpr={[1, 1.6]}><Scene progress={progress} /></Canvas></div>
        <div className="device-readout" style={{ opacity: Math.max(0.2, 1 - progress * 0.7) }}>
          <small>{locale === "zh" ? "陪伴信号" : "COMPANION SIGNAL"}</small><b>MEOWCHI · {locale === "zh" ? "在线" : "ONLINE"}</b><span>{locale === "zh" ? "亲密度" : "BOND"} {bond}%</span>
        </div>
        <div className="object-cue" style={{ opacity: Math.max(0, 1 - progress * 2.4) }}><span>{locale === "zh" ? "拖动旋转" : "DRAG TO ROTATE"}</span><i /> <span>{locale === "zh" ? "滚动靠近" : "SCROLL TO ENTER"}</span></div>
        <div className="near-hint" data-visible={progress > 0.62}><span>{locale === "zh" ? "按下按钮" : "PRESS A BUTTON"}</span><b>{locale === "zh" ? "照顾 · 玩耍 · 感受" : "CARE · PLAY · FEEL"}</b></div>
        <div className="hero-controls" data-visible={progress > 0.66}>
          {buttonMap.map((item) => (
            <button key={item.key} onClick={() => sendHeroSignal(item.key)} style={{ "--signal-color": item.color } as CSSProperties}>
              <i /> <span>{item.label}<small>{item.key === "call" ? (locale === "zh" ? "照顾" : "CARE SIGNAL") : item.key === "play" ? (locale === "zh" ? "玩耍" : "HAPPY JUMP") : (locale === "zh" ? "情绪" : "SHARE A FEELING")}</small></span>
            </button>
          ))}
        </div>
        <div className="action-readout" data-visible={action !== "idle"}>{locale === "zh" ? (action === "call" ? "照顾 · 收到回应" : action === "play" ? "玩耍 · 开心跳跳" : action === "feel" ? "感受 · 心情信号" : "") : (action === "call" ? "CARE · SIGNAL RECEIVED" : action === "play" ? "PLAY · HAPPY JUMP" : action === "feel" ? "FEEL · MOOD SIGNAL" : "")}</div>
        <div className="progress"><span style={{ transform: `scaleX(${progress})` }} /></div>
      </section>
      <CareHub locale={locale} />
      <PetRoom locale={locale} />
      <ProductStory locale={locale} />
      <ProjectRationale locale={locale} />
      <section className="home-section">
        <div>
          <p className="eyebrow">{locale === "zh" ? "产品原则 · 随时陪伴，不用打卡" : "PRODUCT PRINCIPLE · CARE WITHOUT PRESSURE"}</p>
          <h2>{locale === "zh" ? (awake ? "它会记得\n每一次回应。" : "点亮屏幕，\n和它打个招呼。") : (awake ? "It remembers\nhow you respond." : "Touch the screen\nto begin a bond.")}</h2>
          <p>{locale === "zh" ? "摸摸它、读懂表情、陪它呼吸、换一间房，再把相处的片段收进回忆里。所有进度只留在本机，随时都能清除。" : "Touch, emotion reading, breathing comfort, room choice and memory collection form one short companion loop. Progress stays local and can be cleared at any time."}</p>
          <button onClick={reset}>{locale === "zh" ? "清除本地回忆" : "RESET LOCAL MEMORY"}</button>
        </div>
        <div className="signal-grid">
          {buttonMap.map((item, index) => <article key={item.key}><span>0{index + 1}</span><b style={{ color: item.color }}>{item.label}</b><p>{locale === "zh" ? ["照顾当下", "一起玩一会儿", "看看它怎么了"][index] : ["Respond to a need", "Release tension", "Read a feeling"][index]}</p></article>)}
        </div>
      </section>
    </main>
  );
}
