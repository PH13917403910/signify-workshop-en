"use client";

import type { TimerState } from "@/lib/types";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function Timer({ timer }: { timer: TimerState }) {
  if (timer.total === 0) return null;

  const pct = timer.total > 0 ? (timer.remaining / timer.total) * 100 : 0;
  const urgent = timer.remaining <= 60 && timer.remaining > 0;

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-1.5 w-28 rounded-full bg-black/[0.06] overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
            urgent
              ? "bg-gradient-to-r from-red-500 to-red-400"
              : "bg-gradient-to-r from-accent to-amber-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`font-display text-base font-bold tabular-nums tracking-tight ${
          urgent ? "text-red-500 animate-pulse" : "text-gray-700"
        }`}
      >
        {formatTime(timer.remaining)}
      </span>
      {timer.running && (
        <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
      )}
    </div>
  );
}
