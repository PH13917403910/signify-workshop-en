"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAdmin, useWorkshopState } from "@/hooks/useSocket";
import { getSocket } from "@/lib/socket-client";
import { stages, sharkProjects, legoCards } from "@/lib/workshop-data";
import { TEAM_LABELS, type TeamId } from "@/lib/types";

const MODEL_ANSWERS: Record<
  number,
  { title: string; content: string; tips: string[] }
> = {
  1: {
    title: "Game 1 · Million-Dollar Prompt — model answer",
    content: `Role: You are Lumitech’s Chief Supply Chain Advisor.
Context: Overnight, a country adds 60% tariffs on our core components while our largest Tier-1 supplier’s port is on strike.
Goal: Deliver an executable restructuring plan within 24 hours.
Constraints:
  - Supplier switch certification ≤ 2 weeks
  - Inventory safety days ≥ 14
  - Total cost increase ≤ 15%
Output format:
  1. Alternate supplier recommendations (name, certification, lead time, unit price comparison table)
  2. Stock transfer plan (inter-region quantities + Gantt timeline)
  3. Cost impact (current vs new scenario, including tariff shock)`,
    tips: [
      "Give AI a crisp role (Chief Advisor), not a vague “help me analyze”.",
      "Quantify constraints (15%, 14 days, 2 weeks) so outputs stay bounded.",
      "Ask for tables + Gantt to avoid fluffy prose.",
    ],
  },
  2: {
    title: "Game 2 · AI Architecture LEGO — model answer",
    content: `Correct intelligent closed-loop:
SAP HANA → MCP “universal socket” → Large Language Model (LLM) → AI Agent

Data flow:
1. HANA detects inventory anomalies / order delays → event fires
2. MCP pulls structured data from HANA (stock, orders, customers)
3. LLM understands context and drafts actions (calming email, alternate shipment plan)
4. Agent executes (send email, adjust dates, trigger replenishment)

Why Excel & WeChat groups are distractors?
- Excel: manual steps block a real-time loop and invite errors
- WeChat: fragmented chat cannot be reliably read/executed by systems`,
    tips: [
      "Core loop: data → interface → reasoning → execution.",
      "HANA = trusted data, MCP = transport, LLM = judgment, Agent = action.",
      "AI adoption frees people from repetitive work—it doesn’t erase judgment.",
    ],
  },
  3: {
    title: "Game 3 · Crisis response — model playbook",
    content: `Recommended strategy: protect the B2B strategic deal + hybrid logistics + selective B2C sacrifice

Stock moves:
  - Shanghai hub → Middle East program: 12k units (0.3k air + 0.9k ocean priority)
  - Shanghai hub → EU warehouse top-up: 3k units (ocean)
  - EU hub → local B2C: keep 5k on hand

Logistics routing:
  - Emergency air 3k units (arrive ME before Sep 10, ~€45/unit)
  - Ocean 9k units via Cape route (+10 days, ETA Sep 25, ~€8/unit)
  - Extra logistics cost ~€125k (air premium)

Trade-offs:
  - APAC Aura retail downgrades to “pre-order”, accept 2–3 week stock-outs
  - Gross margin down ~2.5 pts this quarter
  - CEO exception budget for B2B air freight`,
    tips: [
      "Strong plans name what you will NOT save—don’t pretend to save everything.",
      "Hybrid air+ocean saves ~70% vs all-air while still hitting critical dates.",
      "Prompt quality drives plan quality—specific numbers and constraints beat vague asks.",
    ],
  },
  4: {
    title: "Game 4 · Investment prioritization — model framing",
    content: `Suggested Q1/Q2 portfolio:

Tier 1 (start now):
  🛡️ Supplier compliance auto-scan — 4 wks / €60K / low risk
     → small bet, fast signal, primes later data work
  📊 Smart reporting Copilot — 6 wks / €80K / low risk
     → immediate AI value for the whole team

Tier 2 (Q2):
  🤖 Real-time self-healing replenishment agent — 4–6 mo / €350K / medium risk
     → biggest core upside, needs Clean Core first

Park:
  🌐 End-to-end digital twin — big spend/long cycle; sequence after Quick Wins land`,
    tips: [
      "Sequence Quick Wins first to build confidence with proof, not slides.",
      "Don’t dilute across every idea—split focus is the #1 failure mode.",
      "Data quality gates everything: no Clean Core → Garbage In, Garbage Out.",
    ],
  },
};

