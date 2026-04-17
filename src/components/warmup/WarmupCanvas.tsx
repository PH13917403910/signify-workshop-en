"use client";

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import type { TokenCandidate } from "@/lib/warmup-data";

import PredictScene from "./PredictScene";
import SamplingScene from "./SamplingScene";
import TrainingScene from "./TrainingScene";

export type WarmupPhase =
  | "predict"
  | "hallucination"
  | "bridge"
  | "sampling"
  | "training"
  | "insight";

export interface WarmupCanvasProps {
  phase: WarmupPhase;
  candidates: TokenCandidate[];
  temperature: number;
  samplingBallTrigger: number;
  trainedCount: number;
  trainPulseTrigger: number;
  barValues: number[];
}

export default function WarmupCanvas(props: WarmupCanvasProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 6], fov: 50 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
      }}
    >
      <AdaptiveDpr pixelated />
      <PerformanceMonitor />
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.6} color="#f97316" />
      <pointLight position={[-5, -3, 3]} intensity={0.3} color="#3b82f6" />

      <Suspense fallback={null}>
        <FloatingParticles phase={props.phase} />
        <SceneRouter {...props} />
      </Suspense>
    </Canvas>
  );
}

/* ─── Scene Router ─── */

function SceneRouter(props: WarmupCanvasProps) {
  const { phase } = props;

  if (phase === "predict" || phase === "hallucination" || phase === "bridge") {
    return null;
  }

  if (phase === "sampling") {
    return (
      <SamplingScene
        candidates={props.candidates}
        temperature={props.temperature}
        ballTrigger={props.samplingBallTrigger}
      />
    );
  }

  if (phase === "training") {
    return (
      <TrainingScene
        trainedCount={props.trainedCount}
        pulseTrigger={props.trainPulseTrigger}
      />
    );
  }

  return null;
}

/* ─── Ambient floating particles ─── */

const PARTICLE_COUNT = 40;

function FloatingParticles({ phase }: { phase: WarmupPhase }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { offsets, speeds } = useMemo(() => {
    const o = new Float32Array(PARTICLE_COUNT * 3);
    const s = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      o[i * 3] = (Math.random() - 0.5) * 16;
      o[i * 3 + 1] = (Math.random() - 0.5) * 10;
      o[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
      s[i] = 0.2 + Math.random() * 0.6;
    }
    return { offsets: o, speeds: s };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => {
    if (phase === "hallucination") return new THREE.Color("#ef4444");
    if (phase === "training") return new THREE.Color("#f59e0b");
    return new THREE.Color("#f97316");
  }, [phase]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const speed = speeds[i];
      dummy.position.set(
        offsets[i * 3] + Math.sin(t * speed + i) * 0.5,
        offsets[i * 3 + 1] + Math.cos(t * speed * 0.7 + i * 2) * 0.4,
        offsets[i * 3 + 2],
      );
      const scale = 0.015 + Math.sin(t * speed * 1.5 + i) * 0.008;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </instancedMesh>
  );
}
