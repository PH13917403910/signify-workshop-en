"use client";

import { useState, useEffect, useMemo } from "react";
import { getSocket } from "@/lib/socket-client";
import { useTeam } from "@/hooks/useTeam";
import { CRISIS_SCENARIO, CRISIS_AGENTS } from "@/lib/workshop-data";
import StageRecap from "@/components/shared/StageRecap";
import TeamStatusBar from "@/components/shared/TeamStatusBar";
import SubmitCelebration from "@/components/shared/SubmitCelebration";

type Phase = "decision" | "dispatch" | "submit";

interface DecisionSnapshot {
  inventorySlider: number;
  logisticsChoice: string;
  sacrificeChoices: string[];
  priorityChoice: string;
}

export default function CrisisPrompt() {
  const { team } = useTeam();
  const [phase, setPhase] = useState<Phase>("decision");
  const [finalAnswer, setFinalAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!team) return;
    getSocket().emit(
      "game:getData",
      { teamId: team, gameId: 3 },
      (data: { finalAnswer?: string; submitted?: boolean } | null) => {
        if (!data?.submitted) return;
        setSubmitted(true);
        if (data.finalAnswer) setFinalAnswer(data.finalAnswer);
        setPhase("submit");
      },
    );
  }, [team]);

  const [scenarioExpanded, setScenarioExpanded] = useState(true);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  // AI Consultant
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [clipboardCopied, setClipboardCopied] = useState(false);

  // Decision state
  const [inventorySlider, setInventorySlider] = useState(
    CRISIS_SCENARIO.decisions.inventoryAllocation.default,
  );
  const [logisticsChoice, setLogisticsChoice] = useState("");
  const [sacrificeChoices, setSacrificeChoices] = useState<Set<string>>(new Set());
  const [priorityChoice, setPriorityChoice] = useState("");
  const [decisionsLocked, setDecisionsLocked] = useState(false);
  const [decisionSnapshot, setDecisionSnapshot] = useState<DecisionSnapshot | null>(null);

  // Agent state
  const [agentAssignments, setAgentAssignments] = useState<Record<string, string>>({});
  const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set());
  const [agentSteps, setAgentSteps] = useState<Record<string, number>>({});
  const [completedAgents, setCompletedAgents] = useState<Set<string>>(new Set());
  const [approvedAgents, setApprovedAgents] = useState<Set<string>>(new Set());
  const [approvalReasons, setApprovalReasons] = useState<Record<string, string>>({});

  const decisionComplete =
    logisticsChoice !== "" && sacrificeChoices.size > 0 && priorityChoice !== "";

  const crisisIds = CRISIS_SCENARIO.events.map((e) => e.id);
  const allAgentsAssigned = crisisIds.every((id) => agentAssignments[id]);
  const allAgentsCompleted = crisisIds.every((id) => {
    const agentId = agentAssignments[id];
    return agentId && completedAgents.has(`${agentId}-${id}`);
  });
  const allAgentsApproved = crisisIds.every((id) => {
    const agentId = agentAssignments[id];
    return agentId && approvedAgents.has(`${agentId}-${id}`);
  });

  const assignAgent = (crisisId: string, agentId: string) => {
    setAgentAssignments((prev) => ({ ...prev, [crisisId]: agentId }));
  };

  const runAgent = (crisisId: string) => {
    const agentId = agentAssignments[crisisId];
    if (!agentId) return;
    const key = `${agentId}-${crisisId}`;
    const agent = CRISIS_AGENTS.find((a) => a.id === agentId);
    const workflow = agent?.workflows[crisisId];
    if (!workflow) return;

    setRunningAgents((prev) => new Set(prev).add(key));
    setAgentSteps((prev) => ({ ...prev, [key]: 0 }));

    let step = 0;
    const timer = setInterval(() => {
      step++;
      if (step >= workflow.steps.length) {
        clearInterval(timer);
        setRunningAgents((prev) => { const s = new Set(prev); s.delete(key); return s; });
        setCompletedAgents((prev) => new Set(prev).add(key));
        setAgentSteps((prev) => ({ ...prev, [key]: workflow.steps.length - 1 }));
      } else {
        setAgentSteps((prev) => ({ ...prev, [key]: step }));
      }
    }, 2000);
  };

  const approveAgent = (crisisId: string) => {
    const agentId = agentAssignments[crisisId];
    if (!agentId) return;
    const key = `${agentId}-${crisisId}`;
    if (!approvalReasons[key]?.trim()) return;
    setApprovedAgents((prev) => new Set(prev).add(key));
  };

  const getDecisionLabel = (snap: DecisionSnapshot) => {
    const d = CRISIS_SCENARIO.decisions;
    const logOpt = d.logistics.options.find((o) => o.id === snap.logisticsChoice);
    const sacLabels = d.sacrifice.options
      .filter((o) => snap.sacrificeChoices.includes(o.id))
      .map((o) => o.label);
    const priOpt = d.priority.options.find((o) => o.id === snap.priorityChoice);
    return {
      inventory: `B2B ${snap.inventorySlider}% / B2C ${100 - snap.inventorySlider}%`,
      logistics: logOpt?.label || "—",
      sacrifice: sacLabels.join("; ") || "—",
      priority: priOpt?.label || "—",
    };
  };

  const generateDecisionSummary = () => {
    const snap = decisionSnapshot;
    if (!snap) return "";
    const labels = getDecisionLabel(snap);
    return [
      `Inventory split: ${labels.inventory}`,
      `Logistics route: ${labels.logistics}`,
      `Trade-offs: ${labels.sacrifice}`,
      `Customer priority: ${labels.priority}`,
    ].join("\n");
  };

  const generateSynthesis = () => {
    const parts: string[] = [];
    parts.push(`[Team initial decisions]\n${generateDecisionSummary()}`);
    parts.push("[Agent run reports]");
    crisisIds.forEach((crisisId) => {
      const agentId = agentAssignments[crisisId];
      const agent = CRISIS_AGENTS.find((a) => a.id === agentId);
      const workflow = agent?.workflows[crisisId];
      if (workflow) parts.push(workflow.output);
    });
    return parts.join("\n\n");
  };

  const handleLockDecisions = () => {
    setDecisionsLocked(true);
    setDecisionSnapshot({
      inventorySlider,
      logisticsChoice,
      sacrificeChoices: Array.from(sacrificeChoices),
      priorityChoice,
    });
    setPhase("dispatch");
  };

  const handleSubmit = () => {
    if (!team) return;
    setSubmitted(true);
    getSocket().emit("game3:submit", { teamId: team, finalAnswer: finalAnswer || generateSynthesis() });
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(CRISIS_SCENARIO.aiConsultant.clipboardPrompt);
    setClipboardCopied(true);
    setTimeout(() => setClipboardCopied(false), 2000);
  };

  // Decision-aware comment for an agent's output
  const getDecisionComment = (crisisId: string, agentId: string) => {
    if (!decisionSnapshot) return null;
    const agent = CRISIS_AGENTS.find((a) => a.id === agentId);
    const workflow = agent?.workflows[crisisId];
    if (!workflow?.decisionComments) return null;
    const comments: string[] = [];
    if (workflow.decisionComments[decisionSnapshot.logisticsChoice]) {
      comments.push(workflow.decisionComments[decisionSnapshot.logisticsChoice]);
    }
    for (const sc of decisionSnapshot.sacrificeChoices) {
      if (workflow.decisionComments[sc]) comments.push(workflow.decisionComments[sc]);
    }
    if (workflow.decisionComments[decisionSnapshot.priorityChoice]) {
      comments.push(workflow.decisionComments[decisionSnapshot.priorityChoice]);
    }
    return comments.length > 0 ? comments : null;
  };

  // Comparison data for Phase 3
  const agentRecommendations = useMemo(() => {
    if (!decisionSnapshot) return null;
    const recs: string[] = [];
    crisisIds.forEach((crisisId) => {
      const agentId = agentAssignments[crisisId];
      const agent = CRISIS_AGENTS.find((a) => a.id === agentId);
      const workflow = agent?.workflows[crisisId];
      if (workflow) {
        recs.push(workflow.output);
        const comments = getDecisionComment(crisisId, agentId!);
        if (comments) recs.push(...comments);
      }
    });
    return recs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, decisionSnapshot, agentAssignments]);

  return (
    <div className="space-y-6">
      <SubmitCelebration show={submitted} message="Crisis plan submitted!" />

      {/* War Room Header */}
      <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/60 via-gray-50/80 to-red-950/60 p-6">
        <div className="alert-pulse absolute inset-0 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-500 ring-1 ring-red-500/40 alert-badge">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              RED ALERT — S&OP
            </span>
            <span className="text-xs text-gray-400">{CRISIS_SCENARIO.date}</span>
          </div>
          <p className="text-gray-600 leading-relaxed text-sm">
            {CRISIS_SCENARIO.intro}
          </p>
        </div>
      </div>

      {/* Rules */}
      <div className="card-glass rounded-xl p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          How to play
        </p>
        <ul className="space-y-1">
          {CRISIS_SCENARIO.rules.map((r, i) => (
            <li key={i} className="text-sm text-gray-500 flex items-start gap-2">
              <span className="text-red-500 shrink-0">•</span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      <TeamStatusBar gameId={3} />

      {/* Scenario Toggle */}
      <button
        onClick={() => setScenarioExpanded(!scenarioExpanded)}
        className="w-full flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
      >
        <span>{scenarioExpanded ? "Collapse" : "Expand"} crisis panel & requirements</span>
        <span className={`transition-transform ${scenarioExpanded ? "rotate-180" : ""}`}>▼</span>
      </button>

      {scenarioExpanded && (
        <div className="space-y-5 animate-slide-up">
          {/* Crisis Events */}
          <div className="grid gap-3 md:grid-cols-3">
            {CRISIS_SCENARIO.events.map((evt) => (
              <div
                key={evt.id}
                className="rounded-xl border p-4 transition-all hover:scale-[1.02]"
                style={{ borderColor: `${evt.color}40`, background: `linear-gradient(135deg, ${evt.color}08, ${evt.color}03)` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{evt.icon}</span>
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: `${evt.color}20`, color: evt.color }}>
                    {evt.tag}
                  </span>
                </div>
                <h3 className="text-sm font-bold mb-1" style={{ color: evt.color }}>{evt.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{evt.description}</p>
              </div>
            ))}
          </div>

          {/* Data Dashboard */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-gray-50 border border-amber-500/10 p-4">
              <p className="text-xs font-bold text-amber-600 mb-2">📦 Available inventory</p>
              <div className="flex flex-wrap gap-2">
                {CRISIS_SCENARIO.inventory.map((inv) => (
                  <div key={inv.location} className="flex items-center gap-2 rounded-lg bg-white/50 px-3 py-2">
                    <span>{inv.icon}</span>
                    <div>
                      <p className="text-[11px] text-gray-400">{inv.location}</p>
                      <p className="text-sm font-bold text-amber-600">{inv.qty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 border border-green-500/10 p-4">
              <p className="text-xs font-bold text-green-600 mb-2">💰 {CRISIS_SCENARIO.financials.title}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {CRISIS_SCENARIO.financials.items.map((item) => (
                  <div key={item.label} className="flex justify-between text-[11px]">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="font-mono font-bold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 border border-yellow-500/10 p-4">
              <p className="text-xs font-bold text-yellow-600 mb-2">⏱ {CRISIS_SCENARIO.timeline.title}</p>
              <div className="space-y-1.5">
                {CRISIS_SCENARIO.timeline.items.map((item) => (
                  <div key={item.label} className="flex justify-between text-[11px]">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="font-mono font-bold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 border border-slate-500/10 p-4">
              <p className="text-xs font-bold text-slate-400 mb-2">👥 {CRISIS_SCENARIO.customerPriority.title}</p>
              <div className="space-y-2">
                {CRISIS_SCENARIO.customerPriority.items.map((item) => (
                  <div key={item.label} className="rounded-lg bg-white/50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-900">{item.label}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400">{item.priority}</span>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[11px] text-gray-500">{item.revenue}</span>
                      <span className="text-[11px] text-gray-400">{item.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dilemmas */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Impossible triangle — core tensions</p>
            <div className="grid gap-2 md:grid-cols-3">
              {CRISIS_SCENARIO.dilemmas.map((d, i) => (
                <div key={i} className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-3">
                  <p className="text-xs font-bold text-yellow-600 mb-1">⚡ {d.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{d.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Output Requirements */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Deliverable checklist (tick when covered)</p>
            <div className="flex flex-wrap gap-2">
              {CRISIS_SCENARIO.outputRequirements.map((req) => (
                <button
                  key={req.id}
                  onClick={() => setChecklist((prev) => ({ ...prev, [req.id]: !prev[req.id] }))}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-all ${
                    checklist[req.id]
                      ? "bg-green-500/10 border border-green-500/30 ring-1 ring-green-500/20"
                      : "bg-accent/5 border border-accent/20 hover:bg-accent/10"
                  }`}
                >
                  <span className={`flex items-center justify-center h-4 w-4 rounded border text-[11px] shrink-0 ${
                    checklist[req.id] ? "bg-green-500 border-green-500 text-white" : "border-black/[0.08]"
                  }`}>
                    {checklist[req.id] ? "✓" : ""}
                  </span>
                  <span>{req.icon}</span>
                  <div>
                    <p className={`text-xs font-bold ${checklist[req.id] ? "text-green-600" : "text-accent"}`}>{req.label}</p>
                    <p className="text-[11px] text-gray-400">{req.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Phase indicator */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {(["decision", "dispatch", "submit"] as const).map((p, i) => {
          const labels = ["① AI-assisted decisions", "② Agent orchestration", "③ Compare & submit"];
          const hints = [
            "Review data → ask the AI consultant → lock four key choices",
            "Assign Agents → approve outputs (with reasons) → resolve conflicts",
            "Compare your calls vs Agent analysis → reflect → submit",
          ];
          const active = phase === p;
          const done =
            (p === "decision" && phase !== "decision") ||
            (p === "dispatch" && phase === "submit") ||
            submitted;
          return (
            <div
              key={p}
              className={`rounded-xl px-3 py-2.5 transition-all ${
                done
                  ? "bg-green-500/10 border border-green-500/20"
                  : active
                    ? "bg-red-500/10 border border-red-500/30 ring-1 ring-red-500/20"
                    : "bg-black/[0.02] border border-black/[0.04]"
              }`}
            >
              <span className={`font-bold block ${done ? "text-green-600" : active ? "text-red-500" : "text-gray-400"}`}>
                {done ? "✓ " : ""}{labels[i]}
              </span>
              <span className={`text-[11px] block mt-0.5 leading-snug ${done ? "text-green-500/60" : active ? "text-gray-500" : "text-gray-700"}`}>
                {hints[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* ═══════ Phase 1: AI-Assisted Decision ═══════ */}
      {phase === "decision" && (
        <div className="space-y-5 animate-slide-up">
          <div className="card-glass rounded-2xl p-5">
            <h3 className="text-sm font-bold text-red-500 mb-1">Step 1: Read the data and decide</h3>
            <p className="text-xs text-gray-400">
              Study the crisis data; use the AI consultant to stress-test your thinking. Then align with your team on four key decisions.
              <strong className="text-gray-600"> Once locked, decisions cannot change</strong> — Agents will validate what you chose.
            </p>
          </div>

          {/* AI Consultant Panel */}
          <div className="rounded-2xl border border-cyber/20 bg-cyber/[0.03] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span className="text-sm font-bold text-cyber">AI consultant</span>
                <span className="text-[11px] text-gray-400">— analysis aid, not a decision-maker</span>
              </div>
              <button
                onClick={handleCopyClipboard}
                className="rounded-lg bg-cyber/10 px-3 py-1.5 text-[11px] font-bold text-cyber hover:bg-cyber/20 transition"
              >
                {clipboardCopied ? "✓ Copied" : "📋 Copy brief to Gemini"}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">{CRISIS_SCENARIO.aiConsultant.intro}</p>
            <div className="grid gap-2 md:grid-cols-2">
              {CRISIS_SCENARIO.aiConsultant.questions.map((q) => (
                <div key={q.id}>
                  <button
                    onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                    className={`w-full flex items-center gap-2 rounded-xl px-4 py-3 text-left transition-all ${
                      expandedQuestion === q.id
                        ? "bg-cyber/10 border border-cyber/30 ring-1 ring-cyber/20"
                        : "bg-gray-50 border border-black/[0.04] hover:bg-gray-50"
                    }`}
                  >
                    <span>{q.icon}</span>
                    <span className="text-xs font-bold text-gray-900">{q.label}</span>
                  </button>
                  {expandedQuestion === q.id && (
                    <div className="mt-2 rounded-xl bg-white/80 border border-cyber/10 p-4 animate-slide-up">
                      <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{q.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Inventory slider */}
          <div className="card-glass rounded-2xl p-5 space-y-3">
            <p className="text-xs font-bold text-gray-900">📦 {CRISIS_SCENARIO.decisions.inventoryAllocation.label}</p>
            <p className="text-[11px] text-gray-400">{CRISIS_SCENARIO.decisions.inventoryAllocation.description}</p>
            <input type="range" min={0} max={100} step={5} value={inventorySlider}
              onChange={(e) => setInventorySlider(Number(e.target.value))} className="w-full accent-red-500" />
            <div className="flex justify-between text-[11px]">
              <span className="text-red-500">B2B: {inventorySlider}%</span>
              <span className="text-amber-600">B2C: {100 - inventorySlider}%</span>
            </div>
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>{CRISIS_SCENARIO.decisions.inventoryAllocation.leftLabel}</span>
              <span>{CRISIS_SCENARIO.decisions.inventoryAllocation.rightLabel}</span>
            </div>
          </div>

          {/* Logistics radio */}
          <div className="card-glass rounded-2xl p-5 space-y-3">
            <p className="text-xs font-bold text-gray-900">🚢 {CRISIS_SCENARIO.decisions.logistics.label}</p>
            <p className="text-[11px] text-gray-400">{CRISIS_SCENARIO.decisions.logistics.description}</p>
            <div className="space-y-2">
              {CRISIS_SCENARIO.decisions.logistics.options.map((opt) => (
                <label key={opt.id} className={`flex items-start gap-3 rounded-xl p-3 cursor-pointer transition-all ${
                  logisticsChoice === opt.id ? "bg-red-500/10 border border-red-500/30" : "bg-gray-50 border border-black/[0.04] hover:bg-gray-50"
                }`}>
                  <input type="radio" name="logistics" value={opt.id} checked={logisticsChoice === opt.id}
                    onChange={() => setLogisticsChoice(opt.id)} className="mt-1 accent-red-500" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">{opt.label}</p>
                    <p className="text-[11px] text-gray-400">{opt.note}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Sacrifice checkboxes */}
          <div className="card-glass rounded-2xl p-5 space-y-3">
            <p className="text-xs font-bold text-gray-900">⚖️ {CRISIS_SCENARIO.decisions.sacrifice.label}</p>
            <p className="text-[11px] text-gray-400">{CRISIS_SCENARIO.decisions.sacrifice.description}</p>
            <div className="space-y-2">
              {CRISIS_SCENARIO.decisions.sacrifice.options.map((opt) => (
                <label key={opt.id} className={`flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-all ${
                  sacrificeChoices.has(opt.id) ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-gray-50 border border-black/[0.04] hover:bg-gray-50"
                }`}>
                  <input type="checkbox" checked={sacrificeChoices.has(opt.id)}
                    onChange={() => setSacrificeChoices((prev) => { const next = new Set(prev); next.has(opt.id) ? next.delete(opt.id) : next.add(opt.id); return next; })}
                    className="accent-yellow-500" />
                  <span className="text-xs text-gray-900">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority radio */}
          <div className="card-glass rounded-2xl p-5 space-y-3">
            <p className="text-xs font-bold text-gray-900">👥 {CRISIS_SCENARIO.decisions.priority.label}</p>
            <p className="text-[11px] text-gray-400">{CRISIS_SCENARIO.decisions.priority.description}</p>
            <div className="space-y-2">
              {CRISIS_SCENARIO.decisions.priority.options.map((opt) => (
                <label key={opt.id} className={`flex items-start gap-3 rounded-xl p-3 cursor-pointer transition-all ${
                  priorityChoice === opt.id ? "bg-slate-500/10 border border-slate-500/30" : "bg-gray-50 border border-black/[0.04] hover:bg-gray-50"
                }`}>
                  <input type="radio" name="priority" value={opt.id} checked={priorityChoice === opt.id}
                    onChange={() => setPriorityChoice(opt.id)} className="mt-1 accent-slate-500" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">{opt.label}</p>
                    <p className="text-[11px] text-gray-400">{opt.note}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Lock decisions */}
          <button
            onClick={handleLockDecisions}
            disabled={!decisionComplete}
            className="w-full rounded-xl bg-red-600 px-4 py-4 font-bold text-white hover:bg-red-500 disabled:opacity-35 text-sm"
          >
            {decisionComplete ? "🔒 Lock decisions → Agent orchestration" : "Complete all decision fields"}
          </button>
        </div>
      )}

      {/* ═══════ Phase 2: Agent Dispatch & Verification ═══════ */}
      {phase === "dispatch" && !submitted && (
        <div className="space-y-6 animate-slide-up">
          {/* Locked decision snapshot */}
          {decisionSnapshot && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">🔒</span>
                <span className="text-xs font-bold text-amber-600">Your locked decision snapshot</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {Object.entries(getDecisionLabel(decisionSnapshot)).map(([key, val]) => (
                  <div key={key} className="rounded-lg bg-white/50 px-3 py-2">
                    <span className="text-gray-400">{key === "inventory" ? "Inventory" : key === "logistics" ? "Logistics" : key === "sacrifice" ? "Trade-offs" : "Priority"}</span>
                    <p className="text-gray-900 font-bold mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card-glass rounded-2xl p-5">
            <h3 className="text-sm font-bold text-accent mb-1">Step 2: Orchestrate Agents to validate</h3>
            <p className="text-xs text-gray-400">
              You are not only prompting — you are orchestrating. Assign one specialist Agent to each crisis thread.
              <strong className="text-gray-600"> Each Agent reasons from your locked decisions — they may disagree. Approve with a clear rationale.</strong>
            </p>
          </div>

          {/* Agent Pool */}
          <div className="card-glass rounded-2xl p-5 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Available Agents</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {CRISIS_AGENTS.map((agent) => (
                <div key={agent.id} className="rounded-xl p-4"
                  style={{ backgroundColor: `${agent.color}08`, border: `1px solid ${agent.color}25` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{agent.icon}</span>
                    <span className="text-sm font-bold text-gray-900">{agent.name}</span>
                  </div>
                  <p className="text-[11px] text-gray-500">{agent.specialty}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Crisis Lines + Agent Assignment */}
          <div className="space-y-4">
            {CRISIS_SCENARIO.events.map((evt) => {
              const assignedId = agentAssignments[evt.id];
              const agent = CRISIS_AGENTS.find((a) => a.id === assignedId);
              const key = assignedId ? `${assignedId}-${evt.id}` : "";
              const isRunning = runningAgents.has(key);
              const isComplete = completedAgents.has(key);
              const isApproved = approvedAgents.has(key);
              const workflow = agent?.workflows[evt.id];
              const currentStepIdx = agentSteps[key] ?? -1;
              const decisionComments = assignedId ? getDecisionComment(evt.id, assignedId) : null;

              return (
                <div key={evt.id} className="rounded-2xl border p-5 space-y-3 transition-all"
                  style={{ borderColor: `${evt.color}30`, background: `linear-gradient(135deg, ${evt.color}05, transparent)` }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{evt.icon}</span>
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: `${evt.color}20`, color: evt.color }}>
                      {evt.tag}
                    </span>
                    <span className="text-xs text-gray-500 flex-1">{evt.description.slice(0, 60)}...</span>
                  </div>

                  {/* Agent Selector */}
                  {!assignedId && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-gray-400 self-center mr-1">Assign Agent →</span>
                      {CRISIS_AGENTS.map((a) => (
                        <button key={a.id} onClick={() => assignAgent(evt.id, a.id)}
                          className="rounded-lg px-3 py-2 text-xs font-bold transition-all hover:scale-105"
                          style={{ backgroundColor: `${a.color}15`, border: `1px solid ${a.color}30`, color: a.color }}>
                          {a.icon} {a.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Assigned Agent */}
                  {assignedId && agent && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{agent.icon}</span>
                          <span className="text-xs font-bold" style={{ color: agent.color }}>{agent.name}</span>
                          {isApproved && <span className="text-[11px] text-green-600">✓ Approved</span>}
                        </div>
                        {!isRunning && !isComplete && (
                          <button onClick={() => runAgent(evt.id)}
                            className="rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                            style={{ backgroundColor: agent.color }}>
                            ▶ Run Agent
                          </button>
                        )}
                        {isRunning && (
                          <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: agent.color }}>
                            <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: agent.color }} />
                            Running…
                          </span>
                        )}
                      </div>

                      {/* Workflow Steps */}
                      {(isRunning || isComplete) && workflow && (
                        <div className="space-y-1.5">
                          {workflow.steps.slice(0, currentStepIdx + 1).map((step, si) => {
                            const isLatestStep = si === currentStepIdx && isRunning;
                            return (
                              <div key={si} className={`rounded-lg border px-3 py-2 transition-all duration-500 ${isLatestStep ? "border-accent/30 bg-accent/[0.04] animate-slide-up" : "border-black/[0.04] bg-black/[0.02] opacity-60"}`}>
                                <div className="flex items-center gap-2 text-[11px]">
                                  <span className="text-accent font-bold">{step.action}</span>
                                  <span className="text-gray-400">·</span>
                                  <span className="text-gray-400">{step.duration}</span>
                                </div>
                                <code className="text-[11px] text-gray-500 block mt-0.5">{step.detail}</code>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Agent Output + Decision-aware comments */}
                      {isComplete && workflow && (
                        <div className="space-y-2 animate-slide-up">
                          <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-4">
                            <p className="text-xs text-green-600 font-bold mb-1">Agent output</p>
                            <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{workflow.output}</p>
                          </div>

                          {/* Decision-aware comments */}
                          {decisionComments && (
                            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
                              <p className="text-[11px] font-bold text-amber-600 mb-1">📌 Given your decisions</p>
                              {decisionComments.map((c, ci) => (
                                <p key={ci} className="text-[11px] text-gray-600 leading-relaxed">{c}</p>
                              ))}
                            </div>
                          )}

                          {/* Conflict note */}
                          {workflow.conflictNote && (
                            <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3">
                              <p className="text-[11px] text-red-500 leading-relaxed">{workflow.conflictNote}</p>
                            </div>
                          )}

                          {/* Approval with reason */}
                          {!isApproved && (
                            <div className="space-y-2">
                              <textarea
                                placeholder="Approval note: why do you accept this output? What new signal did it give you?"
                                value={approvalReasons[key] || ""}
                                onChange={(e) => setApprovalReasons((prev) => ({ ...prev, [key]: e.target.value }))}
                                rows={2}
                                className="w-full rounded-lg bg-white border border-black/[0.06] px-3 py-2 text-xs text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-green-500/50"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => approveAgent(evt.id)}
                                  disabled={!approvalReasons[key]?.trim()}
                                  className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-500 transition disabled:opacity-35"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setAgentAssignments((p) => { const n = { ...p }; delete n[evt.id]; return n; });
                                    setCompletedAgents((p) => { const s = new Set(p); s.delete(key); return s; });
                                    setApprovalReasons((p) => { const n = { ...p }; delete n[key]; return n; });
                                  }}
                                  className="rounded-lg bg-black/[0.03] px-3 py-2 text-xs text-gray-500 hover:bg-black/[0.05] transition"
                                >
                                  Reassign
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress to synthesis */}
          {allAgentsApproved && (
            <button onClick={() => setPhase("submit")}
              className="w-full rounded-xl bg-green-600 px-4 py-4 font-bold text-white hover:bg-green-500 transition text-sm animate-slide-up">
              All Agents approved → compare & finalize
            </button>
          )}
        </div>
      )}

      {/* ═══════ Phase 3: Comparison & Submit ═══════ */}
      {phase === "submit" && (
        <div className="space-y-6 animate-slide-up">
          {!submitted ? (
            <>
              <div className="card-glass rounded-2xl p-5">
                <h3 className="text-sm font-bold text-green-600 mb-1">Step 3: Compare, reflect, submit</h3>
                <p className="text-xs text-gray-400">
                  Contrast your initial decisions with each Agent’s read. Ask: <strong className="text-gray-600">What actually changed? New facts, or just a slicker narrative?</strong>
                </p>
              </div>

              {/* Side-by-side comparison */}
              {decisionSnapshot && (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Your decisions */}
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-5">
                    <p className="text-xs font-bold text-amber-600 mb-3">🧠 Your initial decisions</p>
                    <div className="space-y-2">
                      {Object.entries(getDecisionLabel(decisionSnapshot)).map(([key, val]) => (
                        <div key={key} className="rounded-lg bg-white/50 px-3 py-2">
                          <span className="text-[11px] text-gray-400">{key === "inventory" ? "📦 Inventory" : key === "logistics" ? "🚢 Logistics" : key === "sacrifice" ? "⚖️ Trade-offs" : "👥 Priority"}</span>
                          <p className="text-xs text-gray-900 font-bold mt-0.5">{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Agent conclusions */}
                  <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.03] p-5">
                    <p className="text-xs font-bold text-green-600 mb-3">🤖 Agent takeaways</p>
                    <div className="space-y-2">
                      {crisisIds.map((crisisId) => {
                        const agentId = agentAssignments[crisisId];
                        const agent = CRISIS_AGENTS.find((a) => a.id === agentId);
                        const workflow = agent?.workflows[crisisId];
                        const evt = CRISIS_SCENARIO.events.find((e) => e.id === crisisId);
                        if (!workflow || !evt) return null;
                        return (
                          <div key={crisisId} className="rounded-lg bg-white/50 px-3 py-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[11px]">{agent?.icon}</span>
                              <span className="text-[11px] text-gray-400">→ {evt.tag}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 leading-relaxed">{workflow.output}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Reflection prompt */}
              <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
                <p className="text-xs font-bold text-accent mb-2">🪞 Reflection prompts</p>
                <ul className="space-y-1.5 text-xs text-gray-500">
                  <li className="flex items-start gap-2">
                    <span className="text-accent shrink-0">•</span>
                    <span>Did any Agent make you want to <strong className="text-gray-900">change</strong> your initial call?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent shrink-0">•</span>
                    <span>If yes — was it <strong className="text-gray-900">new data you did not have</strong>, or mainly <strong className="text-gray-900">more polished wording</strong>?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent shrink-0">•</span>
                    <span>How did you reconcile <strong className="text-gray-900">conflicting Agent views</strong>?</span>
                  </li>
                </ul>
              </div>

              {/* Agent synthesis */}
              <div className="rounded-2xl border border-accent/20 bg-gray-50 p-5 space-y-3">
                <p className="text-xs font-bold text-accent uppercase tracking-wider">Agent bundle</p>
                {crisisIds.map((crisisId) => {
                  const agentId = agentAssignments[crisisId];
                  const agent = CRISIS_AGENTS.find((a) => a.id === agentId);
                  const workflow = agent?.workflows[crisisId];
                  const evt = CRISIS_SCENARIO.events.find((e) => e.id === crisisId);
                  if (!workflow || !evt) return null;
                  return (
                    <div key={crisisId} className="rounded-xl bg-black/[0.02] border border-black/[0.04] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{agent?.icon}</span>
                        <span className="text-xs font-bold text-gray-900">{agent?.name}</span>
                        <span className="text-[11px] text-gray-400">→ {evt.tag}</span>
                      </div>
                      <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{workflow.output}</p>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5 space-y-3">
                <p className="text-xs font-bold text-green-600">📋 Final S&OP response</p>
                <p className="text-[11px] text-gray-400">Edit the Agent bundle below and add your own judgment:</p>
                <textarea
                  value={finalAnswer || generateSynthesis()}
                  onChange={(e) => setFinalAnswer(e.target.value)}
                  rows={10}
                  className="w-full rounded-xl bg-white border border-green-500/20 px-4 py-3 text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
                {(() => {
                  const total = CRISIS_SCENARIO.outputRequirements.length;
                  const checked = CRISIS_SCENARIO.outputRequirements.filter((r) => checklist[r.id]).length;
                  const allChecked = checked === total;
                  return (
                    <>
                      {!allChecked && (
                        <p className="text-[11px] text-yellow-600 flex items-center gap-1">
                          ⚠ {total - checked} checklist item(s) still unchecked — confirm coverage before submission
                        </p>
                      )}
                      <button onClick={handleSubmit}
                        className="w-full rounded-xl bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-500 transition">
                        🏁 Submit final plan{allChecked ? "" : ` (${checked}/${total} checklist)`}
                      </button>
                    </>
                  );
                })()}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-8 text-center">
                <p className="text-3xl mb-3">✅</p>
                <p className="text-green-600 font-bold text-lg">Plan submitted</p>
                <p className="text-sm text-gray-400 mt-2">Prep your 2-minute elevator pitch</p>
              </div>
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
                <p className="text-xs font-bold text-accent mb-2">🎤 Pitch checklist</p>
                <ul className="space-y-2 text-xs text-gray-500">
                  <li className="flex items-start gap-2">
                    <span className="text-accent shrink-0 mt-0.5">1.</span>
                    <span>What were your <strong className="text-gray-900">initial decisions</strong>? What did the AI consultant shift?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent shrink-0 mt-0.5">2.</span>
                    <span>Show how you <strong className="text-gray-900">orchestrated three Agents</strong> — how did you resolve conflicts?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent shrink-0 mt-0.5">3.</span>
                    <span>How does the <strong className="text-gray-900">final plan differ</strong> from your first take? Why?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent shrink-0 mt-0.5">4.</span>
                    <span>Time box: <strong className="text-gray-900">2 minutes</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {submitted && <StageRecap stageId={3} />}
    </div>
  );
}
