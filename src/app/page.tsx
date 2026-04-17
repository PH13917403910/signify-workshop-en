"use client";

import Link from "next/link";
import { useWorkshopState } from "@/hooks/useSocket";
import { stages } from "@/lib/workshop-data";
import AutoTerm from "@/components/shared/AutoTerm";
import ScrollReveal from "@/components/shared/ScrollReveal";
import SpotlightCard from "@/components/shared/SpotlightCard";

const OBJECTIVES = [
  { icon: "🎯", label: "Write stronger AI instructions", color: "#f97316" },
  { icon: "🏗️", label: "Understand enterprise AI architecture", color: "#fb923c" },
  { icon: "⚡", label: "Practice AI-assisted crisis decisions", color: "#f59e0b" },
  { icon: "💰", label: "Prioritize AI portfolio bets", color: "#ea580c" },
];

export default function HomePage() {
  const { state, connected } = useWorkshopState();

  const completedCount = stages.filter((s) => state.currentStage > s.id).length;
  const progressPct = state.currentStage > 0 ? Math.min(100, (completedCount / stages.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <section className="text-center pt-12 pb-4 animate-fade-in-blur">
        <p className="text-xs font-medium text-accent/80 tracking-[0.3em] uppercase mb-4 font-display">
          {state.eventDate} · {state.eventTime}
        </p>
        <h1 className="font-display text-5xl md:text-7xl font-black mb-4 tracking-tight leading-[1.1]">
          <span className="gradient-text">Signify</span>
          <br className="sm:hidden" />
          <span className="text-gray-900"> Supply Chain</span>
          <br />
          <span className="text-gray-700">AI Transformation Workshop</span>
        </h1>
        <p className="text-xs tracking-[0.5em] uppercase text-gray-400 font-display mb-6">
          Supply Chain AI Transformation Workshop
        </p>
        <p className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
          Skip the slide deck—progress through hands-on missions that make the ideas stick.
        </p>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
          {OBJECTIVES.map((obj, i) => (
            <div
              key={i}
              className="card-glass rounded-xl p-3 text-center transition-all duration-300 hover:scale-105 animate-slide-up"
              style={{ animationDelay: `${i * 100 + 200}ms` }}
            >
              <div
                className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg text-xl mb-2"
                style={{ backgroundColor: `${obj.color}12` }}
              >
                {obj.icon}
              </div>
              <p className="text-[11px] text-gray-600 font-medium leading-snug">{obj.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-4 flex-wrap animate-slide-up" style={{ animationDelay: "600ms" }}>
          <Link
            href="/join"
            className="btn-shimmer rounded-xl bg-gradient-to-r from-accent to-amber-500 px-8 py-3.5 font-bold text-white shadow-lg shadow-accent/15 hover:shadow-accent/25 active:scale-[0.975] transition-all hover:scale-105"
          >
            Join a team
          </Link>
          <Link
            href="/warmup"
            className="rounded-xl border border-accent/25 bg-accent/5 px-8 py-3.5 font-bold text-accent hover:bg-accent/10 hover:border-accent/40 active:scale-[0.975] transition-all"
          >
            🧠 Warm-up
          </Link>
          <Link
            href={`/stage/${Math.max(1, state.currentStage)}`}
            className="rounded-xl border border-black/[0.08] bg-black/[0.03] px-8 py-3.5 font-bold text-gray-700 hover:bg-black/[0.06] hover:border-black/[0.12] active:scale-[0.975] transition-all"
          >
            Go to current stage
          </Link>
        </div>
      </section>

      {/* Status bar */}
      <ScrollReveal>
        <div className="flex flex-col items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
              connected
                ? "bg-green-500/10 text-green-600 ring-1 ring-green-500/20"
                : "bg-red-500/10 text-red-500 ring-1 ring-red-500/20"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            />
            {connected ? "Connected" : "Connecting..."}
          </span>

          {state.currentStage > 0 && (
            <div className="w-full max-w-md">
              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
                <span>Workshop progress</span>
                <span className="font-mono">
                  {completedCount}/{stages.length} stages done
                </span>
              </div>
              <div className="h-1 rounded-full bg-black/[0.05] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-amber-500 transition-all duration-700"
                  style={{ width: `${Math.max(progressPct, completedCount > 0 ? progressPct : 5)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Stage cards */}
      <section className="grid gap-4 sm:grid-cols-2">
        {stages.map((s, i) => {
          const isCurrent = state.currentStage === s.id;
          const isCompleted = state.currentStage > s.id;
          const isLocked = state.currentStage > 0 && state.currentStage < s.id;

          const cardContent = (
            <>
              <span className="absolute -right-1 -top-3 text-[72px] md:text-[88px] font-black text-black/[0.025] font-display leading-none select-none pointer-events-none tracking-tighter">
                {String(s.id).padStart(2, "0")}
              </span>

              {isCurrent && (
                <div className="absolute top-3 right-3">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
                  </span>
                </div>
              )}

              <div className="flex items-start gap-4 relative z-[5] pointer-events-none">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-all ${
                    isCurrent
                      ? "bg-accent/12 shadow-md shadow-accent/10"
                      : isCompleted
                        ? "bg-green-500/10"
                        : "bg-black/[0.03]"
                  }`}
                >
                  {isCompleted ? "✅" : s.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider font-display ${
                        isCurrent
                          ? "bg-accent/12 text-accent"
                          : isCompleted
                            ? "bg-green-500/10 text-green-600"
                            : "bg-black/[0.04] text-gray-400"
                      }`}
                    >
                      Stage {s.id}
                    </span>
                    <span className="text-xs text-gray-400">{s.time}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 font-display tracking-tight">
                    {s.title}
                    <span className="text-sm font-normal text-gray-500 ml-2 font-sans">
                      {s.subtitle}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    <AutoTerm text={s.description} />
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                    <span>🎮 {s.gameName}</span>
                    <span>⏱ {s.durationMin} min</span>
                  </div>
                </div>
              </div>

              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl z-[6]">
                  <span className="text-gray-400 text-sm">🔒 Locked</span>
                </div>
              )}
            </>
          );

          const cardClass = `group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
            isCurrent
              ? "card-glass border-gradient glow-accent"
              : isCompleted
                ? "card-glass"
                : isLocked
                  ? "card-glass cursor-not-allowed"
                  : "card-glass hover:scale-[1.01]"
          }`;

          if (isLocked) {
            return (
              <ScrollReveal key={s.id} delay={i * 80} className="h-full">
                <div className={`${cardClass} h-full`}>
                  {cardContent}
                </div>
              </ScrollReveal>
            );
          }

          return (
            <ScrollReveal key={s.id} delay={i * 80} className="h-full">
              <SpotlightCard className={`${cardClass} h-full`}>
                <Link
                  href={`/stage/${s.id}`}
                  className="absolute inset-0 z-[4]"
                  aria-label={`Stage ${s.id}: ${s.title}`}
                />
                {cardContent}
              </SpotlightCard>
            </ScrollReveal>
          );
        })}
      </section>

      <ScrollReveal>
        <footer className="text-center text-xs text-gray-400 py-4 font-display tracking-wider">
          Signify Greater China &middot; Supply Chain AI Transformation Workshop 2026
        </footer>
      </ScrollReveal>
    </div>
  );
}
