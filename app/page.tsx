"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, Environment, Float, RoundedBox, Sparkles, useGLTF } from "@react-three/drei";
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import Image from "next/image";
import { useTamaStore, type CareAction, type PetAction } from "../src/store/tamaStore";
import { SCENE, THEME } from "../src/config/experience";
import { ASSETS } from "../src/config/assetManifest";

const buttonMap: Array<{ key: PetAction; color: string; x: number; label: string }> = [
  { key: "call", color: THEME.green, x: -0.72, label: "CALL" },
  { key: "play", color: THEME.orange, x: 0, label: "PLAY" },
  { key: "feel", color: THEME.purple, x: 0.72, label: "FEEL" },
];

class ModelErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function DeviceButton({ item, enabled }: { item: (typeof buttonMap)[number]; enabled: boolean }) {
  const group = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const trigger = useTamaStore((s) => s.trigger);
  const url = ASSETS.device.buttons[item.key as keyof typeof ASSETS.device.buttons];
  const { scene } = useGLTF(url);
  const model = useMemo(() => scene.clone(true), [scene]);
  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, pressed ? 0.36 : 0.47, 18, delta);
    const targetScale = hover ? 0.5 : 0.46;
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, targetScale, 14, delta));
  });
  const activate = () => {
    if (!enabled || pressed) return;
    setPressed(true);
    trigger(item.key);
    window.setTimeout(() => setPressed(false), SCENE.pressMs);
  };
  return (
    <group
      ref={group}
      position={[item.x, -1.48, 0.47]}
      scale={0.46}
      onPointerEnter={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = enabled ? "pointer" : "default"; }}
      onPointerLeave={() => { setHover(false); document.body.style.cursor = "default"; }}
      onPointerDown={(e) => { e.stopPropagation(); activate(); }}
    >
      <Center><primitive object={model} /></Center>
      <pointLight color={item.color} intensity={hover ? 3 : 0.4} distance={1.2} />
    </group>
  );
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
  const model = useMemo(() => scene.clone(true), [scene]);
  return (
    <group position={ASSETS.device.full.position} rotation={ASSETS.device.full.rotation} scale={ASSETS.device.full.scale}>
      <Center><primitive object={model} /></Center>
    </group>
  );
}

function Device({ progress }: { progress: number }) {
  const group = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const wake = useTamaStore((s) => s.wake);
  useFrame(({ pointer }, delta) => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, -0.42 + progress * 0.65 + pointer.x * 0.08, 5, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -0.05 + pointer.y * 0.04, 5, delta);
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, progress * 1.1, 5, delta);
    group.current.scale.setScalar(1 + progress * 0.13);
    camera.fov = THREE.MathUtils.damp(camera.fov, 38 - progress * 9, 5, delta);
    camera.updateProjectionMatrix();
  });
  return (
    <group ref={group} rotation={[-0.05, -0.42, 0]}>
      <ModelErrorBoundary fallback={<PlaceholderDevice />}>
        <Suspense fallback={<PlaceholderDevice />}><FormalDeviceModel /></Suspense>
      </ModelErrorBoundary>
      <mesh position={[0.12, 0.42, 0.55]} onPointerDown={(e) => { e.stopPropagation(); wake(); }}>
        <planeGeometry args={[1.86, 1.62]} />
        <meshBasicMaterial color="#071008" transparent opacity={0.05} />
      </mesh>
      {progress > 0.55 && buttonMap.map((item) => (
        <ModelErrorBoundary key={item.key} fallback={<></>}>
          <Suspense fallback={null}><DeviceButton item={item} enabled={progress > 0.64} /></Suspense>
        </ModelErrorBoundary>
      ))}
    </group>
  );
}

function Scene({ progress }: { progress: number }) {
  return (
    <>
      <color attach="background" args={[THEME.background]} />
      <fog attach="fog" args={[THEME.background, 7, 14]} />
      <ambientLight intensity={0.48} color="#dfffd1" />
      <directionalLight position={[-3, 5, 4]} intensity={2.8} color="#f6fff0" />
      <spotLight position={[-5, 5, 5]} intensity={78} color={THEME.green} angle={0.34} penumbra={0.92} />
      <spotLight position={[5, 2, 3]} intensity={58} color={THEME.purple} angle={0.46} penumbra={1} />
      <pointLight position={[0, -2.2, 3.5]} intensity={18} color={THEME.orange} distance={7} />
      <pointLight position={[0, 1.2, 4]} intensity={12} color="#d9ffb8" distance={5} />
      <Sparkles count={60} scale={[8, 6, 5]} size={1.2} speed={0.25} color={THEME.green} opacity={0.28} />
      <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.16}><Device progress={progress} /></Float>
      <Environment preset="city" environmentIntensity={0.72} />
    </>
  );
}

