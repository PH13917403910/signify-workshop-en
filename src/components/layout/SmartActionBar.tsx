"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkshopState } from "@/hooks/useSocket";
import { stages } from "@/lib/workshop-data";
import { TEAM_LABELS, type TeamId } from "@/lib/types";

const STORAGE_KEY = "signify-workshop-team";

function getTeamFromStorage(): TeamId | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY) as TeamId | null;
}

export default function SmartActionBar() {
  const pathname = usePathname();
  const { state } = useWorkshopState();
  const [team, setTeam] = useState<TeamId | null>(null);
  const [stageToast, setStageToast] = useState<string | null>(null);
  const prevStageRef = useRef(state.currentStage);

  useEffect(() => {
    setTeam(getTeamFromStorage());
    const handler = () => setTeam(getTeamFromStorage());
    window.addEventListener("storage", handler);
    const interval = setInterval(() => setTeam(getTeamFromStorage()), 2000);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (
      prevStageRef.current !== 0 &&
      state.currentStage !== prevStageRef.current &&
      state.currentStage > 0
    ) {
      const s = stages.find((st) => st.id === state.currentStage);
      if (s) {
        setStageToast(`Now on Stage ${s.id}: ${s.title}`);
        setTimeout(() => setStageToast(null), 4000);
      }
    }
    prevStageRef.current = state.currentStage;
  }, [state.currentStage]);

  const hidden =
    pathname.startsWith("/admin") ||
    pathname === "/access" ||
    pathname === "/finish";
  if (hidden) return null;

  const currentStage = state.currentStage;
  const stageMatch = pathname.match(/^\/stage\/(\d+)/);
  const viewingStageId = stageMatch ? Number(stageMatch[1]) : null;
  const isGamePage = pathname.endsWith("/game");
  const isPollPage = pathname.endsWith("/poll");
  const isHome = pathname === "/";
  const isJoin = pathname === "/join";

  let action: { label: string; href: string } | null = null;

  if (!team && !isJoin) {
    action = { label: "Join team", href: "/join" };
  } else if (isHome && currentStage > 4) {
    action = { label: "Finish workshop 🎓", href: "/finish" };
  } else if (isHome && currentStage > 0) {
    action = {
      label: currentStage <= 4 ? `Go to Stage ${currentStage}` : "Finish workshop 🎓",
      href: currentStage <= 4 ? `/stage/${currentStage}` : "/finish",
    };
  } else if (viewingStageId && !isGamePage && !isPollPage) {
    action = { label: "Enter game →", href: `/stage/${viewingStageId}/game` };
  } else if (isGamePage && viewingStageId) {
    if (viewingStageId >= 4 && currentStage > 4) {
      action = { label: "Finish workshop 🎓", href: "/finish" };
    } else if (viewingStageId < 4 && currentStage > viewingStageId) {
      action = {
        label: `Next: Stage ${viewingStageId + 1} →`,
        href: `/stage/${viewingStageId + 1}`,
      };
    } else {
      action = { label: "Back to stage", href: `/stage/${viewingStageId}` };
    }
  } else if (isPollPage && viewingStageId) {
    action = { label: "Back to stage", href: `/stage/${viewingStageId}` };
  } else if (viewingStageId && !isGamePage && !isPollPage && currentStage > 4) {
    action = { label: "Finish workshop 🎓", href: "/finish" };
  }

  return (
    <>
      <AnimatePresence>
        {stageToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100]"
            role="status"
            aria-live="polite"
          >
            <div className="rounded-2xl bg-accent px-6 py-3 shadow-lg shadow-accent/20">
              <p className="text-sm font-bold text-white font-display">{stageToast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 inset-x-0 z-[80]" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="mx-auto max-w-7xl px-4 pb-3">
          <div
            className="rounded-2xl bg-white/80 backdrop-blur-2xl border border-black/[0.06] shadow-lg px-4 py-3 flex items-center justify-between gap-3"
            style={{ WebkitBackdropFilter: "blur(40px) saturate(1.4)" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="flex gap-1 shrink-0"
                role="progressbar"
                aria-valuenow={currentStage}
                aria-valuemin={0}
                aria-valuemax={stages.length}
                aria-label={`Workshop progress: Stage ${currentStage} of ${stages.length}`}
              >
                {stages.map((s) => (
                  <div
                    key={s.id}
                    className={`h-2 w-2 rounded-full transition-all ${
                      currentStage > s.id
                        ? "bg-green-500"
                        : currentStage === s.id
                          ? "bg-accent ring-1 ring-accent/40"
                          : "bg-black/10"
                    }`}
                  />
                ))}
              </div>
              {currentStage > 0 && (
                <span className="text-[11px] text-gray-500 truncate hidden sm:block">
                  Stage {currentStage}
                </span>
              )}
            </div>

            {team && (
              <span className="text-[11px] rounded-full bg-black/[0.04] px-2.5 py-1 text-gray-500 font-medium truncate">
                {TEAM_LABELS[team]}
              </span>
            )}

            {action && (
              <Link
                href={action.href}
                className={`shrink-0 rounded-xl font-bold text-white active:scale-[0.975] transition-all ${
                  action.href === "/finish"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-2.5 text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-105 animate-pulse-gentle"
                    : "bg-gradient-to-r from-accent to-amber-500 px-5 py-2.5 text-sm shadow-md shadow-accent/15 hover:shadow-accent/25 hover:scale-105"
                }`}
              >
                {action.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
