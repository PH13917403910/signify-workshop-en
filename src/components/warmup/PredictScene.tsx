"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { applyTemperature, type TokenCandidate } from "@/lib/warmup-data";

interface Props {
  candidates: TokenCandidate[];
  temperature: number;
}

const ACCENT = new THREE.Color("#f97316");
const DIM = new THREE.Color("#1e3a5f");

export default function PredictScene({ candidates, temperature }: Props) {
  const baseProbs = candidates.map((c) => c.probability);
  const adjustedProbs = applyTemperature(baseProbs, temperature);

  return (
    <group>
      <ProbabilityTerrain probs={adjustedProbs} />
      {candidates.map((c, i) => (
        <TokenCard
          key={c.token}
          index={i}
          total={candidates.length}
          probability={adjustedProbs[i]}
          isHallucination={!!c.isHallucination}
        />
      ))}
    </group>
  );
}

/* ─── 3D Probability Terrain ─── */

function ProbabilityTerrain({ probs }: { probs: number[] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geoRef = useRef<THREE.PlaneGeometry>(null);

  const segX = 16;
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
          const sigma = 0.1;
          height += probs[p] * 1.5 * Math.exp(-(dist * dist) / (2 * sigma * sigma));
        }

        const edgeFade =
          Math.min(nx, 1 - nx) * 6 *
          Math.min(iz / segZ, 1 - iz / segZ) * 6;
        height *= Math.min(edgeFade, 1);

        pos.setY(idx, height);
      }
    }
    pos.needsUpdate = true;
    geoRef.current.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} position={[0, -2.8, -2]} rotation={[-Math.PI * 0.35, 0, 0]}>
      <planeGeometry ref={geoRef} args={[10, 5, segX, segZ]} />
      <meshStandardMaterial
        color="#0a1525"
        emissive="#f97316"
        emissiveIntensity={0.06}
        wireframe
        transparent
        opacity={0.25}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ─── Floating Token Card ─── */

function TokenCard({
  index,
  total,
  probability,
  isHallucination,
}: {
  index: number;
  total: number;
  probability: number;
  isHallucination: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const emissiveColor = isHallucination
    ? new THREE.Color("#ef4444")
    : ACCENT;

  const position = useMemo(() => {
    const angle = ((index - (total - 1) / 2) / total) * Math.PI * 0.6;
    const radius = 3.5;
    return new THREE.Vector3(
      Math.sin(angle) * radius,
      0.5 - index * 0.15,
      Math.cos(angle) * radius - radius + 0.5,
    );
  }, [index, total]);

  const emissiveIntensity = probability * 1.5;

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity += (emissiveIntensity - mat.emissiveIntensity) * 0.08;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[0.8, 0.5, 0.04]} />
        <meshStandardMaterial
          color="#162544"
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={0.5 + probability * 0.3}
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>
    </Float>
  );
}
