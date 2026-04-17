"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWorkshopState, useAdmin } from "@/hooks/useSocket";
import { stages, pollQuestions } from "@/lib/workshop-data";
import { getSocket } from "@/lib/socket-client";
import { TEAM_LABELS, TEAM_COLORS, type TeamId } from "@/lib/types";

function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="card-glass rounded-2xl p-6 w-full max-w-sm mx-4 border border-red-500/30">
        <h3 className="text-lg font-bold text-red-500 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 bg-black/[0.03] hover:bg-black/[0.04] transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition"
          >
            Confirm reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { state, timer, connected } = useWorkshopState();
  const admin = useAdmin();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [customTimer, setCustomTimer] = useState(15);
  const [teamSubmissions, setTeamSubmissions] = useState<Record<string, Record<string, unknown>>>({});
  const [archiving, setArchiving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    action: () => void;
  } | null>(null);

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

    socket.on("admin:allReset", () => {
      setTeamSubmissions({});
    });

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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Admin sign-in</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Enter admin password"
            className="w-full rounded-lg bg-gray-50 border border-black/[0.06] px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <button
            onClick={handleLogin}
            className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 font-bold text-white hover:bg-accent-light transition"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const currentPoll = pollQuestions.find((p) => p.stageId === state.currentStage);
  const pollState = state.polls[state.currentStage];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-gray-900">Console</h1>
          <Link
            href="/admin/dashboard"
            className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-500/20 transition"
          >
            📋 Dashboard
          </Link>
          <Link
            href="/admin/results"
            className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition"
          >
            🏆 Game results
          </Link>
          <Link
            href="/admin/summary"
            className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-500/20 transition"
          >
            📊 Poll summary
          </Link>
          <Link
            href="/presenter"
            target="_blank"
            className="rounded-lg bg-slate-500/10 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-500/20 transition"
          >
            📺 Presenter view
          </Link>
          <Link
            href="/admin/history"
            className="rounded-lg bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-500/20 transition"
          >
            🗄 History
          </Link>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${connected ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-green-500" : "bg-red-400"}`} />
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* Event Info */}
      <div className="card-glass rounded-2xl p-5 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Event</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Date</label>
          <input
            type="text"
            value={state.eventDate}
            onChange={(e) => admin.setEventInfo(e.target.value, state.eventTime)}
            className="w-32 rounded-lg bg-gray-50 border border-black/[0.06] px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Time</label>
          <input
            type="text"
            value={state.eventTime}
            onChange={(e) => admin.setEventInfo(state.eventDate, e.target.value)}
            className="w-40 rounded-lg bg-gray-50 border border-black/[0.06] px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <span className="text-xs text-gray-400">
          Home shows: {state.eventDate} · {state.eventTime}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stage Control */}
        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Stages</h2>
          <div className="space-y-2">
            <button
              onClick={() => admin.setStage(0)}
              className={`w-full text-left rounded-lg px-4 py-3 text-sm font-medium border transition ${state.currentStage === 0 ? "bg-accent/20 text-accent ring-1 ring-accent/40 border-accent/20" : "text-gray-500 border-black/[0.04] hover:bg-black/[0.04] hover:border-black/[0.06]"}`}
            >
              🏠 Lobby (not started)
            </button>
            {stages.map((s) => (
              <button
                key={s.id}
                onClick={() => admin.setStage(s.id)}
                className={`w-full text-left rounded-lg px-4 py-3 text-sm font-medium border transition ${state.currentStage === s.id ? "bg-accent/20 text-accent ring-1 ring-accent/40 border-accent/20" : "text-gray-500 border-black/[0.04] hover:bg-black/[0.04] hover:border-black/[0.06]"}`}
              >
                <div className="flex items-center justify-between">
                  <span>{s.icon} Stage {s.id}: {s.title}</span>
                  <span className="text-[11px] font-mono text-gray-400 shrink-0 ml-2">{s.durationMin}min (game {s.gameDurationMin}min)</span>
                </div>
              </button>
            ))}
            <button
              onClick={() => admin.setStage(5)}
              className={`w-full text-left rounded-lg px-4 py-3 text-sm font-medium border transition ${state.currentStage === 5 ? "bg-amber-500/20 text-amber-600 ring-1 ring-amber-400/40 border-amber-400/20" : "text-gray-500 border-black/[0.04] hover:bg-black/[0.04] hover:border-black/[0.06]"}`}
            >
              🎓 Wrap-up (send participants to completion page)
            </button>
          </div>

          {/* Facilitator opening script for current stage */}
          {state.currentStage >= 1 && state.currentStage <= 4 && (() => {
            const cur = stages.find((s) => s.id === state.currentStage);
            if (!cur?.openingScript) return null;
            return (
              <details className="mt-4 pt-4 border-t border-black/[0.04]">
                <summary className="cursor-pointer text-xs font-bold text-accent/70 uppercase tracking-wider hover:text-accent transition select-none">
                  🎤 Stage {cur.id} opening (tap to expand)
                </summary>
                <div className="mt-3 rounded-xl bg-accent/5 border border-accent/10 p-4">
                  <p className="text-sm text-gray-600 leading-relaxed italic">
                    &ldquo;{cur.openingScript}&rdquo;
                  </p>
                </div>
              </details>
            );
          })()}

          {state.currentStage === 4 && (
            <div className="mt-4 pt-4 border-t border-black/[0.04]">
              <p className="text-xs text-gray-400 mb-2">Game 4 voting</p>
              <div className="flex gap-2">
                {!state.game4.open ? (
                  <button onClick={admin.openGame4} className="flex-1 rounded-lg bg-accent/20 px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent/30 transition">
                    Open voting
                  </button>
                ) : (
                  <button onClick={admin.closeGame4} className="flex-1 rounded-lg bg-red-500/20 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/30 transition">
                    Close voting
                  </button>
                )}
                <button onClick={admin.showGame4Results} className="flex-1 rounded-lg bg-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-500/30 transition">
                  Show results
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Timer Control */}
        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Timer</h2>

          <div className="text-center mb-4">
            <p className="font-mono text-5xl font-black text-gray-900 tabular-nums">
              {String(Math.floor(timer.remaining / 60)).padStart(2, "0")}:
              {String(timer.remaining % 60).padStart(2, "0")}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {timer.running ? "Running" : timer.remaining > 0 ? "Paused" : "Idle"}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="number"
              min={1}
              max={60}
              value={customTimer}
              onChange={(e) => setCustomTimer(Number(e.target.value))}
              className="w-20 rounded-lg bg-gray-50 border border-black/[0.06] px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <span className="text-sm text-gray-400">min</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => admin.startTimer(customTimer * 60)} className="rounded-lg bg-green-500/20 px-4 py-2.5 text-sm font-medium text-green-600 hover:bg-green-500/30 transition">
              ▶ Start
            </button>
            <button onClick={admin.pauseTimer} className="rounded-lg bg-yellow-500/20 px-4 py-2.5 text-sm font-medium text-yellow-600 hover:bg-yellow-500/30 transition">
              ⏸ Pause
            </button>
            <button onClick={admin.resumeTimer} className="rounded-lg bg-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-500/30 transition">
              ▶ Resume
            </button>
            <button onClick={() => admin.resetTimer(0)} className="rounded-lg bg-red-500/20 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/30 transition">
              ⏹ Reset
            </button>
          </div>

          {/* Quick presets */}
          <div className="mt-3 flex gap-2">
            {[5, 10, 15, 25, 35].map((m) => (
              <button
                key={m}
                onClick={() => admin.startTimer(m * 60)}
                className="flex-1 rounded-lg bg-black/[0.03] px-2 py-2 text-sm text-gray-500 hover:bg-black/[0.04] hover:text-gray-700 transition"
              >
                {m}min
              </button>
            ))}
          </div>
        </div>

        {/* Poll Control */}
        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Polls</h2>

          {[1, 2, 3, 4].map((pid) => {
            const poll = state.polls[pid];
            if (!poll) return null;
            const pq = pollQuestions.find((p) => p.stageId === pid);
            const totalVotes = Object.values(poll.votes).reduce(
              (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
              0
            );

            return (
              <div key={pid} className="mb-4 last:mb-0 rounded-lg bg-gray-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500">Poll {pid}</span>
                  <span className={`text-xs ${poll.open ? "text-green-600" : "text-gray-400"}`}>
                    {poll.open ? "Open" : "Closed"} · {totalVotes} votes
                  </span>
                </div>

                {/* Result bars */}
                {poll.showResults && pq && (
                  <div className="space-y-1 mb-2">
                    {pq.options.map((opt) => {
                      const count = Array.isArray(poll.votes[opt.id]) ? poll.votes[opt.id].length : 0;
                      const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                      return (
                        <div key={opt.id} className="flex items-center gap-2">
                          <span className="w-4 text-xs text-gray-400">{opt.id}</span>
                          <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 text-xs text-gray-500 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-1.5">
                  {!poll.open ? (
                    <button onClick={() => admin.openPoll(pid)} className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-green-500/20 text-green-600 hover:bg-green-500/30 transition">
                      Open
                    </button>
                  ) : (
                    <button onClick={() => admin.closePoll(pid)} className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-red-500/20 text-red-500 hover:bg-red-500/30 transition">
                      Close
                    </button>
                  )}
                  {!poll.showResults ? (
                    <button onClick={() => admin.showPollResults(pid)} className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 transition">
                      Show
                    </button>
                  ) : (
                    <button onClick={() => admin.hidePollResults(pid)} className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-gray-500/20 text-gray-500 hover:bg-gray-500/30 transition">
                      Hide
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Director Console */}
      <div className="card-glass rounded-2xl p-6 border border-indigo-500/10">
        <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4">
          Director console
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => admin.sendCommand({ type: "navigate", route: "/warmup", label: "Go to warm-up" })}
            className="rounded-lg bg-amber-500/15 border border-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-300 hover:bg-amber-500/25 hover:text-amber-200 transition"
          >
            🧠 Navigate to warm-up
          </button>
          {state.currentStage >= 1 && state.currentStage <= 4 && (
              <>
                <button
                  onClick={() => admin.sendCommand({ type: "navigate", route: `/stage/${state.currentStage}`, label: `Enter Stage ${state.currentStage}` })}
                  className="rounded-lg bg-indigo-500/15 border border-indigo-500/20 px-4 py-2.5 text-sm font-medium text-indigo-300 hover:bg-indigo-500/25 hover:text-indigo-200 transition"
                >
                  📍 Navigate to stage
                </button>
                <button
                  onClick={() => admin.sendCommand({ type: "playVideo", stageId: state.currentStage })}
                  className="rounded-lg bg-indigo-500/15 border border-indigo-500/20 px-4 py-2.5 text-sm font-medium text-indigo-300 hover:bg-indigo-500/25 hover:text-indigo-200 transition"
                >
                  ▶ Play video
                </button>
                <button
                  onClick={() => admin.sendCommand({ type: "stopVideo" })}
                  className="rounded-lg bg-indigo-500/15 border border-indigo-500/20 px-4 py-2.5 text-sm font-medium text-indigo-300 hover:bg-indigo-500/25 hover:text-indigo-200 transition"
                >
                  ⏹ Stop video
                </button>
                <button
                  onClick={() => admin.sendCommand({ type: "navigate", route: `/stage/${state.currentStage}/game`, label: `Enter Stage ${state.currentStage} game` })}
                  className="rounded-lg bg-indigo-500/15 border border-indigo-500/20 px-4 py-2.5 text-sm font-medium text-indigo-300 hover:bg-indigo-500/25 hover:text-indigo-200 transition"
                >
                  🎮 Navigate to game
                </button>
                <button
                  onClick={() => {
                    admin.openPoll(state.currentStage);
                    setTimeout(() => admin.sendCommand({ type: "navigate", route: `/stage/${state.currentStage}/poll`, label: `Enter Stage ${state.currentStage} poll` }), 300);
                  }}
                  className="rounded-lg bg-indigo-500/15 border border-indigo-500/20 px-4 py-2.5 text-sm font-medium text-indigo-300 hover:bg-indigo-500/25 hover:text-indigo-200 transition"
                >
                  📊 Start poll
                </button>
              </>
            )}
            {state.currentStage >= 5 && (
              <button
                onClick={() => admin.sendCommand({ type: "navigate", route: "/finish", label: "Go to completion page" })}
                className="rounded-lg bg-amber-500/15 border border-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-300 hover:bg-amber-500/25 hover:text-amber-200 transition"
              >
                🎓 Navigate to completion
              </button>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-3">
            Director commands broadcast to every participant device
          </p>
        </div>

      {/* Team Monitor */}
      <div className="card-glass rounded-2xl p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Team monitor</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(state.teams).map(([id, team]) => {
            const subs = teamSubmissions[id] || {};
            const names = team.memberNames || [];
            const color = TEAM_COLORS[id as TeamId] || "#888";
            return (
              <div key={id} className="rounded-xl p-4" style={{ backgroundColor: `${color}08`, border: `1px solid ${color}15` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-bold text-gray-900">{TEAM_LABELS[id as TeamId] || id}</span>
                  </div>
                  <span className="text-xs font-mono" style={{ color }}>{names.length}</span>
                </div>
                {names.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {names.map((n, i) => (
                      <span key={n} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-gray-600" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}20` }}>
                        <span className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: color }}>
                          {n.charAt(0).toUpperCase()}
                        </span>
                        {n}
                        {i === 0 && <span className="text-yellow-600 text-[8px] ml-0.5">★</span>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 mb-3">Not checked in</p>
                )}
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((g) => {
                    const key = `game${g}`;
                    const submitted = (subs[key] as Record<string, unknown>)?.submitted;
                    return (
                      <div key={g} className={`flex-1 rounded-lg py-1 text-center text-[11px] font-medium ${submitted ? "bg-green-500/15 text-green-600" : "bg-black/[0.03] text-gray-400"}`}>
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

      {/* Archive Workshop */}
      <div className="card-glass rounded-2xl p-4 border border-purple-500/10 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-purple-400 uppercase tracking-wider">
            Archive this workshop
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Save current data to history and start a fresh workshop (connections stay online)
          </p>
        </div>
        <button
          onClick={() =>
            setConfirmDialog({
              title: "Archive and start new workshop",
              message: "All data from this session (participants, polls, game submissions) will be saved to history. A new blank workshop will be created next.",
              action: () => {
                setArchiving(true);
                const socket = getSocket();
                socket.emit("admin:completeWorkshop", (res: { success: boolean }) => {
                  setArchiving(false);
                  if (res?.success) {
                    admin.resetAll();
                  }
                });
              },
            })
          }
          disabled={archiving}
          className="shrink-0 rounded-xl bg-purple-500/15 border border-purple-500/20 px-5 py-2.5 text-sm font-bold text-purple-400 hover:bg-purple-500/25 transition disabled:opacity-50"
        >
          {archiving ? "Archiving..." : "🗄 End & archive"}
        </button>
      </div>

      {/* Reset Controls */}
      <div className="card-glass rounded-2xl p-6 border border-red-500/10">
        <h2 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-4">
          Data reset
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {stages.map((s) => (
            <button
              key={s.id}
              onClick={() =>
                setConfirmDialog({
                  title: `Reset Stage ${s.id}`,
                  message: `Clears all game submissions and poll data for “${s.title}” and stops the timer. This cannot be undone.`,
                  action: () => admin.resetStage(s.id),
                })
              }
              className="rounded-xl bg-gray-50 border border-black/[0.04] px-4 py-3 text-left hover:border-red-500/30 hover:bg-red-500/5 transition group"
            >
              <p className="text-sm font-bold text-gray-600 group-hover:text-red-500 transition">
                {s.icon} Stage {s.id}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{s.title}</p>
            </button>
          ))}
          <button
            onClick={() =>
              setConfirmDialog({
                title: "Reset all data",
                message:
                  "Clears submissions and polls for all 4 stages, returns to lobby, stops timer. Cannot be undone.",
                action: admin.resetAll,
              })
            }
            className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-left hover:bg-red-500/20 transition"
          >
            <p className="text-sm font-bold text-red-500">
              ⚠ Reset everything
            </p>
            <p className="text-xs text-red-500/60 mt-0.5">Clear all data</p>
          </button>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog !== null}
        title={confirmDialog?.title ?? ""}
        message={confirmDialog?.message ?? ""}
        onConfirm={() => {
          confirmDialog?.action();
          setConfirmDialog(null);
        }}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}
