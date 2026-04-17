"use client";

import { useState, useMemo } from "react";
import { useTeam } from "@/hooks/useTeam";
import { useWorkshopState } from "@/hooks/useSocket";
import { TEAM_COLORS, type TeamId } from "@/lib/types";

export default function RotationHint({ gameId }: { gameId: number }) {
  const { team } = useTeam();
  const { state } = useWorkshopState();
  const [dismissed, setDismissed] = useState(false);

  const memberNames = team ? state.teams[team]?.memberNames || [] : [];
  const teamColor = team ? TEAM_COLORS[team as TeamId] : "#f97316";

  const suggestedMember = useMemo(() => {
    if (memberNames.length === 0) return null;
    const idx = (gameId - 1) % memberNames.length;
    return memberNames[idx];
  }, [memberNames, gameId]);

  if (!suggestedMember || dismissed) return null;

  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-2.5 animate-slide-up"
      style={{ backgroundColor: `${teamColor}10`, border: `1px solid ${teamColor}20` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: teamColor }}
        >
          {suggestedMember.charAt(0).toUpperCase()}
        </span>
        <p className="text-sm">
          <span className="text-gray-500">This round, </span>
          <span className="font-bold" style={{ color: teamColor }}>{suggestedMember}</span>
          <span className="text-gray-500"> drives the keyboard</span>
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-xs text-gray-400 hover:text-gray-500 transition shrink-0 ml-2"
      >
        Collapse
      </button>
    </div>
  );
}
