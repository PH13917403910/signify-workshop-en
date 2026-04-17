"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { applyTemperature, type TokenCandidate } from "@/lib/warmup-data";

interface Props {
  candidates: TokenCandidate[];
  temperature: number;
  ballTrigger: number;
}

const ACCENT = new THREE.Color("#f97316");
const BALL_COLORS = ["#f97316", "#fb923c", "#f59e0b", "#fbbf24", "#34d399"];

interface BallState {
  id: number;
  targetX: number;
  phase: "falling" | "bouncing" | "settled";
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: string;
}

export default function SamplingScene({ candidates, temperature, ballTrigger }: Props) {
  const baseProbs = candidates.map((c) => c.probability);
  const adjustedProbs = applyTemperature(baseProbs, temperature);
  const [balls, setBalls] = useState<BallState[]>([]);
  const ballCountRef = useRef(0);

  useEffect(() => {
    if (ballTrigger <= 0) return;

    const cumulative: number[] = [];
    let sum = 0;
    for (const p of adjustedProbs) {
      sum += p;
      cumulative.push(sum);
    }
    const rand = Math.random();
    const sampledIdx = cumulative.findIndex((c) => rand <= c);
    const targetX = ((sampledIdx - (candidates.length - 1) / 2) / candidates.length) * 6;

    ballCountRef.current += 1;
    const newBall: BallState = {
      id: ballCountRef.current,
      targetX,
      phase: "falling",
      pos: new THREE.Vector3(targetX + (Math.random() - 0.5) * 2, 4, 0),
      vel: new THREE.Vector3(0, 0, 0),
      color: BALL_COLORS[(ballCountRef.current - 1) % BALL_COLORS.length],
    };

    setBalls((prev) => [...prev.slice(-4), newBall]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ballTrigger]);

  return (
    <group>
      <SamplingTerrain probs={adjustedProbs} />
      {balls.map((ball) => (
        <SamplingBall key={ball.id} initial={ball} probs={adjustedProbs} candidateCount={candidates.length} />
      ))}
    </group>
  );
}

/* ─── Terrain (same as PredictScene but angled differently) ─── */

function SamplingTerrain({ probs }: { probs: number[] }) {
  const geoRef = useRef<THREE.PlaneGeometry>(null);
  const segX = 30;
  const segZ = 8;

  useFrame(() => {
    if (!geoRef.current) return;
    const pos = geoRef.current.attributes.position;
    const cols = segX + 1;
    const rows = segZ + 1;

    for (let iz = 0; iz < rows; iz++) {
      for (let ix = 0; ix < cols; ix++) {
        const idx = iz * cols + ix;
        const nx = ix / segX;

        let height = 0;
        for (let p = 0; p < probs.length; p++) {
          const center = (p + 0.5) / probs.length;
          const dist = Math.abs(nx - center);
          const sigma = 0.06;
          height += probs[p] * 4 * Math.exp(-(dist * dist) / (2 * sigma * sigma));
        }

        const zFade = Math.min(iz / segZ, 1 - iz / segZ) * 4;
        height *= Math.min(zFade, 1);

        pos.setY(idx, height);
      }
    }
    pos.needsUpdate = true;
    geoRef.current.computeVertexNormals();
  });

  return (
    <mesh position={[0, -2, 0]} rotation={[-Math.PI * 0.45, 0, 0]}>
      <planeGeometry ref={geoRef} args={[8, 3, segX, segZ]} />
      <meshStandardMaterial
        color="#e8e8ed"
        emissive="#f59e0b"
        emissiveIntensity={0.12}
        wireframe
        transparent
        opacity={0.45}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ─── Ball that falls and bounces on terrain ─── */

function SamplingBall({
  initial,
  probs,
  candidateCount,
}: {
  initial: BallState;
  probs: number[];
  candidateCount: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const stateRef = useRef({
    y: 4,
    vy: 0,
    x: initial.pos.x,
    settled: false,
    bounces: 0,
  });

  const targetHeight = useMemo(() => {
    const nx = (initial.targetX / 8 + 0.5);
    let h = 0;
    for (let p = 0; p < probs.length; p++) {
      const center = (p + 0.5) / probs.length;
      const dist = Math.abs(nx - center);
      const sigma = 0.06;
      h += probs[p] * 4 * Math.exp(-(dist * dist) / (2 * sigma * sigma));
    }
    return -2 + h * 0.6;
  }, [initial.targetX, probs]);

  const color = useMemo(() => new THREE.Color(initial.color), [initial.color]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const s = stateRef.current;
    const dt = Math.min(delta, 0.05);

    if (!s.settled) {
      s.vy -= 12 * dt;
      s.y += s.vy * dt;

      s.x += (initial.targetX - s.x) * 2 * dt;

      if (s.y <= targetHeight) {
        s.y = targetHeight;
        s.vy = Math.abs(s.vy) * 0.35;
        s.bounces++;
        if (s.bounces >= 3 || Math.abs(s.vy) < 0.3) {
          s.settled = true;
          s.y = targetHeight;
          s.vy = 0;
        }
      }
    }

    meshRef.current.position.set(s.x, s.y, 0.5);
  });

  return (
    <mesh ref={meshRef} position={[initial.pos.x, 4, 0.5]}>
      <sphereGeometry args={[0.12, 12, 12]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.2}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}
