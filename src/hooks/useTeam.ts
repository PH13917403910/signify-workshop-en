"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket-client";
import type { TeamId } from "@/lib/types";

const STORAGE_KEY = "signify-workshop-team";

export function useTeam() {
  const [team, setTeamState] = useState<TeamId | null>(null);
  const teamRef = useRef<TeamId | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const saved = localStorage.getItem(STORAGE_KEY) as TeamId | null;
    if (saved) {
      setTeamState(saved);
      teamRef.current = saved;
      socket.emit("team:join", saved);
    }

    // Re-join team room after socket reconnection
    const onConnect = () => {
      const t = teamRef.current;
      if (t) socket.emit("team:join", t);
    };
    socket.on("connect", onConnect);

    const onAllReset = () => {
      localStorage.removeItem(STORAGE_KEY);
      setTeamState(null);
      teamRef.current = null;
    };
    socket.on("admin:allReset", onAllReset);

    return () => {
      socket.off("connect", onConnect);
      socket.off("admin:allReset", onAllReset);
    };
  }, []);

  const joinTeam = useCallback((teamId: TeamId) => {
    localStorage.setItem(STORAGE_KEY, teamId);
    setTeamState(teamId);
    teamRef.current = teamId;
    getSocket().emit("team:join", teamId);
  }, []);

  const leaveTeam = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setTeamState(null);
    teamRef.current = null;
  }, []);

  return { team, joinTeam, leaveTeam };
}