const careActions: Array<{ id: CareAction; icon: string; title: string; copy: string }> = [
  { id: "feed", icon: "♜", title: "FEED", copy: "Fill that tiny tummy" },
  { id: "play", icon: "◇", title: "PLAY", copy: "Turn energy into joy" },
  { id: "clean", icon: "✦", title: "CLEAN", copy: "Fresh fur, clear signal" },
  { id: "sleep", icon: "☾", title: "SLEEP", copy: "Rest and recharge" },
];

function StarGame({ onClose }: { onClose: () => void }) {
  const [time, setTime] = useState(15);
  const [score, setScore] = useState(0);
  const [star, setStar] = useState({ x: 50, y: 45, id: 0 });
  const finishGame = useTamaStore((s) => s.finishGame);
  const finished = useRef(false);

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
    setScore((value) => value + 1);
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
        <div className="game-hud"><span>TIME <b>{String(time).padStart(2, "0")}</b></span><span>SCORE <b>{String(score).padStart(2, "0")}</b></span><span>REWARD <b>+{score * 12}</b></span></div>
        <div className="playfield">
          <div className="scanline" />
          {time > 0 ? (
            <button key={star.id} className="catch-star" style={{ left: `${star.x}%`, top: `${star.y}%` }} onClick={catchStar} aria-label="Catch star">★</button>
          ) : (
            <div className="game-result"><strong>{score}</strong><span>STARS CAUGHT</span><small>+{score * 12} stardust · fun +{score * 2}</small><button onClick={onClose}>RETURN TO MEOWCHI</button></div>
          )}
          <Image src="/reference/phase-two/pet-three-quarter.png" alt="" width={1024} height={1024} />
        </div>
        <footer>CLICK / TAP THE STAR BEFORE IT JUMPS · 15 SECOND ROUND</footer>
      </div>
    </div>
  );
}

function PetHomeModel({ action }: { action: PetAction }) {
  const { scene } = useGLTF(ASSETS.pet.primary);
  const model = useMemo(() => scene.clone(true), [scene]);
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock, pointer }, delta) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, pointer.x * 0.18, 4, delta);
    group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, action === "feel" ? Math.sin(t * 8) * 0.08 : 0, 8, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, action === "play" ? Math.abs(Math.sin(t * 7)) * 0.18 - 1.55 : -1.55, 10, delta);
  });
  return (
    <group ref={group} scale={ASSETS.pet.scale} position={ASSETS.pet.position}>
      <Center bottom><primitive object={model} /></Center>
    </group>
  );
}

function PropModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const model = useMemo(() => scene.clone(true), [scene]);
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.65;
  });
  return <group ref={group} scale={2.2}><Center><primitive object={model} /></Center></group>;
}

