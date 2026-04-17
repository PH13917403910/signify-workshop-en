"use client";

import { useEffect, useState, useRef } from "react";
import { useWorkshopState } from "@/hooks/useSocket";
import { getSocket } from "@/lib/socket-client";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const ALERT_THRESHOLDS = [300, 60];

export default function FloatingTimer() {
  const { timer } = useWorkshopState();
  const [flash, setFlash] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const alertedRef = useRef<Set<number>>(new Set());

  const active = timer.total > 0 && timer.remaining > 0;
  const urgent = timer.remaining <= 60 && timer.remaining > 0;

  useEffect(() => {
    if (!timer.running || timer.remaining <= 0) return;

    for (const t of ALERT_THRESHOLDS) {
      if (
        timer.remaining <= t &&
        timer.remaining > t - 2 &&
        !alertedRef.current.has(t)
      ) {
        alertedRef.current.add(t);
        const msg =
          t >= 60
            ? `${Math.ceil(t / 60)} min left — keep going!`
            : "Final minute!";
        setAlert(msg);
        setTimeout(() => setAlert(null), 3000);
      }
    }
  }, [timer.remaining, timer.running]);

  useEffect(() => {
    if (timer.total > 0 && timer.running) {
      alertedRef.current.clear();
    }
  }, [timer.total, timer.running]);

  useEffect(() => {
    const socket = getSocket();
    const onFinished = () => {
      setFlash(true);
      setTimeout(() => setFlash(false), 5000);
    };
    socket.on("timer:finished", onFinished);
    return () => {
      socket.off("timer:finished", onFinished);
    };
  }, []);

  if (!active && !flash) return null;

  const pct = timer.total > 0 ? (timer.remaining / timer.total) * 100 : 0;

  return (
    <>
      {alert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] animate-slide-up pointer-events-none">
          <div className="rounded-2xl bg-amber-500 px-6 py-3 shadow-lg shadow-amber-500/20">
            <p className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <span>⏰</span> {alert}
            </p>
          </div>
        </div>
      )}
    <div className="fixed bottom-16 inset-x-0 z-[90] pointer-events-none" style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div
        className={`mx-auto max-w-2xl px-4 pb-2 transition-all duration-500 ${
          active || flash ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <div
          className={`pointer-events-auto rounded-2xl border px-6 py-4 shadow-lg transition-colors duration-300 ${
            flash
              ? "bg-red-50 border-red-200 timer-flash"
              : urgent
                ? "bg-red-50 border-red-200"
                : "bg-white/90 border-black/[0.06]"
          }`}
          style={{ backdropFilter: "blur(24px) saturate(1.4)", WebkitBackdropFilter: "blur(24px) saturate(1.4)" }}
        >
          <div className="h-1 w-full rounded-full bg-black/[0.05] mb-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                urgent
                  ? "bg-gradient-to-r from-red-500 to-red-400"
                  : "bg-gradient-to-r from-accent to-amber-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {flash ? (
                <span className="text-2xl animate-bounce">🔔</span>
              ) : timer.running ? (
                <span className="relative flex h-3 w-3">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                      urgent ? "bg-red-400" : "bg-green-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-3 w-3 rounded-full ${
                      urgent ? "bg-red-500" : "bg-green-500"
                    }`}
                  />
                </span>
              ) : (
                <span className="h-3 w-3 rounded-full bg-yellow-500" />
              )}
              <span className="text-xs text-gray-500 font-medium">
                {flash ? "Time's up!" : timer.running ? "Countdown running" : "Paused"}
              </span>
            </div>

            <span
              className={`font-display text-4xl font-black tabular-nums tracking-tight ${
                flash
                  ? "text-red-500 animate-pulse"
                  : urgent
                    ? "text-red-500"
                    : "text-gray-900"
              }`}
            >
              {flash ? "00:00" : formatTime(timer.remaining)}
            </span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
