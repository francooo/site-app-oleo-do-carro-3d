"use client";

import { OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { FluidIcon } from "@/components/icons/fluids";
import {
  type EngineScene,
  type FillPoint,
  fillPointAnchor,
  type ScenePart,
  type Vec3,
  visibleFillPoints,
} from "@/lib/domain/engine-scene";

const ACCENT = "#f0a64a";

type Props = {
  scene: EngineScene;
  /** Fluidos com ponto no banco (engine_layout_hotspots), com o rótulo do app. */
  fluids: { code: string; label: string }[];
  selected: string | null;
  onSelect: (code: string | null) => void;
};

// Cofre do motor em 3D (ilustração). Arrastar gira, pinça/scroll aproxima;
// tocar num ponto aproxima a câmera e abre a ficha do fluido. Carregado só
// no navegador (next/dynamic com ssr:false em engine-bay-diagram.tsx).
export default function EngineBay3D({ scene, fluids, selected, onSelect }: Props) {
  const points = useMemo(
    () =>
      visibleFillPoints(
        scene,
        fluids.map((f) => f.code),
      ),
    [scene, fluids],
  );
  const reducedMotion = usePrefersReducedMotion();
  // Rótulos são <button> comuns sobre o canvas; a posição na tela é
  // recalculada a cada quadro (LabelProjector) direto no style, sem re-render.
  const labelEls = useRef<Record<string, HTMLButtonElement | null>>({});

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [...scene.camera.position], fov: 38, near: 0.05, far: 30 }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => onSelect(null)}
        aria-hidden="true"
      >
        <ambientLight intensity={0.55} color="#fff1dc" />
        <hemisphereLight args={["#fff1dc", "#1a1412", 0.8]} />
        <directionalLight position={[1.2, 2.6, 2]} intensity={2.2} color="#fff4e6" />
        <directionalLight position={[-1.6, 1.4, -0.6]} intensity={0.6} color="#c47a2c" />
        {/* Luzes do capô, como na foto do cofre. */}
        <pointLight position={[-0.5, 1.1, -0.5]} intensity={3} distance={3} color="#ffd29a" />
        <pointLight position={[0.5, 1.1, -0.5]} intensity={3} distance={3} color="#ffd29a" />

        {scene.parts.map((p) => (
          <Part key={p.id} part={p} />
        ))}
        {scene.hoses.map((h) => (
          <Hose key={h.id} points={h.points} radius={h.radius} />
        ))}
        {points.map((p) => (
          <FillPointMesh
            key={p.fluid}
            point={p}
            active={selected === p.fluid}
            dimmed={selected != null && selected !== p.fluid}
            onSelect={() => onSelect(selected === p.fluid ? null : p.fluid)}
          />
        ))}

        <LabelProjector points={points} labelEls={labelEls} />
        <CameraRig scene={scene} points={points} selected={selected} instant={reducedMotion} />
      </Canvas>

      {points.map((p) => {
        const label = fluids.find((f) => f.code === p.fluid)?.label ?? p.fluid;
        const active = selected === p.fluid;
        const dimmed = selected != null && !active;
        return (
          <button
            key={p.fluid}
            ref={(el) => {
              labelEls.current[p.fluid] = el;
            }}
            type="button"
            onClick={() => onSelect(active ? null : p.fluid)}
            aria-pressed={active}
            style={{ visibility: "hidden" }}
            className={`absolute top-0 left-0 z-10 flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap shadow-[0_0_18px_rgba(240,166,74,0.35)] backdrop-blur transition-[background-color,border-color,opacity] ${
              active
                ? "border-accent bg-accent text-accent-foreground"
                : "border-copper/70 bg-surface-lowest/85 text-foreground-strong"
            } ${dimmed ? "opacity-50" : ""}`}
          >
            <FluidIcon fluidKey={p.fluid} className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Projeta a âncora de cada ponto na tela e move o rótulo correspondente. */
function LabelProjector({
  points,
  labelEls,
}: {
  points: FillPoint[];
  labelEls: React.RefObject<Record<string, HTMLButtonElement | null>>;
}) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    for (const p of points) {
      const el = labelEls.current[p.fluid];
      if (!el) continue;
      const [x, y, z] = fillPointAnchor(p);
      v.set(x, y + LABEL_LIFT, z).project(camera);
      const px = ((v.x + 1) / 2) * size.width;
      const sy = ((1 - v.y) / 2) * size.height;
      // Ponto fora do quadro (câmera aproximada em outro ponto): some o rótulo
      // em vez de deixá-lo preso na borda, apontando para o lugar errado.
      if (v.z > 1 || px < 0 || px > size.width || sy < 0 || sy > size.height) {
        placeLabel(el, null);
        continue;
      }
      // Perto da borda: empurra para dentro para o texto não cortar.
      const halfW = el.offsetWidth / 2;
      placeLabel(el, [Math.min(Math.max(px, halfW + 6), size.width - halfW - 6), sy]);
    }
  });
  return null;
}

const LABEL_LIFT = 0.2;

// Escrita direta no DOM a cada quadro (fora do React, de propósito: evita
// re-render 60x por segundo).
function placeLabel(el: HTMLElement, at: [number, number] | null) {
  if (!at) {
    el.style.visibility = "hidden";
    return;
  }
  el.style.transform = `translate(${at[0]}px, ${at[1]}px) translate(-50%, -50%)`;
  el.style.visibility = "visible";
}

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

function Part({ part }: { part: ScenePart }) {
  const material = (
    <meshStandardMaterial
      color={part.color}
      metalness={part.metalness ?? 0.15}
      roughness={part.roughness ?? 0.7}
      emissive={part.emissive ?? "#000000"}
      emissiveIntensity={part.emissive ? 0.9 : 0}
    />
  );
  const rotation = part.rotation ? ([...part.rotation] as [number, number, number]) : undefined;

  if (part.shape === "rounded") {
    return (
      <RoundedBox
        args={[...part.size]}
        radius={Math.min(...part.size) * 0.3}
        smoothness={3}
        position={[...part.position]}
        rotation={rotation}
      >
        {material}
      </RoundedBox>
    );
  }
  if (part.shape === "cylinder") {
    const [r, h] = part.size;
    return (
      <mesh position={[...part.position]} rotation={rotation}>
        <cylinderGeometry args={[r, r, h, 24]} />
        {material}
      </mesh>
    );
  }
  return (
    <mesh position={[...part.position]} rotation={rotation}>
      <boxGeometry args={[...part.size]} />
      {material}
    </mesh>
  );
}

function Hose({ points, radius }: { points: readonly Vec3[]; radius: number }) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return new THREE.TubeGeometry(curve, 24, radius, 10, false);
  }, [points, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#121110" roughness={0.6} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Pontos de abastecimento
// ---------------------------------------------------------------------------

function FillPointMesh({
  point,
  active,
  dimmed,
  onSelect,
}: {
  point: FillPoint;
  active: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!glow.current) return;
    glow.current.emissiveIntensity = active ? 0.55 + Math.sin(clock.elapsedTime * 4) * 0.35 : 0;
  });

  const anchor = fillPointAnchor(point);
  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect();
  };

  return (
    <group>
      {point.kind === "tank" ? (
        <Tank point={point} glowRef={glow} onClick={handleClick} />
      ) : (
        <Dipstick point={point} glowRef={glow} onClick={handleClick} />
      )}

      {/* Haste até o rótulo. */}
      <mesh position={[anchor[0], anchor[1] + LABEL_LIFT / 2, anchor[2]]}>
        <cylinderGeometry args={[0.003, 0.003, LABEL_LIFT, 6]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={dimmed ? 0.25 : 0.85} />
      </mesh>
    </group>
  );
}

