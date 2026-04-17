"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import { TEAM_IDS, TEAM_LABELS, TEAM_COLORS, type TeamId } from "@/lib/types";

interface TeamProgress {
  [teamId: string]: {
    game1: boolean;
    game2: boolean;
    game3: boolean;
  };
}

export default function TeamStatusBar({ gameId }: { gameId: number }) {
  const [progress, setProgress] = useState<TeamProgress>({});
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();

    socket.emit(
      "teams:getProgress",
      (p: TeamProgress) => p && setProgress(p),
    );

    const onSubmitted = ({
      teamId,
      gameId: gid,
    }: {
      teamId: string;
      gameId: number;
    }) => {
      if (gid !== gameId) return;
      setProgress((prev) => ({
        ...prev,
        [teamId]: { ...prev[teamId], [`game${gid}`]: true },
      }));
      setFlash(teamId);
      setTimeout(() => setFlash(null), 2000);
    };

    socket.on("team:submitted", onSubmitted);
    return () => {
      socket.off("team:submitted", onSubmitted);
    };
  }, [gameId]);

  const gameKey = `game${gameId}` as "game1" | "game2" | "game3";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">
        Team progress
      </span>
      {TEAM_IDS.map((tid) => {
        const submitted = progress[tid]?.[gameKey];
        const isFlashing = flash === tid;
        return (
          <div
            key={tid}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
              submitted
                ? "bg-green-500/10 text-green-600"
                : "bg-black/[0.03] text-gray-400"
            } ${isFlashing ? "ring-2 ring-green-600/50 scale-110" : ""}`}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: submitted
                  ? "#22c55e"
                  : TEAM_COLORS[tid as TeamId] + "40",
              }}
            />
            <span className="hidden sm:inline">{TEAM_LABELS[tid as TeamId]}</span>
            <span className="sm:hidden">{tid.slice(0, 3).toUpperCase()}</span>
            {submitted && <span className="text-green-600">✓</span>}
          </div>
        );
      })}
    </div>
  );
}
