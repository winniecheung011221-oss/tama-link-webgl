"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, RoundedBox, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Image from "next/image";
import { useTamaStore, type CareAction, type PetAction } from "../src/store/tamaStore";
import { SCENE, THEME } from "../src/config/experience";

const buttonMap: Array<{ key: PetAction; color: string; x: number; label: string }> = [
  { key: "call", color: THEME.green, x: -0.72, label: "CALL" },
  { key: "play", color: THEME.orange, x: 0, label: "PLAY" },
  { key: "feel", color: THEME.purple, x: 0.72, label: "FEEL" },
];

function Pet({ action }: { action: PetAction }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.rotation.z = THREE.MathUtils.damp(
      group.current.rotation.z,
      action === "feel" ? Math.sin(t * 10) * 0.18 : 0,
      10,
      delta,
    );
    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      action === "play" ? Math.abs(Math.sin(t * 8)) * 0.25 : action === "call" ? 0.08 : 0,
      12,
      delta,
    );
    const s = action === "call" ? 1.1 : 1;
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, s, 10, delta));
  });
  return (
    <group ref={group} position={[0, 0.22, 0.32]}>
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.55, 40, 40]} />
        <meshStandardMaterial color="#b7ff6a" roughness={0.78} />
      </mesh>
      <mesh position={[-0.32, 0.56, 0]} rotation={[0, 0, -0.28]}>
        <coneGeometry args={[0.19, 0.48, 24]} />
        <meshStandardMaterial color="#b7ff6a" roughness={0.8} />
      </mesh>
      <mesh position={[0.32, 0.56, 0]} rotation={[0, 0, 0.28]}>
        <coneGeometry args={[0.19, 0.48, 24]} />
        <meshStandardMaterial color="#b7ff6a" roughness={0.8} />
      </mesh>
      {[-0.19, 0.19].map((x) => (
        <mesh key={x} position={[x, 0.23, 0.51]}>
          <sphereGeometry args={[0.055, 20, 20]} />
          <meshBasicMaterial color="#091108" />
        </mesh>
      ))}
      <mesh position={[0, 0.03, 0.53]} scale={[1.4, 0.6, 0.4]}>
        <sphereGeometry args={[0.055, 20, 20]} />
        <meshBasicMaterial color="#ff9bb8" />
      </mesh>
      <mesh position={[-0.42, -0.05, 0.42]}><sphereGeometry args={[0.1, 20, 20]} /><meshBasicMaterial color="#ff9bb8" transparent opacity={0.75} /></mesh>
      <mesh position={[0.42, -0.05, 0.42]}><sphereGeometry args={[0.1, 20, 20]} /><meshBasicMaterial color="#ff9bb8" transparent opacity={0.75} /></mesh>
    </group>
  );
}

function DeviceButton({ item, enabled }: { item: (typeof buttonMap)[number]; enabled: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const trigger = useTamaStore((s) => s.trigger);
  useFrame((_, delta) => {
    if (!mesh.current) return;
    mesh.current.position.z = THREE.MathUtils.damp(mesh.current.position.z, pressed ? 0.22 : 0.32, 18, delta);
    mesh.current.scale.setScalar(THREE.MathUtils.damp(mesh.current.scale.x, hover ? 1.08 : 1, 14, delta));
  });
  const activate = () => {
    if (!enabled || pressed) return;
    setPressed(true);
    trigger(item.key);
    window.setTimeout(() => setPressed(false), SCENE.pressMs);
  };
  return (
    <mesh
      ref={mesh}
      position={[item.x, -1.28, 0.32]}
      onPointerEnter={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = enabled ? "pointer" : "default"; }}
      onPointerLeave={() => { setHover(false); document.body.style.cursor = "default"; }}
      onPointerDown={(e) => { e.stopPropagation(); activate(); }}
    >
      <cylinderGeometry args={[0.23, 0.23, 0.18, 40]} />
      <meshPhysicalMaterial color={item.color} emissive={item.color} emissiveIntensity={hover ? 1.5 : 0.35} transmission={0.35} roughness={0.22} />
    </mesh>
  );
}

function Device({ progress }: { progress: number }) {
  const group = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const action = useTamaStore((s) => s.action);
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
      <RoundedBox args={[3.4, 4.55, 0.78]} radius={0.76} smoothness={8}>
        <meshPhysicalMaterial color="#84908c" transparent opacity={0.58} transmission={0.22} roughness={0.32} metalness={0.22} />
      </RoundedBox>
      <RoundedBox args={[2.72, 2.36, 0.12]} radius={0.34} position={[0, 0.38, 0.45]} smoothness={6}>
        <meshStandardMaterial color="#101411" metalness={0.35} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.38, 0.54]} onPointerDown={(e) => { e.stopPropagation(); wake(); }}>
        <planeGeometry args={[2.35, 1.92]} />
        <meshBasicMaterial color="#132015" />
      </mesh>
      <Pet action={action} />
      {buttonMap.map((item) => <DeviceButton key={item.key} item={item} enabled={progress > 0.64} />)}
      <mesh position={[0, 2.38, 0]}><torusGeometry args={[0.32, 0.09, 16, 40]} /><meshStandardMaterial color="#a8b2ae" metalness={0.8} roughness={0.25} /></mesh>
    </group>
  );
}

function Scene({ progress }: { progress: number }) {
  return (
    <>
      <color attach="background" args={[THEME.background]} />
      <fog attach="fog" args={[THEME.background, 7, 14]} />
      <ambientLight intensity={0.75} />
      <spotLight position={[-4, 6, 6]} intensity={55} color={THEME.green} angle={0.35} penumbra={1} />
      <spotLight position={[5, 0, 4]} intensity={35} color={THEME.purple} angle={0.5} penumbra={1} />
      <Sparkles count={60} scale={[8, 6, 5]} size={1.2} speed={0.25} color={THEME.green} opacity={0.28} />
      <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.16}><Device progress={progress} /></Float>
      <Environment preset="city" />
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

function CareHub() {
  const [gameOpen, setGameOpen] = useState(false);
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
          <Image
            src={lastCare === "play" ? "/reference/phase-two/pet-three-quarter.png" : lastCare === "sleep" ? "/reference/phase-two/pet-side.png" : "/reference/phase-two/pet-front.png"}
            alt="Meowchi, a soft lime-green cat companion"
            width={1024}
            height={1024}
            priority
          />
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
              <button key={item.id} onClick={() => item.id === "play" ? setGameOpen(true) : care(item.id)} disabled={action !== "idle"} className={lastCare === item.id ? "active" : ""}>
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
