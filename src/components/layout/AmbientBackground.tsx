"use client";

export default function AmbientBackground() {
  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[#f5f5f7]" />

      {/* Subtle warm orbs — Apple-style soft ambient glow */}
      <div
        className="absolute rounded-full ambient-orb-1"
        style={{
          width: "50vw",
          height: "50vw",
          top: "-15%",
          left: "10%",
          background:
            "radial-gradient(circle, rgba(249,115,22,0.03) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute rounded-full ambient-orb-2"
        style={{
          width: "40vw",
          height: "40vw",
          top: "50%",
          left: "55%",
          background:
            "radial-gradient(circle, rgba(245,158,11,0.025) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        className="absolute rounded-full ambient-orb-3"
        style={{
          width: "45vw",
          height: "45vw",
          top: "30%",
          left: "-5%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.02) 0%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />

      <div className="noise absolute inset-0" />
    </div>
  );
}
