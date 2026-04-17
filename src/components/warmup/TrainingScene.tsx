"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Float } from "@react-three/drei";
import * as THREE from "three";

interface Props {
  trainedCount: number;
  pulseTrigger: number;
}

export default function TrainingScene({ trainedCount, pulseTrigger }: Props) {
  return (
    <group>
      <CentralSphere trainedCount={trainedCount} pulseTrigger={pulseTrigger} />
      <OrbitingParticles trainedCount={trainedCount} />
    </group>
  );
}

/* ─── Central "AI Brain" Sphere ─── */

function CentralSphere({
  trainedCount,
  pulseTrigger,
}: {
  trainedCount: number;
  pulseTrigger: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const scaleTarget = useRef(1);
  const currentScale = useRef(1);

  useEffect(() => {
    if (pulseTrigger > 0) {
      scaleTarget.current = 1.3;
      setTimeout(() => {
        scaleTarget.current = 1;
      }, 300);
    }
  }, [pulseTrigger]);

  const emissiveIntensity = 0.3 + Math.min(trainedCount / 12, 1) * 0.8;

  useFrame(() => {
    if (!meshRef.current) return;
    currentScale.current += (scaleTarget.current - currentScale.current) * 0.12;
    meshRef.current.scale.setScalar(currentScale.current);
  });

  return (
    <Float speed={1} rotationIntensity={0.15} floatIntensity={0.2}>
      <mesh ref={meshRef} position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <MeshDistortMaterial
          color="#c7c7cc"
          emissive="#f97316"
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={0.6}
          roughness={0.2}
          metalness={0.3}
          distort={0.2 + Math.min(trainedCount / 12, 1) * 0.15}
          speed={2}
        />
      </mesh>
      <pointLight
        position={[0, 0.3, 0]}
        color="#f97316"
        intensity={emissiveIntensity * 2}
        distance={5}
      />
    </Float>
  );
}

/* ─── Orbiting text-like particles ─── */

function OrbitingParticles({ trainedCount }: { trainedCount: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const total = 12;
  const remaining = Math.max(0, total - trainedCount);

  const positions = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI * 2;
      const r = 2 + Math.random() * 0.5;
      arr.push(
        new THREE.Vector3(
          Math.cos(angle) * r,
          0.3 + (Math.random() - 0.5) * 1.5,
          Math.sin(angle) * r,
        ),
      );
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.15;
  });

  return (
    <group ref={groupRef}>
      {positions.slice(0, remaining).map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[0.25, 0.08, 0.02]} />
          <meshStandardMaterial
            color="#94a3b8"
            emissive="#f59e0b"
            emissiveIntensity={0.15}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}