interface GameData {
  prompts?: string[];
  responses?: string[];
  finalAnswer?: string;
  submitted?: boolean;
  cards?: { id: string; cardId: string; x: number; y: number }[];
  connections?: { id: string; from: string; to: string; label: string }[];
}

export default function AdminResultsPage() {
  const { state } = useWorkshopState();
  const admin = useAdmin();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeGame, setActiveGame] = useState(1);
  const [showModel, setShowModel] = useState<Record<number, boolean>>({});
  const [teamData, setTeamData] = useState<Record<string, Record<string, GameData>>>({});

  useEffect(() => {
    const socket = getSocket();

    // Fetch existing submissions on mount
    socket.emit("admin:getFullState", (fullState: Record<string, unknown> | null) => {
      if (!fullState) return;
      const teams = fullState.teams as Record<string, Record<string, unknown>> | undefined;
      if (!teams) return;
      const data: Record<string, Record<string, GameData>> = {};
      for (const [tid, team] of Object.entries(teams)) {
        data[tid] = {};
        if (team.game1) data[tid].game1 = team.game1 as GameData;
        if (team.game2) data[tid].game2 = team.game2 as GameData;
        if (team.game3) data[tid].game3 = team.game3 as GameData;
      }
      setTeamData(data);
    });

    const handlers = ["game1:update", "game2:update", "game3:update"];
    handlers.forEach((evt) => {
      socket.on(evt, ({ teamId, data }: { teamId: string; data: GameData }) => {
        setTeamData((prev) => ({
          ...prev,
          [teamId]: { ...prev[teamId], [evt.split(":")[0]]: data },
        }));
      });
    });

    socket.on("admin:stageReset", (stageId: number) => {
      const gameKey = `game${stageId}`;
      setTeamData((prev) => {
        const next = { ...prev };
        for (const tid of Object.keys(next)) {
          next[tid] = { ...next[tid] };
          delete next[tid][gameKey];
        }
        return next;
      });
    });

    socket.on("admin:allReset", () => setTeamData({}));

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
          <button onClick={handleLogin} className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 font-bold text-white hover:bg-accent-light transition">
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const model = MODEL_ANSWERS[activeGame];
  const gameKey = `game${activeGame}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-gray-900">Game submissions</h1>
          <Link href="/admin" className="rounded-lg bg-black/[0.03] px-3 py-1.5 text-xs text-gray-500 hover:bg-black/[0.04] transition">
            ← Console
          </Link>
        </div>
      </div>

      {/* Game tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {stages.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveGame(s.id)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              activeGame === s.id
                ? "bg-accent/20 text-accent ring-1 ring-accent/40"
                : "text-gray-500 bg-black/[0.03] hover:bg-black/[0.04]"
            }`}
          >
            {s.icon} Game {s.id}: {s.gameName}
          </button>
        ))}
      </div>

      {/* Team submissions */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
          Submissions by team
        </h2>

        {activeGame <= 3 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {(Object.keys(TEAM_LABELS) as TeamId[]).map((tid) => {
              const game = teamData[tid]?.[gameKey] as GameData | undefined;
              if (!game?.submitted && !game?.prompts?.length && !game?.cards?.length) {
                return (
                  <div key={tid} className="rounded-xl bg-gray-50 border border-black/[0.04] p-4">
                    <p className="text-sm font-bold text-gray-900 capitalize mb-1">{TEAM_LABELS[tid]}</p>
                    <p className="text-xs text-gray-400">Nothing submitted yet</p>
                  </div>
                );
              }

              if (activeGame === 2 && game?.cards) {
                return (
                  <div key={tid} className="rounded-xl bg-gray-50 border border-black/[0.04] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-gray-900 capitalize">{TEAM_LABELS[tid]}</p>
                      <span className={`text-xs ${game.submitted ? "text-green-600" : "text-yellow-600"}`}>
                        {game.submitted ? "✓ Submitted" : "Editing"}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-gray-500">
                        {game.cards.length} tiles, {game.connections?.length || 0} connections
                      </p>
                      {game.cards.map((c) => {
                        const card = legoCards.find((lc) => lc.id === c.cardId);
                        return card ? (
                          <span key={c.id} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs mr-1 mb-1" style={{ backgroundColor: `${card.color}20`, color: card.color }}>
                            {card.icon} {card.label}
                          </span>
                        ) : null;
                      })}
                      {game.connections && game.connections.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {game.connections.map((conn) => {
                            const from = game.cards?.find((c) => c.id === conn.from);
                            const to = game.cards?.find((c) => c.id === conn.to);
                            const fromCard = from ? legoCards.find((lc) => lc.id === from.cardId) : null;
                            const toCard = to ? legoCards.find((lc) => lc.id === to.cardId) : null;
                            return (
                              <p key={conn.id} className="text-[11px] text-gray-400">
                                {fromCard?.label || "?"} → {toCard?.label || "?"}{conn.label ? ` (${conn.label})` : ""}
                              </p>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div key={tid} className="rounded-xl bg-gray-50 border border-black/[0.04] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-900 capitalize">{TEAM_LABELS[tid]}</p>
                    <span className={`text-xs ${game?.submitted ? "text-green-600" : "text-yellow-600"}`}>
                      {game?.submitted ? "✓ Submitted" : `${game?.prompts?.length || 0}/3 prompts`}
                    </span>
                  </div>
                  {game?.prompts?.map((p, i) => (
                    <details key={i} className="mb-2 group">
                      <summary className="text-xs font-medium text-accent cursor-pointer hover:text-accent-light">
                        Prompt #{i + 1}
                      </summary>
                      <div className="mt-2 space-y-2 pl-3 border-l-2 border-black/[0.04]">
                        <div>
                          <p className="text-[11px] text-gray-400 mb-0.5">Prompt:</p>
                          <p className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-2 max-h-32 overflow-y-auto">{p}</p>
                        </div>
                        {game.responses?.[i] && (
                          <div>
                            <p className="text-[11px] text-gray-400 mb-0.5">AI reply:</p>
                            <p className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-2 max-h-32 overflow-y-auto">{game.responses[i]}</p>
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                  {game?.finalAnswer && (
                    <div className="mt-3 rounded-lg bg-green-500/5 border border-green-500/20 p-3">
                      <p className="text-[11px] text-green-600 font-bold mb-1">Final plan:</p>
                      <p className="text-xs text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto">{game.finalAnswer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Game 4 - Shark Tank results */
          <div className="card-glass rounded-2xl p-6">
            {(() => {
              const totals: Record<string, number> = {};
              for (const [pid, voters] of Object.entries(state.game4.allocations || {})) {
                totals[pid] = Object.values(voters as Record<string, number>).reduce((a, b) => a + b, 0);
              }
              const maxT = Math.max(1, ...Object.values(totals));
              const sorted = [...sharkProjects].sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0));
              const medals = ["🥇", "🥈", "🥉"];

              return (
                <div className="space-y-3">
                  {sorted.map((p, i) => {
                    const t = totals[p.id] || 0;
                    return (
                      <div key={p.id} className="flex items-center gap-4">
                        <span className="text-xl w-8 text-center">{i < 3 ? medals[i] : `${i + 1}`}</span>
                        <span className="text-lg">{p.icon}</span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-bold text-gray-900">{p.name}</span>
                            <span className="font-mono font-bold text-accent">{t}</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-700" style={{ width: `${(t / maxT) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Model Answer */}
      {model && (
        <div className="card-glass rounded-2xl p-6 border border-accent/20">
          <button
            onClick={() => setShowModel((p) => ({ ...p, [activeGame]: !p[activeGame] }))}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-sm font-bold text-accent uppercase tracking-wider">
              📖 {model.title}
            </h2>
            <span className={`text-xs text-accent transition-transform ${showModel[activeGame] ? "rotate-180" : ""}`}>▼</span>
          </button>

          {showModel[activeGame] && (
            <div className="mt-4 space-y-4 animate-slide-up">
              <pre className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-5 border border-black/[0.04]">
                {model.content}
              </pre>
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2">💡 Key takeaways:</p>
                <ul className="space-y-1.5">
                  {model.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-gray-500 flex items-start gap-2">
                      <span className="text-accent shrink-0 mt-0.5">{i + 1}.</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