type ClickHandler = (e: { stopPropagation: () => void }) => void;

function Tank({
  point,
  glowRef,
  onClick,
}: {
  point: Extract<FillPoint, { kind: "tank" }>;
  glowRef: React.RefObject<THREE.MeshStandardMaterial | null>;
  onClick: ClickHandler;
}) {
  const [x, y, z] = point.position;
  const [w, h, d] = point.size;
  // Líquido entre MIN (25% da altura) e MAX (80%).
  const minY = h * 0.25;
  const maxY = h * 0.8;
  const liquidH = minY + (maxY - minY) * point.level;
  const capR = Math.min(w, d) * 0.32;

  return (
    <group position={[x, y, z]} onClick={onClick}>
      {/* Corpo translúcido */}
      <RoundedBox
        args={[w, h, d]}
        radius={Math.min(w, d) * 0.18}
        smoothness={3}
        position={[0, h / 2, 0]}
      >
        <meshPhysicalMaterial
          color="#f3eee6"
          transparent
          opacity={0.38}
          roughness={0.25}
          clearcoat={0.6}
          depthWrite={false}
        />
      </RoundedBox>
      {/* Líquido */}
      <mesh position={[0, liquidH / 2 + 0.004, 0]}>
        <boxGeometry args={[w * 0.86, liquidH, d * 0.86]} />
        <meshStandardMaterial
          color={point.liquidColor}
          emissive={point.liquidColor}
          emissiveIntensity={0.25}
          roughness={0.3}
        />
      </mesh>
      {/* Marcas MIN e MAX na face da frente */}
      {[minY, maxY].map((my) => (
        <mesh key={my} position={[0, my, d / 2 + 0.002]}>
          <boxGeometry args={[w * 0.5, 0.005, 0.002]} />
          <meshBasicMaterial color="#2a2522" />
        </mesh>
      ))}
      {/* Gargalo e tampa */}
      <mesh position={[0, h + 0.012, 0]}>
        <cylinderGeometry args={[capR * 0.8, capR * 0.8, 0.024, 24]} />
        <meshStandardMaterial color="#e8e2d8" roughness={0.4} />
      </mesh>
      <mesh position={[0, h + 0.035, 0]}>
        <cylinderGeometry args={[capR, capR, 0.03, 28]} />
        <meshStandardMaterial
          ref={glowRef}
          color={point.capColor}
          emissive={ACCENT}
          emissiveIntensity={0.25}
          roughness={0.45}
        />
      </mesh>
    </group>
  );
}

