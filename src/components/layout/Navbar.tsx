"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkshopState } from "@/hooks/useSocket";
import { useTeam } from "@/hooks/useTeam";
import Timer from "./Timer";
import { stages } from "@/lib/workshop-data";
import { TEAM_LABELS, TEAM_COLORS, type TeamId } from "@/lib/types";

function LogoMark() {
  return (
    <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-amber-500 shadow-sm">
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { state, timer } = useWorkshopState();
  const { team } = useTeam();
  const isAdmin = pathname.startsWith("/admin");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50">
      <div
        className="bg-white/70 backdrop-blur-2xl border-b border-black/[0.06]"
        style={{ WebkitBackdropFilter: "blur(40px) saturate(1.5)" }}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-gray-900 group">
              <LogoMark />
              <span className="hidden sm:inline font-display text-sm tracking-tight group-hover:text-accent transition-colors">
                Signify AI Workshop
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1 ml-4">
              {stages.map((s) => {
                const active = state.currentStage === s.id;
                const completed = state.currentStage > s.id;
                return (
                  <Link
                    key={s.id}
                    href={`/stage/${s.id}`}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
                      active
                        ? "bg-accent/10 text-accent ring-1 ring-accent/20"
                        : completed
                          ? "bg-green-500/10 text-green-600"
                          : "text-gray-400 hover:text-gray-600 hover:bg-black/[0.03]"
                    }`}
                  >
                    <span>{completed ? "✓" : s.id}</span>
                    <span className="hidden lg:inline">{s.title}</span>
                  </Link>
                );
              })}
            </div>

            <button
              className="flex md:hidden items-center gap-1.5 ml-2 min-h-[44px] min-w-[44px] justify-center"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Expand stage navigation"
            >
              {stages.map((s) => (
                <div
                  key={s.id}
                  className={`h-2 w-2 rounded-full transition-all ${
                    state.currentStage === s.id
                      ? "bg-accent scale-125"
                      : state.currentStage > s.id
                        ? "bg-green-500"
                        : "bg-black/10"
                  }`}
                />
              ))}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Timer timer={timer} />

            {team && (() => {
              const color = TEAM_COLORS[team as TeamId];
              const names = state.teams[team]?.memberNames || [];
              return (
                <Link
                  href="/join"
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 hover:opacity-80 transition-all duration-200"
                  style={{
                    backgroundColor: `${color}12`,
                    border: `1px solid ${color}25`,
                  }}
                  title="Tap to manage team"
                >
                  <span className="text-[11px] sm:text-xs font-semibold" style={{ color }}>
                    {TEAM_LABELS[team as TeamId]}
                  </span>
                  {names.length > 0 && (
                    <span className="text-[11px] font-mono" style={{ color: `${color}90` }}>
                      {names.length}
                    </span>
                  )}
                </Link>
              );
            })()}

            {!isAdmin && (
              <Link
                href="/admin"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-b border-black/[0.06] bg-white/95 backdrop-blur-2xl px-4 py-3 space-y-1">
          {stages.map((s) => {
            const active = state.currentStage === s.id;
            const completed = state.currentStage > s.id;
            return (
              <Link
                key={s.id}
                href={`/stage/${s.id}`}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  active
                    ? "bg-accent/8 text-accent"
                    : completed
                      ? "text-green-600"
                      : "text-gray-500 hover:text-gray-700 hover:bg-black/[0.03]"
                }`}
              >
                <span className="text-lg">{completed ? "✅" : s.icon}</span>
                <span>
                  Stage {s.id} · {s.title}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
