"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAdmin, useWorkshopState } from "@/hooks/useSocket";
import { getSocket } from "@/lib/socket-client";
import { stages, pollQuestions, sharkProjects } from "@/lib/workshop-data";
import { TEAM_IDS, TEAM_LABELS, TEAM_COLORS, type TeamId } from "@/lib/types";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function DashboardPage() {
  const { state, timer, connected } = useWorkshopState();
  const admin = useAdmin();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [teamSubmissions, setTeamSubmissions] = useState<Record<string, Record<string, unknown>>>({});

  useEffect(() => {
    const socket = getSocket();

    // Fetch existing submissions on mount
    socket.emit("admin:getFullState", (fullState: Record<string, unknown> | null) => {
      if (!fullState) return;
      const teams = fullState.teams as Record<string, Record<string, unknown>> | undefined;
      if (!teams) return;
      const subs: Record<string, Record<string, unknown>> = {};
      for (const [tid, team] of Object.entries(teams)) {
        subs[tid] = {};
        if (team.game1) subs[tid].game1 = team.game1;
        if (team.game2) subs[tid].game2 = team.game2;
        if (team.game3) subs[tid].game3 = team.game3;
      }
      setTeamSubmissions(subs);
    });

    const handlers = ["game1:update", "game2:update", "game3:update"];
    handlers.forEach((evt) => {
      socket.on(evt, ({ teamId, data }: { teamId: string; data: unknown }) => {
        setTeamSubmissions((prev) => ({
          ...prev,
          [teamId]: { ...prev[teamId], [evt.split(":")[0]]: data },
        }));
      });
    });
    socket.on("admin:stageReset", (stageId: number) => {
      const gameKey = `game${stageId}`;
      setTeamSubmissions((prev) => {
        const next = { ...prev };
        for (const tid of Object.keys(next)) {
          next[tid] = { ...next[tid] };
          delete next[tid][gameKey];
        }
        return next;
      });
    });
    socket.on("admin:allReset", () => setTeamSubmissions({}));
    return () => {
      handlers.forEach((evt) => socket.off(evt));
      socket.off("admin:stageReset");
      socket.off("admin:allReset");
    };
  }, []);

  const handleLogin = async () => {
    const ok = await admin.login(password);
    if (!ok) setError("Wrong password");
  };

  if (!admin.authed) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="card-glass rounded-2xl p-8 w-full max-w-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4 font-display">Admin sign-in</h2>
          <input type="password" value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Enter admin password"
            className="w-full rounded-lg bg-gray-50 border border-black/[0.06] px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent" />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <button onClick={handleLogin} className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 font-bold text-white hover:bg-accent-light transition">Sign in</button>
        </div>
      </div>
    );
  }

  const totalMembers = TEAM_IDS.reduce((acc, tid) => acc + (state.teams[tid]?.memberNames?.length || 0), 0);
  const activeTeams = TEAM_IDS.filter((tid) => (state.teams[tid]?.memberNames?.length || 0) > 0);
  const completedStages = stages.filter((s) => state.currentStage > s.id).length;
  const progressPct = Math.round((completedStages / stages.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition text-sm">← Console</Link>
          <h1 className="text-2xl font-black text-gray-900 font-display">Workshop dashboard</h1>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${connected ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-green-500" : "bg-red-400"}`} />
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-glass rounded-2xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Current stage</p>
          <p className="text-3xl font-black text-gray-900 font-display">
            {state.currentStage === 0 ? "Lobby" : `Stage ${state.currentStage}`}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {state.currentStage === 0 ? "Not started" : stages.find((s) => s.id === state.currentStage)?.title || "Ended"}
          </p>
        </div>
        <div className="card-glass rounded-2xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Participants</p>
          <p className="text-3xl font-black text-gray-900 font-display">{totalMembers}</p>
          <p className="text-sm text-gray-500 mt-1">{activeTeams.length} teams checked in</p>
        </div>
        <div className="card-glass rounded-2xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Overall progress</p>
          <p className="text-3xl font-black text-gray-900 font-display">{progressPct}%</p>
          <div className="mt-2 h-1.5 rounded-full bg-black/[0.03] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-cyber transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className="card-glass rounded-2xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Timer</p>
          <p className={`text-3xl font-black font-display tabular-nums ${timer.remaining <= 60 && timer.remaining > 0 ? "text-red-500" : "text-gray-900"}`}>
            {timer.total > 0 ? formatTime(timer.remaining) : "--:--"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {timer.running ? "Running" : timer.remaining > 0 ? "Paused" : "Idle"}
          </p>
        </div>
      </div>

      {/* Team Roster — Full Detail */}
      <div className="card-glass rounded-2xl p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 font-display">Team roster</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TEAM_IDS.map((tid) => {
            const team = state.teams[tid];
            const names = team?.memberNames || [];
            const color = TEAM_COLORS[tid];
            const subs = teamSubmissions[tid] || {};

            return (
              <div key={tid} className="rounded-xl p-4" style={{ backgroundColor: `${color}08`, border: `1px solid ${color}15` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-bold text-gray-900 font-display">{TEAM_LABELS[tid]}</span>
                  </div>
                  <span className="text-xs font-mono" style={{ color }}>{names.length}</span>
                </div>

                {names.length > 0 ? (
                  <div className="space-y-1.5 mb-3">
                    {names.map((name, i) => (
                      <div key={name} className="flex items-center gap-2">
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {name.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">{name}</span>
                        {i === 0 && (
                          <span className="rounded px-1 py-0.5 text-[8px] font-bold bg-yellow-500/20 text-yellow-600">Lead</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mb-3">Not checked in</p>
                )}

                {/* Game completion */}
                <div className="flex gap-2">
                  {[1, 2, 3].map((g) => {
                    const submitted = (subs[`game${g}`] as Record<string, unknown>)?.submitted;
                    return (
                      <div
                        key={g}
                        className={`flex-1 rounded-lg py-1 text-center text-[11px] font-medium ${
                          submitted
                            ? "bg-green-500/15 text-green-600"
                            : "bg-black/[0.03] text-gray-400"
                        }`}
                      >
                        G{g} {submitted ? "✓" : "—"}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Progress Timeline */}
      <div className="card-glass rounded-2xl p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 font-display">Stage progress</h2>
        <div className="space-y-3">
          {stages.map((s) => {
            const isCurrent = state.currentStage === s.id;
            const isCompleted = state.currentStage > s.id;
            const isPending = state.currentStage < s.id;

            const poll = state.polls[s.id];
            const pq = pollQuestions.find((p) => p.stageId === s.id);
            const totalVotes = poll ? Object.values(poll.votes).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0) : 0;

            const teamsSubmitted = TEAM_IDS.filter((tid) => {
              const sub = teamSubmissions[tid]?.[`game${s.id}`] as Record<string, unknown> | undefined;
              return sub?.submitted;
            }).length;

            return (
              <div
                key={s.id}
                className={`rounded-xl p-4 flex items-start gap-4 transition-all ${
                  isCurrent
                    ? "bg-accent/10 border border-accent/20"
                    : isCompleted
                      ? "bg-green-500/5 border border-green-500/10"
                      : "bg-black/[0.02] border border-black/[0.04]"
                }`}
              >
                {/* Status indicator */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                  isCurrent ? "bg-accent/20" : isCompleted ? "bg-green-500/15" : "bg-black/[0.03]"
                }`}>
                  {isCompleted ? "✅" : s.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider font-display ${
                      isCurrent ? "text-accent" : isCompleted ? "text-green-600" : "text-gray-400"
                    }`}>
                      Stage {s.id}
                    </span>
                    <span className="text-xs text-gray-400">{s.durationMin} min</span>
                    {isCurrent && (
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-bold text-accent animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>
                  <p className={`text-sm font-bold ${isPending ? "text-gray-400" : "text-gray-900"} font-display`}>
                    {s.title} <span className="font-normal text-gray-400 text-xs ml-1">{s.gameName}</span>
                  </p>

                  {/* Sub-stats */}
                  {!isPending && (
                    <div className="flex gap-4 mt-2 text-[11px]">
                      <span className={teamsSubmitted > 0 ? "text-green-600" : "text-gray-400"}>
                        🎮 {teamsSubmitted}/{activeTeams.length || TEAM_IDS.length} teams done
                      </span>
                      <span className={totalVotes > 0 ? "text-amber-600" : "text-gray-400"}>
                        📊 {totalVotes} votes {poll?.open ? "(open)" : poll?.showResults ? "(shown)" : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right status */}
                <div className="shrink-0 text-right">
                  <span className={`text-xs font-medium ${
                    isCurrent ? "text-accent" : isCompleted ? "text-green-600" : "text-gray-400"
                  }`}>
                    {isCurrent ? "In progress" : isCompleted ? "Done" : "Pending"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Poll Summary */}
      <div className="card-glass rounded-2xl p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 font-display">Poll overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((pid) => {
            const poll = state.polls[pid];
            const pq = pollQuestions.find((p) => p.stageId === pid);
            if (!poll || !pq) return null;

            const totalVotes = Object.values(poll.votes).reduce(
              (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0
            );

            const topOption = pq.options.reduce((best, opt) => {
              const count = Array.isArray(poll.votes[opt.id]) ? poll.votes[opt.id].length : 0;
              return count > best.count ? { id: opt.id, label: opt.label, count } : best;
            }, { id: "", label: "—", count: 0 });

            return (
              <div key={pid} className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 font-display">Poll {pid}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    poll.open ? "bg-green-500/15 text-green-600" : totalVotes > 0 ? "bg-gray-500/15 text-gray-500" : "bg-black/[0.03] text-gray-400"
                  }`}>
                    {poll.open ? "Open" : totalVotes > 0 ? "Closed" : "Not started"}
                  </span>
                </div>
                <p className="text-2xl font-black text-gray-900 font-display">{totalVotes}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Total votes</p>
                {totalVotes > 0 && (
                  <p className="text-xs text-amber-600 mt-2 truncate">
                    Leading: {topOption.id} ({topOption.count} votes)
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