function Dipstick({
  point,
  glowRef,
  onClick,
}: {
  point: Extract<FillPoint, { kind: "dipstick" }>;
  glowRef: React.RefObject<THREE.MeshStandardMaterial | null>;
  onClick: ClickHandler;
}) {
  const [x, y, z] = point.position;
  return (
    <group position={[x, y, z]} onClick={onClick}>
      {/* Argola */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.035, 0.011, 12, 28]} />
        <meshStandardMaterial
          ref={glowRef}
          color={point.color}
          emissive={ACCENT}
          emissiveIntensity={0.25}
          roughness={0.4}
        />
      </mesh>
      {/* Tubo da vareta descendo até o bloco */}
      <mesh position={[0, -0.14, -0.02]} rotation={[0.15, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.24, 10]} />
        <meshStandardMaterial color={point.color} roughness={0.5} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Câmera
// ---------------------------------------------------------------------------

type ControlsLike = { target: THREE.Vector3; update: () => void };

function CameraRig({
  scene,
  points,
  selected,
  instant,
}: {
  scene: EngineScene;
  points: FillPoint[];
  selected: string | null;
  instant: boolean;
}) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as ControlsLike | null;
  const goal = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  useEffect(() => {
    const point = points.find((p) => p.fluid === selected);
    const home = {
      position: new THREE.Vector3(...scene.camera.position),
      target: new THREE.Vector3(...scene.camera.target),
    };
    if (!point) {
      goal.current = home;
      return;
    }
    const target = new THREE.Vector3(...fillPointAnchor(point));
    // Aproxima mantendo a direção de visão de frente/de cima.
    const dir = home.position.clone().sub(home.target).normalize();
    goal.current = { target, position: target.clone().add(dir.multiplyScalar(1.6)) };
  }, [selected, points, scene]);

  const placed = useRef(false);
  useFrame((_, delta) => {
    const g = goal.current;
    if (!g || !controls) return;
    // Primeiro quadro: posiciona direto (sem deslizar da origem).
    const t = instant || !placed.current ? 1 : 1 - Math.exp(-delta * 4);
    placed.current = true;
    camera.position.lerp(g.position, t);
    controls.target.lerp(g.target, t);
    controls.update();
    if (
      camera.position.distanceTo(g.position) < 0.005 &&
      controls.target.distanceTo(g.target) < 0.005
    ) {
      goal.current = null; // devolve o controle ao usuário
    }
  });

  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableDamping
      minDistance={0.7}
      maxDistance={3.8}
      minPolarAngle={0.2}
      maxPolarAngle={1.3}
      minAzimuthAngle={-1.2}
      maxAzimuthAngle={1.2}
      onStart={() => {
        goal.current = null;
      }}
    />
  );
}

function usePrefersReducedMotion() {
  // Só roda no navegador (ssr:false), então dá para ler na inicialização.
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  return reduced;
}
