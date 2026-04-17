"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getSocket } from "@/lib/socket-client";
import { useWorkshopState } from "@/hooks/useSocket";
import { useTeam } from "@/hooks/useTeam";
import { sharkProjects } from "@/lib/workshop-data";
import { TEAM_COLORS, TEAM_LABELS, type TeamId } from "@/lib/types";
import StageRecap from "@/components/shared/StageRecap";
import SubmitCelebration from "@/components/shared/SubmitCelebration";

const MAX_TOKENS = 3;
const MEDALS = ["🥇", "🥈", "🥉"];
const RISK_COLOR: Record<string, string> = {
  Low: "text-green-600",
  Medium: "text-yellow-600",
  High: "text-red-500",
};

const TOTAL_BUDGET = "€800K";
const TOTAL_BUDGET_NUM = 800;

const PHASE_GUIDE = [
  {
    label: "① Set criteria",
    minutes: "~5 min",
    desc: "Read the decision framework first, note what you value, then scan projects",
    activities: [
      "Skim all six criteria (especially Reversibility) and star your top 2–3",
      "Ask: if the budget were cut in half, would your criteria change?",
      "Share in 30 seconds each what you weight most",
    ],
  },
  {
    label: "② Understand projects",
    minutes: "~8 min",
    desc: "Score each candidate against your criteria; watch dependencies and conflicts",
    activities: [
      "Open each card, expand details for prerequisites and benefits",
      "Mental score each project against the framework",
      "Note dependency / conflict tags between projects",
    ],
  },
  {
    label: "③ Pre-commit, then vote",
    minutes: "~7 min",
    desc: "Write your voting logic before you place three tokens",
    activities: [
      "Fill the pre-commit box with your decision logic",
      "Allocate three tokens independently (concentrate or spread)",
      "Stay solo for now — discussion comes after",
    ],
  },
  {
    label: "④ Debrief",
    minutes: "~10 min",
    desc: "Review results, audit bias, prep a short team pitch",
    activities: [
      "Read the ranking — where is consensus vs. split?",
      "Bias audit: did you follow data or vibe?",
      "Stress test: what if the budget is halved?",
      "Prep a 2-minute team story",
    ],
  },
];

const DECISION_CRITERIA = [
  {
    icon: "⏱",
    label: "Time to value",
    question: "How fast can we show measurable business impact?",
    scale: "Quick Win (4–8 wk) ← → Strategic Bet (6–9 mo)",
  },
  {
    icon: "📊",
    label: "Data readiness",
    question: "Is the required data clean, complete, and available now?",
    scale: "Ready to use ← → heavy clean-up / capture work",
  },
  {
    icon: "👥",
    label: "Team fit",
    question: "Can the current team actually run this?",
    scale: "In-house skills enough ← → vendors / new hires needed",
  },
  {
    icon: "💰",
    label: "ROI",
    question: "Does expected benefit justify the spend?",
    scale: "High ROI, lean spend ← → long-horizon strategic value",
  },
  {
    icon: "🚫",
    label: "Cost of inaction",
    question: "If we skip this for six months, what breaks?",
    scale: "Limited downside ← → serious competitive gap",
  },
  {
    icon: "🔄",
    label: "Reversibility",
    question: "If we are wrong, how expensive is it to stop?",
    scale: "Easy to halt, small loss ← → large sunk cost once started",
  },
];

