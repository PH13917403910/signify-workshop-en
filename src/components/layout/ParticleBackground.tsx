"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";

const PARTICLE_COUNT = 30;

function FloatingParticles() {
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
      <meshBasicMaterial color="#f97316" transparent opacity={0.45} />
    </instancedMesh>
  );
}

export default function ParticleBackground() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true }}
      camera={{ position: [0, 0, 6], fov: 50 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
      }}
    >
      <AdaptiveDpr pixelated />
      <FloatingParticles />
    </Canvas>
  );
}
