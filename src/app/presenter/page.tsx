"use client";

import { useEffect, useState } from "react";
import { useWorkshopState } from "@/hooks/useSocket";
import { getSocket } from "@/lib/socket-client";
import { stages, pollQuestions, sharkProjects, facilitatorTimeline } from "@/lib/workshop-data";
import { TEAM_IDS, TEAM_LABELS, TEAM_COLORS, type TeamId } from "@/lib/types";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface TeamProgress {
  [teamId: string]: {
    game1: boolean;
    game2: boolean;
    game3: boolean;
  };
}

const ACTION_ICONS: Record<string, string> = {
  video: "🎬",
  script: "🎤",
  game: "🎮",
  debrief: "💬",
  poll: "📊",
  break: "☕",
};

export default function PresenterPage() {
  const { state, timer } = useWorkshopState();
  const [progress, setProgress] = useState<TeamProgress>({});
  const [game4Totals, setGame4Totals] = useState<Record<string, number>>({});
  const [doneSteps, setDoneSteps] = useState<Set<string>>(new Set());

  function toggleStep(key: string) {
    setDoneSteps((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  useEffect(() => {
    const socket = getSocket();
    socket.emit(
      "teams:getProgress",
      (p: TeamProgress) => p && setProgress(p),
    );
    const onSubmitted = ({ teamId, gameId }: { teamId: string; gameId: number }) => {
      setProgress((prev) => ({
        ...prev,
        [teamId]: { ...prev[teamId], [`game${gameId}`]: true },
      }));
    };
    const onTotals = (t: Record<string, number>) => setGame4Totals(t);
    socket.on("team:submitted", onSubmitted);
    socket.on("game4:totals", onTotals);
    socket.emit("game4:getTotals", (t: Record<string, number>) => {
      if (t) setGame4Totals(t);
    });
    return () => {
      socket.off("team:submitted", onSubmitted);
      socket.off("game4:totals", onTotals);
    };
  }, []);

  const currentStage = state.currentStage;
  const stage = stages.find((s) => s.id === currentStage);
  const active = timer.total > 0 && timer.remaining > 0;
  const urgent = timer.remaining <= 60 && timer.remaining > 0;
  const pct = timer.total > 0 ? (timer.remaining / timer.total) * 100 : 0;

  const currentPoll = state.polls[currentStage];
  const currentPollQ = pollQuestions.find((p) => p.stageId === currentStage);

  const gameKey =
    currentStage <= 3
      ? (`game${currentStage}` as "game1" | "game2" | "game3")
      : null;

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Signify AI Workshop · Presenter View
          </p>
          {stage ? (
            <h1 className="text-3xl font-black text-gray-900">
              Stage {stage.id}: {stage.title}
            </h1>
          ) : (
            <h1 className="text-3xl font-black text-gray-400">Waiting to start...</h1>
          )}
        </div>
        <div className="flex gap-2">
          {stages.map((s) => (
            <div
              key={s.id}
              className={`h-4 w-4 rounded-full transition-all ${
                currentStage > s.id
                  ? "bg-green-500"
                  : currentStage === s.id
                    ? "bg-accent ring-2 ring-accent/40 scale-125"
                    : "bg-black/10"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card-glass rounded-3xl p-8">
          {active || timer.remaining === 0 ? (
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2 uppercase tracking-wider">
                {timer.running ? "Countdown" : timer.remaining === 0 ? "Time's up" : "Paused"}
              </p>
              <div className="h-3 rounded-full bg-black/[0.05] overflow-hidden mb-6 max-w-xl mx-auto">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    urgent ? "bg-red-500" : "bg-accent"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p
                className={`font-mono font-black tabular-nums tracking-tight ${
                  urgent
                    ? "text-red-500 text-[120px] leading-none"
                    : "text-gray-900 text-[120px] leading-none"
                } ${timer.remaining === 0 ? "animate-pulse text-red-500" : ""}`}
              >
                {formatTime(timer.remaining)}
              </p>
              {stage && (
                <p className="text-lg text-gray-500 mt-4">
                  {stage.gameName} · {stage.gameDurationMin} min
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-6xl mb-4">{stage?.icon || "⏳"}</p>
              <p className="text-2xl text-gray-500">
                {stage ? `${stage.gameName}` : "Waiting for facilitator to set timer"}
              </p>
            </div>
          )}
        </div>

        <div className="card-glass rounded-3xl p-6 space-y-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Team progress
          </h2>
          <div className="space-y-4">
            {TEAM_IDS.map((tid) => {
              const submitted = gameKey
                ? progress[tid]?.[gameKey]
                : false;
              return (
                <div
                  key={tid}
                  className={`flex items-center gap-4 rounded-2xl p-4 transition-all ${
                    submitted
                      ? "bg-green-500/8 border border-green-500/20"
                      : "bg-black/[0.02] border border-black/[0.04]"
                  }`}
                >
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: submitted
                        ? "#22c55e"
                        : TEAM_COLORS[tid],
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-bold ${submitted ? "text-green-600" : "text-gray-900"}`}
                    >
                      {TEAM_LABELS[tid]}
                    </p>
                    {(state.teams[tid]?.memberNames?.length || 0) > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {state.teams[tid].memberNames.map((n) => (
                          <span key={n} className="text-[11px] rounded-full px-1.5 py-0.5" style={{ backgroundColor: `${TEAM_COLORS[tid]}12`, color: TEAM_COLORS[tid] }}>
                            {n}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400">
                        {state.teams[tid]?.members || 0} online
                      </p>
                    )}
                  </div>
                  {submitted ? (
                    <span className="text-green-600 text-xl">✓</span>
                  ) : (
                    <span className="text-gray-400 text-xs">Waiting...</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {currentStage >= 1 && currentStage <= 4 && facilitatorTimeline[currentStage] && (
        <div className="card-glass rounded-3xl p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Facilitator script · Stage {currentStage}
          </h2>
          <div className="flex flex-wrap gap-3">
            {facilitatorTimeline[currentStage].map((step, i) => {
              const key = `${currentStage}-${i}`;
              const done = doneSteps.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleStep(key)}
                  className={`flex items-center gap-3 rounded-2xl px-5 py-3 transition-all text-left min-w-[200px] ${
                    done
                      ? "bg-green-500/8 border border-green-500/20"
                      : "bg-black/[0.02] border border-black/[0.04] hover:bg-black/[0.04]"
                  }`}
                >
                  <span className="text-xl shrink-0">
                    {done ? "✅" : ACTION_ICONS[step.action] || "📌"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${done ? "text-green-600 line-through" : "text-gray-900"}`}>
                        {step.label}
                      </span>
                      <span className="text-[11px] font-mono text-gray-400 shrink-0">
                        {step.duration}
                      </span>
                    </div>
                    {step.tips && (
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        {step.tips}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {currentPoll?.showResults && currentPollQ && (
        <div className="card-glass rounded-3xl p-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Poll results: {currentPollQ.question}
          </h2>
          <div className="space-y-3">
            {currentPollQ.options.map((opt) => {
              const votes = currentPoll.votes[opt.id]?.length || 0;
              const totalVotes = Object.values(currentPoll.votes).reduce(
                (a, b) => a + b.length,
                0,
              );
              const pctV = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
              return (
                <div key={opt.id} className="flex items-center gap-4">
                  <span className="text-2xl w-10 text-center">{opt.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-900 font-medium">
                        {opt.label}
                      </span>
                      <span className="text-sm font-mono text-accent font-bold">
                        {votes}
                      </span>
                    </div>
                    <div className="h-4 rounded-full bg-black/[0.05] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-700"
                        style={{ width: `${pctV}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {currentStage === 4 && state.game4.showResults && (
        <div className="card-glass rounded-3xl p-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Shark Tank voting results
          </h2>
          <div className="space-y-3">
            {[...sharkProjects]
              .sort(
                (a, b) =>
                  (game4Totals[b.id] || 0) - (game4Totals[a.id] || 0),
              )
              .map((p, i) => {
                const total = game4Totals[p.id] || 0;
                const maxT = Math.max(
                  1,
                  ...Object.values(game4Totals),
                );
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div key={p.id} className="flex items-center gap-4">
                    <span className="text-2xl w-10 text-center">
                      {i < 3 ? medals[i] : `${i + 1}`}
                    </span>
                    <span className="text-2xl">{p.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-900 font-bold">
                          {p.name}
                        </span>
                        <span className="text-sm font-mono text-accent font-bold">
                          {total}
                        </span>
                      </div>
                      <div className="h-4 rounded-full bg-black/[0.05] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            i === 0
                              ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                              : "bg-gradient-to-r from-accent to-accent-light"
                          }`}
                          style={{
                            width: `${(total / maxT) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
