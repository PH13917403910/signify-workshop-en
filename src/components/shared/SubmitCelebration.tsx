"use client";

import { useEffect, useState } from "react";

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  emoji: ["🎉", "✨", "🏆", "🎯", "⭐", "🚀"][i % 6],
  left: Math.random() * 100,
  delay: Math.random() * 600,
  duration: 1200 + Math.random() * 800,
}));

export default function SubmitCelebration({
  show,
  message = "Submitted!",
}: {
  show: boolean;
  message?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center">
      {/* Particle burst */}
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className="absolute text-2xl animate-float-up"
          style={{
            left: `${p.left}%`,
            bottom: "30%",
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* Center message */}
      <div className="animate-scale-in rounded-3xl bg-green-500/90 backdrop-blur-xl px-10 py-6 shadow-lg shadow-green-500/15">
        <p className="text-3xl font-black text-white text-center">{message}</p>
      </div>
    </div>
  );
}
