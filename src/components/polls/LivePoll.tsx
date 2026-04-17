"use client";

import { useState, useMemo, useRef } from "react";
import { getSocket } from "@/lib/socket-client";
import { useWorkshopState } from "@/hooks/useSocket";
import { useTeam } from "@/hooks/useTeam";
import { pollQuestions } from "@/lib/workshop-data";
import { TEAM_COLORS, type TeamId } from "@/lib/types";

const ANON_KEY = "signify-anon-id";
function getAnonId() {
  if (typeof window === "undefined") return "anon";
  let id = sessionStorage.getItem(ANON_KEY);
  if (!id) {
    id = `anon:${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(ANON_KEY, id);
  }
  return id;
}

export default function LivePoll({ stageId }: { stageId: number }) {
  const { state } = useWorkshopState();
  const { team } = useTeam();
  const [currentVoter, setCurrentVoter] = useState<string | null>(null);
  const [votedMembers, setVotedMembers] = useState<Record<string, string>>({});
  const [customText, setCustomText] = useState("");
  const [showPassScreen, setShowPassScreen] = useState(false);
  const anonVoted = useRef(false);

  const pq = pollQuestions.find((p) => p.stageId === stageId);
  const pollState = state.polls[stageId];
  const memberNames = team ? state.teams[team]?.memberNames || [] : [];
  const hasMembers = memberNames.length > 0;
  const teamColor = team ? TEAM_COLORS[team as TeamId] : "#f97316";

  const allVoted = hasMembers && memberNames.every((n) => n in votedMembers);
  const nextUnvoted = useMemo(
    () => memberNames.find((n) => !(n in votedMembers)),
    [memberNames, votedMembers],
  );

  if (!pq || !pollState) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-gray-500">Poll not open yet</p>
          <p className="text-sm text-gray-400 mt-1">Waiting for facilitator to open Poll {stageId}</p>
        </div>
      </div>
    );
  }

  if (!pollState.open && !pollState.showResults) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">⏳</p>
          <p className="text-gray-500">Poll not open yet</p>
          <p className="text-sm text-gray-400 mt-1">Waiting for facilitator to open this stage&apos;s poll</p>
        </div>
      </div>
    );
  }

  const allOptionIds = [...pq.options.map((o) => o.id), "custom"];
  const totalVotes = allOptionIds.reduce((acc, id) => {
    const arr = pollState.votes[id];
    return acc + (Array.isArray(arr) ? arr.length : 0);
  }, 0);

  const handleVote = (optionId: string, text?: string) => {
    const voterName = currentVoter || "anonymous";
    const voterId = team ? `${team}:${voterName}` : getAnonId();

    // Prevent anonymous users from voting twice
    if (!team && anonVoted.current) return;
    if (!team) anonVoted.current = true;

    setVotedMembers((prev) => ({ ...prev, [voterName]: optionId }));

    getSocket().emit("poll:vote", {
      pollId: stageId,
      optionId,
      odientId: voterId,
      customText: optionId === "custom" ? text : undefined,
    });

    if (hasMembers) {
      setShowPassScreen(true);
    }
  };

  const handleCustomSubmit = () => {
    if (!customText.trim()) return;
    handleVote("custom", customText.trim());
    setCustomText("");
  };

  const handleNextVoter = () => {
    setShowPassScreen(false);
    setCurrentVoter(null);
  };

  const customCount = Array.isArray(pollState.votes["custom"]) ? pollState.votes["custom"].length : 0;
  const customPct = totalVotes > 0 ? (customCount / totalVotes) * 100 : 0;
  const customEntries = Object.values(pollState.customTexts || {});

  // Pass device screen
  if (showPassScreen && !allVoted) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center">
        <div className="text-5xl animate-bounce">👋</div>
        <div>
          <p className="text-lg font-bold text-gray-900 mb-1">
            {currentVoter}, vote recorded!
          </p>
          <p className="text-sm text-gray-500">
            Pass the device to the next teammate
          </p>
        </div>

        {/* Progress */}
        <div className="flex flex-wrap justify-center gap-2">
          {memberNames.map((name) => {
            const done = name in votedMembers;
            return (
              <span
                key={name}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  done
                    ? "bg-green-500/10 text-green-600 ring-1 ring-green-500/30"
                    : "bg-black/[0.03] text-gray-400"
                }`}
              >
                {done ? "✓ " : ""}{name}
              </span>
            );
          })}
        </div>

        <button
          onClick={handleNextVoter}
          className="rounded-2xl px-8 py-4 font-bold text-white text-lg transition"
          style={{ backgroundColor: teamColor }}
        >
          {nextUnvoted ? `Next: ${nextUnvoted}` : "Continue"}
        </button>
      </div>
    );
  }

  // All voted completion screen
  if (showPassScreen && allVoted) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center">
        <div className="text-5xl">🎉</div>
        <div>
          <p className="text-lg font-bold text-gray-900 mb-1">Everyone has voted!</p>
          <p className="text-sm text-gray-500">Waiting for facilitator to reveal results</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {memberNames.map((name) => (
            <span key={name} className="rounded-full px-3 py-1 text-xs font-medium bg-green-500/10 text-green-600 ring-1 ring-green-500/30">
              ✓ {name}
            </span>
          ))}
        </div>
        <button
          onClick={() => setShowPassScreen(false)}
          className="rounded-xl bg-black/[0.03] px-6 py-2 text-sm text-gray-500 hover:bg-black/[0.05] transition"
        >
          View poll details
        </button>
      </div>
    );
  }

  // Member selector (when poll is open and members exist)
  if (pollState.open && hasMembers && !currentVoter) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <p className="text-sm text-accent font-medium uppercase tracking-wider mb-2">
            Live Poll · Stage {stageId}
          </p>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Who is voting?</h2>
          <p className="text-sm text-gray-400">Pick your name</p>
        </div>

        {/* Member progress */}
        <div className="card-glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400">Voting progress</span>
            <span className="text-xs font-mono text-gray-500">
              {Object.keys(votedMembers).length}/{memberNames.length}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {memberNames.map((name) => {
              const done = name in votedMembers;
              return (
                <button
                  key={name}
                  onClick={() => !done && setCurrentVoter(name)}
                  disabled={done}
                  className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
                    done
                      ? "bg-green-500/5 border border-green-500/20 cursor-default"
                      : "bg-black/[0.03] border border-black/[0.06] hover:border-accent/40 hover:bg-accent/5 cursor-pointer"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      done ? "bg-green-500/20 text-green-600" : "text-white"
                    }`}
                    style={!done ? { backgroundColor: teamColor } : undefined}
                  >
                    {done ? "✓" : name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${done ? "text-green-600" : "text-gray-900"}`}>
                      {name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {done ? `Voted ${pq.options.find((o) => o.id === votedMembers[name])?.id || "custom"}` : "Not voted"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Main voting UI
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <p className="text-sm text-accent font-medium uppercase tracking-wider mb-2">
          Live Poll · Stage {stageId}
        </p>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">
          {pq.question}
        </h2>
        {currentVoter && (
          <div className="inline-flex items-center gap-2 mt-3 rounded-full px-4 py-1.5" style={{ backgroundColor: `${teamColor}20`, border: `1px solid ${teamColor}40` }}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: teamColor }}>
              {currentVoter.charAt(0).toUpperCase()}
            </span>
            <span className="text-sm font-bold" style={{ color: teamColor }}>
              {currentVoter} is voting
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {pq.options.map((opt) => {
          const count = Array.isArray(pollState.votes[opt.id]) ? pollState.votes[opt.id].length : 0;
          const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
          const isSelected = currentVoter ? votedMembers[currentVoter] === opt.id : false;

          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={!pollState.open || (hasMembers && !currentVoter)}
              className={`w-full text-left rounded-2xl p-4 transition-all relative overflow-hidden ${
                isSelected
                  ? "ring-2 ring-accent bg-accent/10"
                  : "card-glass hover:bg-black/[0.03] active:bg-black/[0.04]"
              } ${!pollState.open ? "cursor-default" : ""}`}
            >
              {pollState.showResults && (
                <div
                  className="absolute inset-y-0 left-0 bg-accent/10 transition-all duration-700 rounded-2xl"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-start gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isSelected ? "bg-accent text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {opt.id}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 leading-relaxed">{opt.label}</p>
                </div>
                {pollState.showResults && (
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-gray-900">{Math.round(pct)}%</p>
                    <p className="text-xs text-gray-400">{count} votes</p>
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {/* Custom option */}
        <div
          className={`rounded-2xl p-4 transition-all relative overflow-hidden ${
            currentVoter && votedMembers[currentVoter] === "custom"
              ? "ring-2 ring-amber-500 bg-amber-500/10"
              : "card-glass"
          }`}
        >
          {pollState.showResults && (
            <div
              className="absolute inset-y-0 left-0 bg-amber-500/10 transition-all duration-700 rounded-2xl"
              style={{ width: `${customPct}%` }}
            />
          )}
          <div className="relative">
            <div className="flex items-start gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                  currentVoter && votedMembers[currentVoter] === "custom"
                    ? "bg-amber-500 text-white font-bold"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                ✎
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-2">
                  None of the above — I have my own idea:
                </p>
                {pollState.open && (hasMembers ? currentVoter : true) && (
                  <div className="flex gap-2">
                    <input
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                      placeholder="Type your response..."
                      className="flex-1 rounded-lg bg-white border border-black/[0.06] px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      onClick={handleCustomSubmit}
                      disabled={!customText.trim()}
                      className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-500 disabled:opacity-35 shrink-0"
                    >
                      Submit
                    </button>
                  </div>
                )}
              </div>
              {pollState.showResults && (
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-gray-900">{Math.round(customPct)}%</p>
                  <p className="text-xs text-gray-400">{customCount} votes</p>
                </div>
              )}
            </div>

            {pollState.showResults && customEntries.length > 0 && (
              <div className="mt-3 ml-11 space-y-1.5">
                {customEntries.map((text, i) => (
                  <div key={i} className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-amber-700 border border-amber-500/10">
                    &ldquo;{text}&rdquo;
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer status */}
      <div className="text-center text-sm text-gray-400">
        {pollState.open
          ? hasMembers
            ? currentVoter
              ? `${currentVoter}, pick an option`
              : "Select who is voting first"
            : "Pick an option or add a custom response"
          : `Poll closed · ${totalVotes} votes total`}
      </div>
    </div>
  );
}
