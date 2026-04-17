"use client";

import { useState, useEffect } from "react";
import { getSocket } from "@/lib/socket-client";
import { useTeam } from "@/hooks/useTeam";
import { GAME1_SCENARIO } from "@/lib/workshop-data";
import GeminiToolCard from "@/components/shared/GeminiToolCard";
import StageRecap from "@/components/shared/StageRecap";
import TeamStatusBar from "@/components/shared/TeamStatusBar";
import SubmitCelebration from "@/components/shared/SubmitCelebration";

const MAX_ATTEMPTS = 3;

function checkCCF(text: string) {
  const t = text;
  return {
    context:
      /context|background|company|role|situation|supply chain|as (a|the)|who i am|facing|currently|lumitech|responsible for/i.test(
        t,
      ),
    constraints:
      /constraint|constraints|budget|deadline|within|priority|must not|must|should not|limit|cost cap|days?|weeks?|no more than|sla|red line|cannot exceed|non-negotiable/i.test(
        t,
      ),
    format:
      /format|table|steps|compare|comparison|bullet|list|gantt|structured|output|report|markdown|email template|numbered/i.test(
        t,
      ),
  };
}

export default function PromptChallenge() {
  const { team } = useTeam();
  const [attempts, setAttempts] = useState<{ prompt: string; response: string }[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [currentResponse, setCurrentResponse] = useState("");
  const [finalAnswer, setFinalAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showTips, setShowTips] = useState(true);
  const [showBriefing, setShowBriefing] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmEmptyResponse, setConfirmEmptyResponse] = useState(false);
  const [showReflection, setShowReflection] = useState(false);

  // Restore game state on mount (handles page refresh)
  useEffect(() => {
    if (!team) return;
    getSocket().emit(
      "game:getData",
      { teamId: team, gameId: 1 },
      (data: { prompts?: string[]; responses?: string[]; finalAnswer?: string; submitted?: boolean } | null) => {
        if (!data) return;
        if (data.submitted) {
          setSubmitted(true);
          if (data.finalAnswer) setFinalAnswer(data.finalAnswer);
        }
        if (data.prompts?.length) {
          const restored = data.prompts.map((p, i) => ({
            prompt: p || "",
            response: data.responses?.[i] || "",
          }));
          setAttempts(restored);
          setActiveTab(restored.length - 1);
        }
      },
    );
  }, [team]);

  const attemptsUsed = attempts.length;
  const canAttempt = attemptsUsed < MAX_ATTEMPTS && !submitted;
  const ccf = checkCCF(currentPrompt);
  const ccfScore = [ccf.context, ccf.constraints, ccf.format].filter(Boolean).length;

  const handleSaveAttempt = () => {
    if (!currentPrompt.trim() || !team) return;
    if (!currentResponse.trim() && !confirmEmptyResponse) {
      setConfirmEmptyResponse(true);
      return;
    }
    setConfirmEmptyResponse(false);
    const newAttempts = [
      ...attempts,
      { prompt: currentPrompt, response: currentResponse },
    ];
    setAttempts(newAttempts);
    setActiveTab(newAttempts.length - 1);
    setCurrentPrompt("");
    setCurrentResponse("");
    if (newAttempts.length < MAX_ATTEMPTS) {
      setShowReflection(true);
    }

    getSocket().emit("game1:savePrompt", {
      teamId: team,
      promptIndex: newAttempts.length - 1,
      prompt: currentPrompt,
      response: currentResponse,
    });
  };

  const handleSubmit = () => {
    if (!team) return;
    setSubmitted(true);
    setConfirmSubmit(false);
    getSocket().emit("game1:submit", { teamId: team, finalAnswer });
  };

  return (
    <div className="space-y-6">
      <SubmitCelebration show={submitted} message="Solution submitted!" />

      {/* Scenario Card */}
      <div className="card-glass rounded-2xl p-6 glow-accent">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-2xl">
            🚨
          </div>
          <div>
            <h2 className="text-xl font-black text-red-500 mb-2">
              {GAME1_SCENARIO.title}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {GAME1_SCENARIO.description}
            </p>
            <p className="text-gray-500 mt-3 text-sm font-medium">
              🎯 {GAME1_SCENARIO.task}
            </p>
          </div>
        </div>
      </div>

      {/* Briefing Data Panel — collapsed by default */}
      <button
        onClick={() => setShowBriefing(!showBriefing)}
        className="w-full flex items-center justify-between rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3 text-sm font-bold text-amber-600 hover:bg-amber-500/10 transition"
      >
        <span>📋 Business briefing (read before you write your prompt)</span>
        <span className={`transition-transform ${showBriefing ? "rotate-180" : ""}`}>▼</span>
      </button>
      {showBriefing && (
        <div className="grid gap-3 md:grid-cols-2 animate-slide-up">
          {/* Company */}
          <div className="rounded-xl bg-gray-50 border border-black/[0.04] p-4">
            <p className="text-xs font-bold text-gray-900 mb-2">🏢 {GAME1_SCENARIO.briefing.company.title}</p>
            <div className="space-y-1.5">
              {GAME1_SCENARIO.briefing.company.items.map((item) => (
                <div key={item.label} className="flex justify-between text-[11px]">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suppliers */}
          <div className="rounded-xl bg-gray-50 border border-red-500/10 p-4">
            <p className="text-xs font-bold text-red-500 mb-2">🏭 {GAME1_SCENARIO.briefing.suppliers.title}</p>
            <div className="space-y-2">
              {GAME1_SCENARIO.briefing.suppliers.items.map((s) => (
                <div key={s.name} className="rounded-lg bg-white/50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-900">{s.name}</span>
                    <span className="text-[9px] text-gray-500">{s.share}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">{s.component}</p>
                  <p className="text-[11px] mt-0.5">{s.status}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory */}
          <div className="rounded-xl bg-gray-50 border border-amber-500/10 p-4">
            <p className="text-xs font-bold text-amber-600 mb-2">📦 {GAME1_SCENARIO.briefing.inventory.title}</p>
            <div className="space-y-1.5">
              {GAME1_SCENARIO.briefing.inventory.items.map((item) => (
                <div key={item.label} className="flex justify-between text-[11px]">
                  <span className="text-gray-400">{item.label}</span>
                  <span className={`font-bold ${item.status === "warning" ? "text-yellow-600" : "text-gray-900"}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Constraints */}
          <div className="rounded-xl bg-gray-50 border border-yellow-500/10 p-4">
            <p className="text-xs font-bold text-yellow-600 mb-2">⚠ {GAME1_SCENARIO.briefing.constraints.title}</p>
            <ul className="space-y-1">
              {GAME1_SCENARIO.briefing.constraints.items.map((c, i) => (
                <li key={i} className="text-[11px] text-gray-500 flex items-start gap-1.5">
                  <span className="text-yellow-600 shrink-0 mt-0.5">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Rules — key context before diving in */}
      <div className="card-glass rounded-xl p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          How to play
        </p>
        <ul className="space-y-1">
          {GAME1_SCENARIO.rules.map((r, i) => (
            <li key={i} className="text-sm text-gray-500 flex items-start gap-2">
              <span className="text-accent shrink-0">•</span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      {/* Team status — visible before starting work */}
      <TeamStatusBar gameId={1} />

      {/* Gemini Tool Card */}
      <GeminiToolCard />

      {/* Prompt Engineering Tips */}
      <button
        onClick={() => setShowTips(!showTips)}
        className="w-full flex items-center justify-between rounded-xl bg-accent/5 border border-accent/20 px-4 py-3 text-sm font-bold text-accent hover:bg-accent/10 transition"
      >
        <span>💡 Prompt craft — CCF framework</span>
        <span className={`transition-transform ${showTips ? "rotate-180" : ""}`}>▼</span>
      </button>
      {showTips && (
        <div className="grid gap-3 md:grid-cols-3 animate-slide-up">
          <div className="rounded-xl bg-accent/5 border border-accent/20 p-4">
            <p className="text-xs font-bold text-accent mb-1">C — Context</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Say who you are, what the company is, and the exact situation you are in. Richer context yields sharper answers.
            </p>
          </div>
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
            <p className="text-xs font-bold text-amber-600 mb-1">C — Constraints</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Set limits: budget, time, priorities, and non‑negotiables. Clear constraints reduce generic or unsafe replies.
            </p>
          </div>
          <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-4">
            <p className="text-xs font-bold text-rose-400 mb-1">F — Format</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Say what shape you want: table, numbered steps, cost comparison, email template, etc.
            </p>
          </div>
        </div>
      )}

      {/* Attempt counter + step indicator */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full transition-all flex items-center justify-center text-[9px] font-bold ${
                i < attemptsUsed
                  ? "bg-accent text-white scale-110"
                  : i === attemptsUsed && canAttempt
                    ? "bg-accent/30 text-accent ring-2 ring-accent/40"
                    : "bg-gray-100 border border-black/[0.06] text-gray-400"
              }`}
            >
              {i + 1}
            </div>
          ))}
          <span className="text-sm text-gray-500 ml-1">
            {attemptsUsed}/{MAX_ATTEMPTS} attempts used
          </span>
        </div>
        {canAttempt && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className={currentPrompt.trim() ? "text-accent" : ""}>① Write prompt</span>
            <span>→</span>
            <span className={currentResponse.trim() ? "text-amber-600" : ""}>② Paste reply</span>
            <span>→</span>
            <span>③ Save</span>
          </div>
        )}
      </div>

      {/* Iteration Reflection Card */}
      {showReflection && canAttempt && (
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5 animate-slide-up space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-accent">🪞 Iterate</p>
            <button onClick={() => setShowReflection(false)} className="text-xs text-gray-400 hover:text-gray-500 transition">Close</button>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Look back at your last prompt and plan the next improvement:
          </p>
          <ul className="space-y-1.5 text-xs text-gray-600">
            <li className="flex items-start gap-2"><span className="text-accent shrink-0">C</span>Did you give enough context? Does the model understand your role and situation?</li>
            <li className="flex items-start gap-2"><span className="text-amber-600 shrink-0">C</span>Are constraints explicit (budget, time, priorities)?</li>
            <li className="flex items-start gap-2"><span className="text-rose-400 shrink-0">F</span>Did you specify format? Is the output structured and actionable?</li>
          </ul>
          <p className="text-[11px] text-gray-400 italic">This card hides when you start a new prompt</p>
        </div>
      )}

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input area */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Your prompt
          </h3>

          {canAttempt ? (
            <div className="space-y-3">
              <p className="text-[11px] text-gray-400">Example structure below — adapt as needed</p>
              <div>
                <textarea
                  value={currentPrompt}
                  onChange={(e) => { setCurrentPrompt(e.target.value); if (showReflection) setShowReflection(false); }}
                  placeholder={"As Lumitech supply chain lead, please help me...\n\nContext: ...\nConstraints: ...\nPlease respond in this format: ..."}
                  rows={7}
                  className="w-full rounded-xl bg-gray-50 border border-black/[0.06] px-4 py-3 text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-accent text-sm leading-relaxed"
                />
                <div className="flex items-center justify-between mt-1.5 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold transition-all ${ccf.context ? "bg-accent/20 text-accent" : "bg-black/[0.03] text-gray-400"}`}>
                      C {ccf.context ? "✓" : "·"} context
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold transition-all ${ccf.constraints ? "bg-amber-500/20 text-amber-600" : "bg-black/[0.03] text-gray-400"}`}>
                      C {ccf.constraints ? "✓" : "·"} constraints
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold transition-all ${ccf.format ? "bg-rose-500/20 text-rose-400" : "bg-black/[0.03] text-gray-400"}`}>
                      F {ccf.format ? "✓" : "·"} format
                    </span>
                  </div>
                  <span className={`text-[11px] font-medium ${ccfScore === 3 ? "text-green-600" : "text-gray-400"}`}>
                    {ccfScore === 3 ? "✓ CCF complete" : `${ccfScore}/3`}
                  </span>
                </div>
              </div>
              <textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="Paste the model reply here..."
                rows={8}
                className="w-full rounded-xl bg-gray-50 border border-black/[0.06] px-4 py-3 text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-cyber text-sm"
              />
              {confirmEmptyResponse ? (
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-2">
                  <p className="text-xs text-yellow-600">You have not pasted a reply yet. Save anyway?</p>
                  <div className="flex gap-2">
                    <button onClick={handleSaveAttempt} className="flex-1 rounded-lg bg-yellow-600 px-3 py-2 text-xs font-bold text-white hover:bg-yellow-500 transition">
                      Save anyway
                    </button>
                    <button onClick={() => setConfirmEmptyResponse(false)} className="rounded-lg bg-black/[0.03] px-3 py-2 text-xs text-gray-500 hover:bg-black/[0.05] transition">
                      Go back
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleSaveAttempt}
                  disabled={!currentPrompt.trim()}
                  className="w-full rounded-xl bg-accent px-4 py-3 font-bold text-white hover:bg-accent-light disabled:opacity-35"
                >
                  Save attempt {attemptsUsed + 1} ({MAX_ATTEMPTS - attemptsUsed - 1} left)
                </button>
              )}
            </div>
          ) : submitted ? (
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-6 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-green-600 font-bold">Solution submitted</p>
              <p className="text-sm text-gray-400 mt-1">Awaiting review…</p>
            </div>
          ) : (
            <div className="rounded-xl bg-accent/10 border border-accent/20 p-6 text-center">
              <p className="text-2xl mb-2">🎯</p>
              <p className="text-accent font-bold">All 3 attempts used</p>
              <p className="text-sm text-gray-500 mt-1">
                Submit your final solution below
              </p>
            </div>
          )}
        </div>

        {/* History + Final answer */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Attempts & final solution
          </h3>

          {attempts.length > 0 ? (
            <div>
              <div className="flex gap-1 mb-3">
                {attempts.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      activeTab === i
                        ? "bg-accent/20 text-accent"
                        : "text-gray-400 hover:bg-black/[0.03]"
                    }`}
                  >
                    Attempt {i + 1}
                  </button>
                ))}
              </div>
              <div className="rounded-xl bg-gray-50 p-4 space-y-3 max-h-80 overflow-y-auto">
                <div>
                  <p className="text-xs text-accent font-bold mb-1 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Your prompt:
                  </p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap bg-white/50 rounded-lg p-3">
                    {attempts[activeTab]?.prompt}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-amber-600 font-bold mb-1 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Model reply:
                  </p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap bg-white/50 rounded-lg p-3">
                    {attempts[activeTab]?.response || "(no reply pasted)"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-black/[0.06] p-8 text-center">
              <p className="text-gray-400 text-sm">After your first attempt, the log appears here</p>
            </div>
          )}

          {/* Final answer */}
          {attemptsUsed > 0 && !submitted && (
            <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <p className="text-xs font-bold text-green-600 mb-2">
                📋 Final solution
              </p>
              <p className="text-[11px] text-gray-400 mb-2">
                Synthesize your attempts into one answer and submit:
              </p>
              <textarea
                value={finalAnswer}
                onChange={(e) => setFinalAnswer(e.target.value)}
                placeholder="Write or paste your team’s final solution here…"
                rows={6}
                className="w-full rounded-xl bg-gray-50 border border-black/[0.06] px-4 py-3 text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
              {!confirmSubmit ? (
                <button
                  onClick={() => setConfirmSubmit(true)}
                  disabled={!finalAnswer.trim()}
                  className="mt-3 w-full rounded-xl bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-500 disabled:opacity-35"
                >
                  🏁 Submit final solution
                </button>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 rounded-xl bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-500 transition"
                  >
                    ✓ Confirm submit
                  </button>
                  <button
                    onClick={() => setConfirmSubmit(false)}
                    className="rounded-xl bg-black/[0.03] px-4 py-3 text-sm text-gray-500 hover:bg-black/[0.05] transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stage Recap - shows after submission */}
      {submitted && <StageRecap stageId={1} />}
    </div>
  );
}
