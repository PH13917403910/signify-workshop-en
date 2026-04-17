"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "./Navbar";
import FloatingTimer from "./FloatingTimer";
import SmartActionBar from "./SmartActionBar";
import AmbientBackground from "./AmbientBackground";
import ResetOverlay from "./ResetOverlay";
import CommandOverlay from "./CommandOverlay";

const ParticleBackground = dynamic(() => import("./ParticleBackground"), {
  ssr: false,
});

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGatePage = pathname === "/access";

  if (isGatePage) {
    return <>{children}</>;
  }

  const isWarmup = pathname === "/warmup";

  return (
    <>
      <AmbientBackground />
      {!isWarmup && <ParticleBackground />}
      <div className="relative z-10">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-6 pb-32">{children}</main>
      </div>
      <FloatingTimer />
      <SmartActionBar />
      <ResetOverlay />
      <CommandOverlay />
    </>
  );
}