export default function SharkTank() {
  const { state } = useWorkshopState();
  const { team } = useTeam();
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [preCommitNote, setPreCommitNote] = useState("");
  const [preCommitSaved, setPreCommitSaved] = useState(false);
  const [activePhase, setActivePhase] = useState(0);
  const [showFramework, setShowFramework] = useState(true);

  const [currentVoter, setCurrentVoter] = useState<string | null>(null);
  const [completedVoters, setCompletedVoters] = useState<Set<string>>(new Set());
  const [showPassScreen, setShowPassScreen] = useState(false);
  const [teamSubmitted, setTeamSubmitted] = useState(false);

  const memberNames = team ? state.teams[team]?.memberNames || [] : [];
  const hasMembers = memberNames.length > 0;
  const teamColor = team ? TEAM_COLORS[team as TeamId] : "#f97316";
  const allMembersVoted = hasMembers && memberNames.every((n) => completedVoters.has(n));
  const nextUnvoted = useMemo(
    () => memberNames.find((n) => !completedVoters.has(n)),
    [memberNames, completedVoters],
  );

  const tokensUsed = Object.values(allocations).reduce((a, b) => a + b, 0);
  const tokensLeft = MAX_TOKENS - tokensUsed;
  const isOpen = state.game4.open;
  const showResults = state.game4.showResults;

  const [totals, setTotals] = useState<Record<string, number>>({});
  const [teamBreakdown, setTeamBreakdown] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    const alloc = state.game4.allocations;
    if (!alloc || typeof alloc !== "object") return;
    const tots: Record<string, number> = {};
    const bd: Record<string, Record<string, number>> = {};
    for (const [pid, voters] of Object.entries(alloc)) {
      if (!voters || typeof voters !== "object") continue;
      tots[pid] = 0;
      bd[pid] = {};
      for (const [voterId, count] of Object.entries(voters)) {
        const num = typeof count === "number" ? count : 0;
        tots[pid] += num;
        const teamId = voterId.split(":")[0];
        bd[pid][teamId] = (bd[pid][teamId] || 0) + num;
      }
    }
    if (Object.keys(tots).length > 0) {
      setTotals(tots);
      setTeamBreakdown(bd);
    }
  }, [state.game4.allocations]);

  useEffect(() => {
    const socket = getSocket();
    const onTotals = (t: Record<string, number>) => {
      if (t && Object.keys(t).length > 0) setTotals(t);
    };
    const onBreakdown = (bd: Record<string, Record<string, number>>) => {
      if (bd && Object.keys(bd).length > 0) setTeamBreakdown(bd);
    };
    socket.on("game4:totals", onTotals);
    socket.on("game4:teamBreakdown", onBreakdown);
    return () => {
      socket.off("game4:totals", onTotals);
      socket.off("game4:teamBreakdown", onBreakdown);
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socket.emit(
      "game4:getFullResults",
      (res: { totals: Record<string, number>; teamBreakdown: Record<string, Record<string, number>> }) => {
        if (res?.totals && Object.keys(res.totals).length > 0) {
          setTotals(res.totals);
        }
        if (res?.teamBreakdown && Object.keys(res.teamBreakdown).length > 0) {
          setTeamBreakdown(res.teamBreakdown);
        }
      },
    );
  }, [showResults]);

  const syncAllocations = useCallback(
    (newAlloc: Record<string, number>, voterName: string) => {
      const voterId = team ? `${team}:${voterName}` : `anon:${Date.now()}`;
      getSocket().emit("game4:allocate", {
        odientId: voterId,
        allocations: newAlloc,
      });
    },
    [team],
  );

  const addToken = (projectId: string) => {
    if (tokensLeft <= 0 || !isOpen) return;
    setAllocations((prev) => ({
      ...prev,
      [projectId]: (prev[projectId] || 0) + 1,
    }));
  };

  const removeToken = (projectId: string) => {
    if (!allocations[projectId] || !isOpen) return;
    setAllocations((prev) => {
      const next = { ...prev, [projectId]: prev[projectId] - 1 };
      if (next[projectId] <= 0) delete next[projectId];
      return next;
    });
  };

  const handleConfirmAllocation = () => {
    if (!currentVoter || tokensUsed === 0) return;
    syncAllocations(allocations, currentVoter);
    if (preCommitNote.trim()) {
      getSocket().emit("game4:strategy", { odientId: `${team}:${currentVoter}`, note: preCommitNote });
    }
    setCompletedVoters((prev) => new Set(prev).add(currentVoter));
    setAllocations({});
    setPreCommitNote("");
    setPreCommitSaved(false);
    setShowPassScreen(true);
  };

  const handleNextVoter = () => {
    setShowPassScreen(false);
    setCurrentVoter(null);
  };

  const handleTeamSubmit = () => {
    if (tokensUsed === 0 || !isOpen) return;
    const voterId = team || "anon";
    getSocket().emit("game4:allocate", {
      odientId: voterId,
      allocations,
    });
    if (preCommitNote.trim()) {
      getSocket().emit("game4:strategy", { odientId: voterId, note: preCommitNote });
    }
    setTeamSubmitted(true);
  };

  useEffect(() => {
    if (isOpen) setTeamSubmitted(false);
  }, [isOpen]);

  const maxTotal = Math.max(1, ...Object.values(totals));

  // Whether the sticky submit bar should show
  const showStickyBar = useMemo(() => {
    if (!isOpen || tokensUsed === 0 || showResults) return false;
    if (hasMembers) return !!currentVoter && !showPassScreen;
    return !teamSubmitted;
  }, [isOpen, tokensUsed, showResults, hasMembers, currentVoter, showPassScreen, teamSubmitted]);

  // Pass device screen
  if (showPassScreen && hasMembers) {
    const done = allMembersVoted;
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center">
        <div className="text-5xl">{done ? "🎉" : "👋"}</div>
        <div>
          <p className="text-lg font-bold text-gray-900 mb-1">
            {done ? "Everyone has voted!" : `${currentVoter}, you’re done!`}
          </p>
          <p className="text-sm text-gray-500">
            {done ? "Waiting for the facilitator to reveal results" : "Pass the device to the next teammate"}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {memberNames.map((name) => {
            const isDone = completedVoters.has(name);
            return (
              <span key={name} className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${isDone ? "bg-green-500/10 text-green-600 ring-1 ring-green-500/30" : "bg-black/[0.03] text-gray-400"}`}>
                {isDone ? "✓ " : ""}{name}
              </span>
            );
          })}
        </div>
        {!done && (
          <button onClick={handleNextVoter} className="rounded-2xl px-8 py-4 font-bold text-white text-lg transition" style={{ backgroundColor: teamColor }}>
            Next: {nextUnvoted}
          </button>
        )}
        {done && (
          <button onClick={() => setShowPassScreen(false)} className="rounded-xl bg-black/[0.03] px-6 py-2 text-sm text-gray-500 hover:bg-black/[0.05] transition">
            View allocation details
          </button>
        )}
      </div>
    );
  }

  // Member selector before allocation
  if (isOpen && hasMembers && !currentVoter && !showResults) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <p className="text-4xl mb-3">🦈</p>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Who is voting?</h2>
          <p className="text-sm text-gray-400">Pick your name, then allocate {MAX_TOKENS} tokens</p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400">Progress</span>
            <span className="text-xs font-mono text-gray-500">{completedVoters.size}/{memberNames.length}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {memberNames.map((name) => {
              const done = completedVoters.has(name);
              return (
                <button key={name} onClick={() => !done && setCurrentVoter(name)} disabled={done}
                  className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all ${done ? "bg-green-500/5 border border-green-500/20 cursor-default" : "bg-black/[0.03] border border-black/[0.06] hover:border-accent/40 hover:bg-accent/5 cursor-pointer"}`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-green-500/20 text-green-600" : "text-white"}`}
                    style={!done ? { backgroundColor: teamColor } : undefined}>
                    {done ? "✓" : name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${done ? "text-green-600" : "text-gray-900"}`}>{name}</p>
                    <p className="text-[11px] text-gray-400">{done ? "Voted" : "Not yet"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SubmitCelebration show={teamSubmitted || (hasMembers && allMembersVoted)} message="Allocations submitted!" />

      {/* Voter badge (member mode) — no submit button here, moved to sticky bar */}
      {currentVoter && isOpen && (
        <div className="flex items-center gap-2 card-glass rounded-2xl p-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: teamColor }}>
            {currentVoter.charAt(0).toUpperCase()}
          </span>
          <span className="text-sm font-bold" style={{ color: teamColor }}>{currentVoter} is allocating tokens</span>
          <span className="text-xs text-gray-400 ml-auto">Scroll down to submit when ready</span>
        </div>
      )}

      {/* Briefing card */}
      <div className="card-glass rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🦈</span>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">AI portfolio pitch <span className="text-xs font-normal text-gray-400 ml-1">Individual voting</span></h3>
            <p className="text-sm text-gray-600 mb-3">
              Lumitech Supply Chain is funding the next wave of AI pilots. You have <strong className="text-gray-900">six candidate projects</strong> spanning
              Quick Win and Strategic Bet tracks. Each participant receives <strong className="text-accent">three investment tokens</strong>.
              After you read the briefs and align with your table, allocate tokens to the portfolio you would fund first.
            </p>
            <div className="flex items-center gap-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 px-4 py-2">
              <span className="text-lg">💰</span>
              <div>
                <p className="text-xs font-bold text-yellow-600">
                  Budget guardrail: combined Q1/Q2 cap {TOTAL_BUDGET}
                </p>
                <p className="text-[11px] text-gray-400">
                  Facilitators will sanity-check whether the winning mix fits inside the envelope
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase guide */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {PHASE_GUIDE.map((p, i) => (
            <button
              key={i}
              onClick={() => setActivePhase(activePhase === i ? -1 : i)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-all ${
                activePhase === i
                  ? "bg-accent/10 border border-accent/30 ring-1 ring-accent/20"
                  : "bg-gray-50 border border-black/[0.04] hover:bg-gray-50"
              }`}
            >
              <span className={`text-sm font-bold ${activePhase === i ? "text-accent" : "text-gray-500"}`}>
                {p.label}
              </span>
              <span className="text-xs text-gray-400 font-mono">{p.minutes}</span>
            </button>
          ))}
        </div>
        {activePhase >= 0 && (
          <div className="rounded-xl bg-accent/5 border border-accent/10 p-4 animate-slide-up">
            <p className="text-sm font-bold text-accent mb-2">
              {PHASE_GUIDE[activePhase].desc}
            </p>
            <ul className="space-y-1.5">
              {PHASE_GUIDE[activePhase].activities.map((a, i) => (
                <li key={i} className="text-xs text-gray-500 flex items-start gap-2">
                  <span className="text-accent shrink-0 mt-0.5">•</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Decision framework — shown FIRST and expanded by default */}
      <button
        onClick={() => setShowFramework(!showFramework)}
        className="w-full flex items-center justify-between rounded-xl bg-slate-500/5 border border-slate-500/20 px-4 py-3 text-sm font-bold text-slate-400 hover:bg-slate-500/10 transition"
      >
        <span>🎯 Decision framework — criteria before projects</span>
        <span className={`transition-transform ${showFramework ? "rotate-180" : ""}`}>▼</span>
      </button>
      {showFramework && (
        <div className="grid gap-3 md:grid-cols-2 animate-slide-up">
          {DECISION_CRITERIA.map((c) => (
            <div key={c.label} className={`rounded-xl bg-gray-50 border p-4 ${c.label === "Reversibility" ? "border-amber-500/20 ring-1 ring-amber-500/10" : "border-black/[0.04]"}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span>{c.icon}</span>
                <span className="text-xs font-bold text-gray-900">{c.label}</span>
                {c.label === "Reversibility" && <span className="text-[9px] text-amber-600 bg-amber-500/10 rounded px-1.5 py-0.5">NEW</span>}
              </div>
              <p className="text-[11px] text-gray-600 mb-1">{c.question}</p>
              <div className="rounded-lg bg-white/50 px-2 py-1">
                <p className="text-[9px] text-gray-400 font-mono">{c.scale}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budget uncertainty warning */}
      <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3 flex items-start gap-3">
        <span className="text-sm shrink-0 mt-0.5">⚠️</span>
        <div>
          <p className="text-xs font-bold text-red-500">Budget uncertainty</p>
          <p className="text-[11px] text-gray-500">
            Finance may cut the envelope to €400K while CFO review finishes. Ask yourself: <strong className="text-gray-600">would your picks change at half budget?</strong>
          </p>
        </div>
      </div>

      {/* Token indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Your tokens:</span>
          <div className="flex gap-1.5">
            {Array.from({ length: MAX_TOKENS }).map((_, i) => (
              <div
                key={i}
                className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < tokensUsed
                    ? "bg-accent text-white shadow-lg shadow-accent/15 scale-110"
                    : "bg-gray-100 text-gray-400 border border-black/[0.06]"
                }`}
              >
                ★
              </div>
            ))}
          </div>
          <span className={`text-sm font-medium ${tokensLeft === 0 ? "text-accent" : "text-gray-400"}`}>
            {tokensLeft === 0 ? "All placed" : `${tokensLeft} left`}
          </span>
        </div>
        {!isOpen && (
          <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-600">
            ⏳ Waiting for facilitator to open voting
          </span>
        )}
      </div>

      {/* Project cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sharkProjects.map((project) => {
          const myTokens = allocations[project.id] || 0;
          const total = totals[project.id] || 0;
          const isQuickWin = project.type === "Quick Win";
          const isExpanded = expandedCard === project.id;

          return (
            <div
              key={project.id}
              className={`card-glass rounded-2xl p-5 transition-all flex flex-col ${
                myTokens > 0 ? "ring-1 ring-accent/40 glow-accent" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{project.icon}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                    isQuickWin
                      ? "bg-green-500/10 text-green-600"
                      : "bg-slate-500/10 text-slate-400"
                  }`}
                >
                  {project.type}
                </span>
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-1">
                {project.name}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-1">
                {project.description}
              </p>
              <p className="text-[11px] text-gray-400 leading-relaxed mb-3 rounded-lg bg-white/30 px-2 py-1.5">
                💬 In plain terms: {project.plainDescription}
              </p>

              <div className="flex flex-wrap gap-2 mb-3 text-[11px]">
                <div className="rounded-lg bg-gray-50 px-2 py-1">
                  <span className="text-gray-400">Budget</span>{" "}
                  <span className="font-bold text-gray-900">{project.cost}</span>
                </div>
                <div className="rounded-lg bg-gray-50 px-2 py-1">
                  <span className="text-gray-400">Timeline</span>{" "}
                  <span className="font-bold text-gray-900">{project.timeline}</span>
                </div>
                <div className="rounded-lg bg-gray-50 px-2 py-1">
                  <span className="text-gray-400">Risk</span>{" "}
                  <span className={`font-bold ${RISK_COLOR[project.risk] || "text-gray-900"}`}>{project.risk}</span>
                </div>
              </div>

              <button
                onClick={() => setExpandedCard(isExpanded ? null : project.id)}
                className="text-[11px] text-gray-400 hover:text-accent transition mb-3"
              >
                {isExpanded ? "Hide details ▲" : "Show details ▼"}
              </button>

              {isExpanded && (
                <div className="text-[11px] text-gray-500 space-y-1.5 mb-3 p-3 rounded-lg bg-white/50 border border-black/[0.04] animate-slide-up">
                  <p><strong className="text-gray-600">Prerequisites:</strong> {project.prerequisites}</p>
                  <p><strong className="text-gray-600">Expected benefits:</strong> {project.expectedBenefits}</p>
                  <p><strong className="text-gray-600">Best for:</strong> {project.targetTeams}</p>
                </div>
              )}

              {(project.dependencies || project.conflicts) && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {project.dependencies?.map((depId) => {
                    const dep = sharkProjects.find((p) => p.id === depId);
                    return dep ? (
                      <span key={depId} className="inline-flex items-center gap-1 rounded-lg bg-yellow-500/5 border border-yellow-500/20 px-2 py-0.5 text-[9px] text-yellow-600">
                        🔗 Needs {dep.name}
                      </span>
                    ) : null;
                  })}
                  {project.conflicts?.map((cId) => {
                    const c = sharkProjects.find((p) => p.id === cId);
                    return c ? (
                      <span key={cId} className="inline-flex items-center gap-1 rounded-lg bg-red-500/5 border border-red-500/20 px-2 py-0.5 text-[9px] text-red-500">
                        ⚡ Conflicts with {c.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {myTokens > 0 && (() => {
                const warnings: { type: "dep" | "conflict"; text: string }[] = [];
                if (project.dependencies) {
                  for (const depId of project.dependencies) {
                    if (!allocations[depId]) {
                      const depProject = sharkProjects.find((p) => p.id === depId);
                      if (depProject) {
                        warnings.push({
                          type: "dep",
                          text: `This initiative depends on ${depProject.name}’s data path — consider funding both`,
                        });
                      }
                    }
                  }
                }
                if (project.conflicts) {
                  for (const cId of project.conflicts) {
                    if (allocations[cId]) {
                      const cProject = sharkProjects.find((p) => p.id === cId);
                      if (cProject) {
                        warnings.push({
                          type: "conflict",
                          text: `This initiative competes for the same engineering capacity as ${cProject.name} — running both is risky`,
                        });
                      }
                    }
                  }
                }
                if (warnings.length === 0) return null;
                return (
                  <div className="space-y-1.5 mb-3 animate-slide-up">
                    {warnings.map((w, i) => (
                      <div
                        key={i}
                        className={`rounded-lg px-3 py-2 text-[11px] ${
                          w.type === "dep"
                            ? "bg-yellow-500/5 border border-yellow-500/20 text-yellow-600"
                            : "bg-red-500/5 border border-red-500/20 text-red-500"
                        }`}
                      >
                        {w.type === "dep" ? "⚠ " : "⚡ "}
                        {w.text}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Spacer pushes allocation controls to card bottom */}
              <div className="mt-auto" />

              {isOpen && (
                <div className="flex items-center justify-between pt-3 border-t border-black/[0.04]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeToken(project.id)}
                      disabled={myTokens === 0}
                      className="h-9 w-9 rounded-full bg-gray-100 text-gray-500 hover:bg-red-500/20 hover:text-red-500 transition disabled:opacity-30 text-lg"
                    >
                      −
                    </button>
                    <div className="flex gap-1 min-w-[60px] justify-center">
                      {Array.from({ length: myTokens }).map((_, i) => (
                        <span key={i} className="text-accent text-lg">★</span>
                      ))}
                      {myTokens === 0 && (
                        <span className="text-gray-400 text-sm">No tokens</span>
                      )}
                    </div>
                    <button
                      onClick={() => addToken(project.id)}
                      disabled={tokensLeft <= 0}
                      className="h-9 w-9 rounded-full bg-gray-100 text-gray-500 hover:bg-accent/20 hover:text-accent transition disabled:opacity-30 text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {(showResults || myTokens > 0) && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Total votes</span>
                    <span className="font-mono font-bold text-gray-900">
                      {total}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-500"
                      style={{
                        width: `${(total / maxTotal) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pre-commitment note — before submitting */}
      {isOpen && tokensUsed > 0 && !teamSubmitted && (
        <div className="card-glass rounded-2xl p-5">
          <h3 className="text-sm font-bold text-accent mb-2">
            📝 Pre-commit note — capture your logic first
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            Before you submit, write the rules you used. This is not post-hoc justification — it <strong className="text-gray-600">locks in your reasoning</strong> so you can
            compare later against outcomes and spot bias.
          </p>
          {!preCommitSaved ? (
            <>
              <textarea
                value={preCommitNote}
                onChange={(e) => setPreCommitNote(e.target.value)}
                placeholder={"Answer:\n1. Which framework dimensions mattered most?\n2. How confident are you (High/Med/Low) and why?\n3. What new fact would flip your vote entirely?"}
                rows={4}
                className="w-full rounded-xl bg-gray-50 border border-black/[0.06] px-4 py-3 text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
              <button
                onClick={() => { if (preCommitNote.trim()) setPreCommitSaved(true); }}
                disabled={!preCommitNote.trim()}
                className="mt-2 rounded-lg bg-accent/20 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/30 transition disabled:opacity-30"
              >
                Lock note
              </button>
            </>
          ) : (
            <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-3">
              <p className="text-xs text-green-600 mb-1">✓ Note locked</p>
              <p className="text-xs text-gray-600 whitespace-pre-line">{preCommitNote}</p>
            </div>
          )}
        </div>
      )}

      {/* Team submitted inline confirmation */}
      {isOpen && !hasMembers && teamSubmitted && (
        <div className="card-glass rounded-2xl p-5 text-center space-y-3">
          <p className="text-lg font-bold text-green-600">✓ Allocation saved</p>
          <p className="text-sm text-gray-500">Waiting for facilitator to reveal results</p>
          <button
            onClick={() => { setTeamSubmitted(false); }}
            className="rounded-xl bg-black/[0.03] px-4 py-2 text-xs text-gray-400 hover:bg-black/[0.05] transition"
          >
            Edit allocation
          </button>
        </div>
      )}

      {/* Unified sticky submit bar — sits above SmartActionBar (z-[80]) */}
      {showStickyBar && (
        <div className="fixed bottom-[72px] left-0 right-0 z-[85] px-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3 rounded-2xl bg-white/95 backdrop-blur-xl border border-accent/20 shadow-[0_-8px_30px_rgba(249,115,22,0.15)] p-3">
            <div className="flex items-center gap-1.5 shrink-0">
              {Array.from({ length: MAX_TOKENS }).map((_, i) => (
                <span key={i} className={`text-lg ${i < tokensUsed ? "text-accent" : "text-gray-700"}`}>★</span>
              ))}
            </div>
            <button
              onClick={hasMembers ? handleConfirmAllocation : handleTeamSubmit}
              className="flex-1 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-500 transition shadow-lg shadow-green-600/15"
            >
              {hasMembers
                ? `Confirm · ${currentVoter} (${tokensUsed}/${MAX_TOKENS})`
                : `Submit team allocation (${tokensUsed}/${MAX_TOKENS})`}
            </button>
          </div>
        </div>
      )}
      {/* Spacer for sticky bar + SmartActionBar */}
      {showStickyBar && <div className="h-36" />}

      {/* Full results with medals */}
      {showResults && (
        <div className="card-glass rounded-2xl p-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            🏆 Vote ranking
          </h3>

          {Object.keys(teamBreakdown).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-black/[0.04]">
              {(Object.keys(TEAM_LABELS) as TeamId[]).map((tid) => {
                const hasVotes = Object.values(teamBreakdown).some((bd) => bd[tid]);
                if (!hasVotes) return null;
                return (
                  <span
                    key={tid}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ backgroundColor: `${TEAM_COLORS[tid]}15`, color: TEAM_COLORS[tid], border: `1px solid ${TEAM_COLORS[tid]}30` }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TEAM_COLORS[tid] }} />
                    {TEAM_LABELS[tid]}
                  </span>
                );
              })}
            </div>
          )}

          <div className="space-y-4">
            {[...sharkProjects]
              .sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0))
              .map((p, i) => {
                const total = totals[p.id] || 0;
                const bd = teamBreakdown[p.id] || {};
                const bdEntries = Object.entries(bd).sort((a, b) => b[1] - a[1]);
                return (
                  <div key={p.id} className="flex items-start gap-3">
                    <span
                      className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm font-black mt-0.5 ${
                        i < 3 ? "bg-transparent text-xl" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {i < 3 ? MEDALS[i] : i + 1}
                    </span>
                    <span className="text-lg shrink-0 mt-0.5">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-gray-900">{p.name}</span>
                        <span className="font-mono font-bold text-accent">{total} votes</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden flex">
                        {bdEntries.map(([tid, cnt]) => (
                          <div
                            key={tid}
                            className="h-full transition-all duration-700"
                            style={{
                              width: maxTotal > 0 ? `${(cnt / maxTotal) * 100}%` : "0%",
                              backgroundColor: TEAM_COLORS[tid as TeamId] || "#6b7280",
                            }}
                          />
                        ))}
                      </div>
                      {bdEntries.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {bdEntries.map(([tid, cnt]) => (
                            <span
                              key={tid}
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium"
                              style={{
                                backgroundColor: `${TEAM_COLORS[tid as TeamId] || "#6b7280"}15`,
                                color: TEAM_COLORS[tid as TeamId] || "#6b7280",
                                border: `1px solid ${TEAM_COLORS[tid as TeamId] || "#6b7280"}30`,
                              }}
                            >
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: TEAM_COLORS[tid as TeamId] || "#6b7280" }} />
                              {TEAM_LABELS[tid as TeamId] || tid} ×{cnt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Portfolio Strategy Analysis */}
          {(() => {
            const totalVotes = Object.values(totals).reduce((a, b) => a + b, 0);
            if (totalVotes === 0) return null;
            const qwVotes = sharkProjects
              .filter((p) => p.type === "Quick Win")
              .reduce((sum, p) => sum + (totals[p.id] || 0), 0);
            const qwPct = Math.round((qwVotes / totalVotes) * 100);
            const sbPct = 100 - qwPct;
            return (
              <div className="mt-6 pt-4 border-t border-black/[0.04]">
                <p className="text-xs font-bold text-gray-500 mb-3">📊 Portfolio mix</p>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-green-600 font-bold">Quick Win {qwPct}% ({qwVotes} votes)</span>
                  <span className="text-amber-600 font-bold">Strategic Bet {sbPct}% ({totalVotes - qwVotes} votes)</span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden flex">
                  <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${qwPct}%` }} />
                  <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${sbPct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {qwPct > 60
                    ? "🏃 The room leans Quick Win — great for momentum, just plan Q3/Q4 strategic bets early"
                    : qwPct < 40
                      ? "🎯 The room leans Strategic Bet — bold, but confirm you can staff and land the work"
                      : "⚖️ Balanced mix — short-term wins plus longer bets; a mature portfolio posture"}
                </p>
              </div>
            );
          })()}

          {/* Budget analysis */}
          <div className="mt-6 pt-4 border-t border-black/[0.04]">
            <p className="text-xs font-bold text-gray-500 mb-3">💰 Budget math</p>
            {(() => {
              const sorted = [...sharkProjects].sort(
                (a, b) => (totals[b.id] || 0) - (totals[a.id] || 0),
              );
              const top3 = sorted.slice(0, 3);
              const costNum = (s: string) => {
                const m = s.match(/(\d+)/);
                return m ? parseInt(m[1]) : 0;
              };
              const top3Cost = top3.reduce((sum, p) => sum + costNum(p.cost), 0);
              const overBudget = top3Cost > TOTAL_BUDGET_NUM;
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-400">Top-3 portfolio cost:</span>
                    <span className={`font-bold font-mono ${overBudget ? "text-red-500" : "text-green-600"}`}>
                      €{top3Cost}K / {TOTAL_BUDGET}
                    </span>
                    {overBudget && (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-500">
                        Over budget
                      </span>
                    )}
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        overBudget
                          ? "bg-gradient-to-r from-red-500 to-red-400"
                          : "bg-gradient-to-r from-green-500 to-green-400"
                      }`}
                      style={{ width: `${Math.min(100, (top3Cost / TOTAL_BUDGET_NUM) * 100)}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {top3.map((p, i) => (
                      <span key={p.id} className="rounded-lg bg-gray-50 px-2 py-1 text-[11px]">
                        {MEDALS[i]} {p.name}: <span className="font-bold text-gray-900">{p.cost}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Budget Stress Test */}
          <div className="mt-6 pt-4 border-t border-black/[0.04]">
            <div className="rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-950/40 via-gray-50/60 to-red-950/40 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <h4 className="text-sm font-bold text-red-500">Budget stress test</h4>
              </div>
              {(() => {
                const sorted = [...sharkProjects].sort(
                  (a, b) => (totals[b.id] || 0) - (totals[a.id] || 0),
                );
                const top3 = sorted.slice(0, 3);
                const top3Cost = top3.reduce((sum, p) => sum + p.costValue, 0);
                const cutBudget = 400;
                return (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4">
                      <p className="text-xs text-red-500 font-bold mb-1">Breaking news</p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        CEO just announced <strong className="text-red-500">Q2 budget drops from €800K to €{cutBudget}K</strong>.
                        The combined cost of the top three projects is <strong className="text-gray-900">€{top3Cost}K</strong>
                        {top3Cost > cutBudget
                          ? " — well above the new cap."
                          : " — still inside the revised envelope."}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Current top three:</p>
                      {top3.map((p, i) => {
                        const depNames = (p.dependencies || [])
                          .map((depId) => sharkProjects.find((sp) => sp.id === depId)?.name)
                          .filter(Boolean);
                        return (
                          <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/50 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{MEDALS[i]}</span>
                              <span className="text-xs font-bold text-gray-900">{p.name}</span>
                              {depNames.length > 0 && (
                                <span className="text-[9px] text-yellow-600">Needs: {depNames.join(", ")}</span>
                              )}
                            </div>
                            <span className="text-xs font-mono text-gray-500">{p.cost}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-3">
                      <p className="text-xs text-yellow-600 font-bold mb-1">Discussion prompts</p>
                      <ul className="space-y-1 text-xs text-gray-500">
                        <li>• With only €{cutBudget}K, which of the top three do you keep vs. pause?</li>
                        <li>• Are there leaner substitutes for anything you cut?</li>
                        <li>• Dependencies matter — does removing one project zero out another?</li>
                        <li>• Do you pause every Strategic Bet and fund only Quick Wins to survive?</li>
                      </ul>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Bias Audit */}
          <div className="mt-6 pt-4 border-t border-black/[0.04]">
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.03] p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🪞</span>
                <h4 className="text-sm font-bold text-purple-400">Bias audit — data or gut?</h4>
              </div>
              <p className="text-[11px] text-gray-400">
                Re-read your pre-commit note and answer honestly. There is no “right” answer — the goal is awareness.
              </p>
              <div className="space-y-2">
                {[
                  {
                    q: "Top-voted project — did you fund it because of data readiness or because the pitch sounded coolest?",
                    tag: "Halo effect",
                  },
                  {
                    q: "Zero-vote project — did you truly evaluate it or skip it because nobody talked about it?",
                    tag: "Bandwagon",
                  },
                  {
                    q: "Did you place tokens on big, low-reversibility bets? Did you price in sunk cost if you are wrong?",
                    tag: "Sunk-cost bias",
                  },
                  {
                    q: "You wrote what would change your mind — seeing the tally, would you actually change?",
                    tag: "Anchoring",
                  },
                ].map((item) => (
                  <div key={item.tag} className="rounded-xl bg-white/50 border border-purple-500/10 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 rounded px-1.5 py-0.5">{item.tag}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.q}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Data-driven discussion prompts */}
          {(() => {
            const sorted = [...sharkProjects].sort(
              (a, b) => (totals[b.id] || 0) - (totals[a.id] || 0),
            );
            const top = sorted[0];
            const topTotal = totals[top.id] || 0;
            const topTeams = Object.keys(teamBreakdown[top.id] || {});
            const totalVotes = Object.values(totals).reduce((a, b) => a + b, 0);
            const qwVotes = sharkProjects
              .filter((p) => p.type === "Quick Win")
              .reduce((sum, p) => sum + (totals[p.id] || 0), 0);
            const bottom = sorted[sorted.length - 1];
            const bottomTotal = totals[bottom.id] || 0;

            return (
              <div className="mt-6 pt-4 border-t border-black/[0.04]">
                <p className="text-xs font-bold text-gray-500 mb-3">💬 Data-informed discussion</p>
                <div className="space-y-2.5 text-xs text-gray-500">
                  <p>
                    • <strong className="text-gray-900">{top.name}</strong> earned {topTotal} votes
                    {topTeams.length > 0 && ` (across ${topTeams.length} teams)`}
                    — what traits did people reward?
                  </p>
                  {bottomTotal === 0 && (
                    <p>
                      • <strong className="text-gray-900">{bottom.name}</strong> has zero votes
                      — weak idea or crowded out by budget reality?
                    </p>
                  )}
                  <p>
                    • Quick Wins are{" "}
                    <strong className="text-green-600">{totalVotes > 0 ? Math.round((qwVotes / totalVotes) * 100) : 0}%</strong>
                    of all tokens — what does that say about risk appetite?
                  </p>
                  <p>• If you could launch only <strong className="text-accent">two projects</strong> in Q1, which pair?</p>
                </div>
              </div>
            );
          })()}

          {/* Monday Action */}
          {(() => {
            const sorted = [...sharkProjects].sort(
              (a, b) => (totals[b.id] || 0) - (totals[a.id] || 0),
            );
            const top3 = sorted.slice(0, 3).filter((p) => (totals[p.id] || 0) > 0);
            if (top3.length === 0) return null;
            return (
              <div className="mt-6 pt-4 border-t border-black/[0.04]">
                <div className="rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/5 via-gray-50/60 to-accent/5 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">📅</span>
                    <h4 className="text-sm font-bold text-accent">Monday actions</h4>
                    <span className="text-[11px] text-gray-400">— if leadership approves, what is day-one work?</span>
                  </div>
                  <div className="space-y-3">
                    {top3.map((p, i) => (
                      <div key={p.id} className="flex items-start gap-3">
                        <span className="text-sm shrink-0 mt-0.5">{MEDALS[i]}</span>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-900 mb-0.5">{p.name}</p>
                          <p className="text-[11px] text-accent leading-relaxed">{p.mondayAction}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl bg-white/50 border border-black/[0.04] p-3">
                    <p className="text-[11px] text-gray-500">
                      💡 <strong className="text-gray-600">Principle:</strong>
                      Roughly 80% of AI success is data quality and org readiness; tool choice is ~20%.
                      Back at your desk, spend a week on a data audit before you chase a new AI vendor.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {showResults && <StageRecap stageId={4} />}
    </div>
  );
}