function FoodPicker({ onChoose, onClose }: { onChoose: () => void; onClose: () => void }) {
  const foods = [
    { name: "STRAWBERRY", note: "+18 hunger · +3 bond", url: ASSETS.props.strawberry },
    { name: "PUDDING", note: "+18 hunger · +3 bond", url: ASSETS.props.pudding },
  ];
  return (
    <div className="game-overlay" role="dialog" aria-modal="true" aria-label="Choose food">
      <div className="food-window">
        <header><div><p className="eyebrow">FEED MODE · PANTRY</p><h3>Choose a treat.</h3></div><button onClick={onClose} aria-label="Close food picker">×</button></header>
        <div className="food-grid">
          {foods.map((food) => (
            <button key={food.name} onClick={onChoose}>
              <div className="food-model"><Canvas camera={{ position: [0, 0, 3.2], fov: 35 }} dpr={[1, 1.4]}><ambientLight intensity={2} /><spotLight position={[3, 4, 4]} intensity={12} color={THEME.green} /><Suspense fallback={null}><PropModel url={food.url} /></Suspense></Canvas></div>
              <b>{food.name}</b><small>{food.note}</small><span>GIVE TO MEOWCHI →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CareHub() {
  const [gameOpen, setGameOpen] = useState(false);
  const [foodOpen, setFoodOpen] = useState(false);
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
  const mood = bond > 82 ? "radiant" : bond > 64 ? "content" : "curious";
  const statRows = [
    ["HUNGER", stats.hunger],
    ["FUN", stats.fun],
    ["CLEAN", stats.clean],
    ["SLEEP", stats.sleep],
  ] as const;

  return (
    <section className="care-hub" id="pet-home">
      <div className="hub-heading">
        <div>
          <p className="eyebrow">PET HOME · LIVE CARE LOOP</p>
          <h2>Meet <span>Meowchi.</span></h2>
        </div>
        <div className="currency"><i /> {stardust.toLocaleString()} <small>STARDUST</small></div>
      </div>

      <div className="hub-layout">
        <aside className="hub-column">
          <div className="panel status-panel">
            <div className="panel-title"><span>♡</span> STATUS <small>LIVE</small></div>
            {statRows.map(([label, value]) => (
              <div className="stat-row" key={label}>
                <b>{label}</b>
                <div className="stat-track"><span style={{ width: `${value}%` }} /></div>
                <strong>{value}%</strong>
              </div>
            ))}
          </div>
          <div className="panel mood-panel">
            <div className="panel-title"><span>◉</span> MOOD</div>
            <p>{mood}</p>
            <div className="pixel-face">ฅ^•ﻌ•^ฅ</div>
            <small>Bond responds to every care action.</small>
          </div>
        </aside>

        <div className="pet-stage">
          <div className={`pet-aura ${action !== "idle" ? "active" : ""}`} />
          <div className="pet-canvas">
            <Canvas camera={{ position: [0, 0.15, 4.6], fov: 34 }} dpr={[1, 1.5]}>
              <ambientLight intensity={1.45} />
              <spotLight position={[-3, 5, 4]} intensity={24} color={THEME.green} penumbra={1} />
              <spotLight position={[4, 1, 3]} intensity={16} color={THEME.purple} penumbra={1} />
              <ModelErrorBoundary fallback={<></>}><Suspense fallback={null}><PetHomeModel action={action} /></Suspense></ModelErrorBoundary>
              <Environment preset="studio" />
            </Canvas>
          </div>
          <div className="pet-message" data-visible={action !== "idle"}>
            {lastCare === "feed" ? "YUM! +18 HUNGER" : lastCare === "play" ? "WHEE! +14 FUN" : lastCare === "clean" ? "SPARKLY! +22 CLEAN" : lastCare === "sleep" ? "ZZZ… +24 SLEEP" : "SIGNAL RECEIVED"}
          </div>
          <div className="bond-card">
            <span>♥</span>
            <div><small>BOND LV. 04</small><div className="bond-track"><i style={{ width: `${bond}%` }} /></div></div>
            <strong>{bond}%</strong>
          </div>
        </div>

        <aside className="hub-column right">
          <div className="panel charms-panel">
            <div className="panel-title"><span>⌁</span> CHARMS <small>2 / 2</small></div>
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
            <div className="panel-title"><span>↳</span> CARE ACTIONS</div>
            {careActions.map((item) => (
              <button key={item.id} onClick={() => item.id === "play" ? setGameOpen(true) : item.id === "feed" ? setFoodOpen(true) : care(item.id)} disabled={action !== "idle"} className={lastCare === item.id ? "active" : ""}>
                <i>{item.icon}</i><span><b>{item.title}</b><small>{item.copy}</small></span>
              </button>
            ))}
          </div>
        </aside>
      </div>
      <div className="daily-strip">
        <div><p className="eyebrow">DAILY LINK · 01</p><h3>Complete today’s care signal.</h3></div>
        <div className={careCount >= 3 ? "done" : ""}><span>01</span><b>CARE ×3</b><small>{Math.min(careCount, 3)} / 3</small></div>
        <div className={gameBest >= 5 ? "done" : ""}><span>02</span><b>CATCH ×5</b><small>{Math.min(gameBest, 5)} / 5</small></div>
        <button disabled={dailyClaimed || careCount < 3 || gameBest < 5} onClick={claimDaily}>{dailyClaimed ? "CLAIMED ✓" : "CLAIM +250"}</button>
      </div>
      {gameOpen && <StarGame onClose={() => setGameOpen(false)} />}
      {foodOpen && <FoodPicker onClose={() => setFoodOpen(false)} onChoose={() => { care("feed"); setFoodOpen(false); }} />}
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

function RoomEnvironmentModel() {
  const { scene } = useGLTF(ASSETS.scenes.petHomeBlack);
  const model = useMemo(() => scene.clone(true), [scene]);
  return <group scale={7.2} position={[0, -1.35, 0]} rotation={[0, -0.16, 0]}><Center bottom><primitive object={model} /></Center></group>;
}

function RoomPetModel() {
  const { scene } = useGLTF(ASSETS.pet.primary);
  const model = useMemo(() => scene.clone(true), [scene]);
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    group.current.rotation.y = Math.sin(clock.elapsedTime * 0.55) * 0.13;
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, -1.1 + Math.sin(clock.elapsedTime * 1.5) * 0.025, 4, delta);
  });
  return <group ref={group} scale={2.15} position={[0.15, -1.1, 0.75]}><Center bottom><primitive object={model} /></Center></group>;
}

function PetRoom() {
  const [theme, setTheme] = useState<"lab" | "night" | "garden">("night");
  const lighting = {
    lab: { key: "#c9ecff", fill: "#b8ff5f", label: "PIXEL LAB" },
    night: { key: "#aa7be4", fill: "#8bbdff", label: "SOFT NIGHT" },
    garden: { key: "#b8ff5f", fill: "#ffe180", label: "LIME GARDEN" },
  }[theme];
  return (
    <section className={`pet-room theme-${theme}`} id="room">
      <div className="room-head">
        <div><p className="eyebrow">ROOM · LIVE 3D SPACE</p><h2>Meowchi’s little world.</h2></div>
        <div className="theme-switcher">
          {(["lab", "night", "garden"] as const).map((item) => <button key={item} className={theme === item ? "active" : ""} onClick={() => setTheme(item)}>{item === "lab" ? "PIXEL LAB" : item === "night" ? "SOFT NIGHT" : "LIME GARDEN"}</button>)}
        </div>
      </div>
      <div className="room-stage">
        <Canvas camera={{ position: [0, 1.1, 6.2], fov: 38 }} dpr={[1, 1.5]}>
          <color attach="background" args={["#020403"]} />
          <ambientLight intensity={0.58} color={lighting.fill} />
          <spotLight position={[-4, 6, 4]} intensity={50} color={lighting.key} angle={0.48} penumbra={1} />
          <spotLight position={[5, 2, 3]} intensity={30} color={lighting.fill} angle={0.45} penumbra={1} />
          <pointLight position={[0, 0.2, 2]} intensity={14} color={lighting.fill} distance={5} />
          <ModelErrorBoundary fallback={<></>}><Suspense fallback={null}><RoomEnvironmentModel /><RoomPetModel /></Suspense></ModelErrorBoundary>
          <Environment preset="night" environmentIntensity={0.45} />
        </Canvas>
        <div className="room-badge"><i /> {lighting.label}<small>MODEL SPACE ACTIVE</small></div>
        <div className="room-controls"><span>DRAG TO LOOK</span><span>THEME SAVED LOCALLY</span></div>
      </div>
    </section>
  );
}

function ProductStory() {
  return (
    <section className="product-story">
      <div className="story-copy">
        <p className="eyebrow">OBJECT 01 · DESIGNED FOR CONNECTION</p>
        <h2>Transparent,<br />tactile, <span>alive.</span></h2>
        <p>The shell reveals the technology inside while three color-coded buttons turn care into a physical ritual. Every press has a different emotional response.</p>
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

export default function Home() {
  const [target, setTarget] = useState(0);
  const [progress, setProgress] = useState(0);
  const action = useTamaStore((s) => s.action);
  const awake = useTamaStore((s) => s.awake);
  const trigger = useTamaStore((s) => s.trigger);
  const reset = useTamaStore((s) => s.reset);
  const frame = useRef<number | null>(null);
  const reduced = useMemo(() => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches, []);

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
          <a className="brand" href="#top" aria-label="TAMA LINK home"><span>●</span> TAMA LINK</a>
          <div className="status"><i className={awake ? "online" : ""} /> {awake ? "LINK ACTIVE" : "SIGNAL READY"}</div>
        </header>
        <div className="copy" style={{ opacity: 1 - progress * 1.35 }}>
          <p className="eyebrow">A POCKET-SIZED DIGITAL COMPANION</p>
          <h1>CARE IS<br /><em>A SIGNAL.</em></h1>
          <p className="lede">A living connection, waiting on the other side of the glass.</p>
        </div>
        <div className="canvas-wrap"><Canvas camera={{ position: [0, 0, 8], fov: 38 }} dpr={[1, 1.6]}><Scene progress={progress} /></Canvas></div>
        <div className="hint" style={{ opacity: progress > 0.88 ? 0 : 1 - progress * 0.6 }}>
          <span className="wheel" /> {progress < 0.62 ? "SCROLL TO ESTABLISH LINK" : "SELECT A SIGNAL · A / S / D"}
        </div>
        <div className="action-readout" data-visible={action !== "idle"}>{action === "call" ? "CALL · COMING CLOSER" : action === "play" ? "PLAY · HAPPY JUMP" : action === "feel" ? "FEEL · MOOD SIGNAL" : ""}</div>
        <div className="progress"><span style={{ transform: `scaleX(${progress})` }} /></div>
      </section>
      <CareHub />
      <PetRoom />
      <ProductStory />
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
