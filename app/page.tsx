"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, RoundedBox, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useTamaStore, type PetAction } from "../src/store/tamaStore";
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
      <section className="home-section">
        <div>
          <p className="eyebrow">PET HOME · PHASE 01 PREVIEW</p>
          <h2>{awake ? "Good morning,\nwe’re linked." : "Tap the screen\nto wake your pet."}</h2>
          <p>The formal room, care loops, and collectible charms will plug into this scene in the next phase.</p>
          <button onClick={reset}>RESET LINK</button>
        </div>
        <div className="signal-grid">
          {buttonMap.map((item, index) => <article key={item.key}><span>0{index + 1}</span><b style={{ color: item.color }}>{item.label}</b><p>{index === 0 ? "Come closer" : index === 1 ? "Jump & play" : "Share a feeling"}</p></article>)}
        </div>
      </section>
    </main>
  );
}
