"use client";

import { useState } from "react";

export interface RecapItem {
  icon: string;
  title: string;
  detail: string;
}

const STAGE_RECAPS: Record<number, RecapItem[]> = {
  1: [
    {
      icon: "🎯",
      title: "Prompt quality drives output quality",
      detail:
        "Clearer context, constraints, and format → sharper answers. Vague asks get vague replies.",
    },
    {
      icon: "🔧",
      title: "CCF: Context + Constraints + Format",
      detail:
        "Three beats: set the scene (who/what), draw boundaries (budget/time/priority), demand a shape (table/steps/compare).",
    },
    {
      icon: "💡",
      title: "AI is a tool — judgment is yours",
      detail:
        "AI can analyze fast and draft options, but trade-offs (who to protect, what to cut, how much to spend) stay human.",
    },
  ],
  2: [
    {
      icon: "🏗️",
      title: "AI is architecture, not magic",
      detail:
        "Data (HANA) → connector (MCP) → reasoning (LLM) → execution (Agent). Skip a layer and the loop breaks.",
    },
    {
      icon: "🔌",
      title: "MCP bridges AI to enterprise systems",
      detail:
        "Without a standard interface, AI can’t safely read/write business data — it stays in chat-only mode.",
    },
    {
      icon: "📊",
      title: "Clean Core is the prerequisite",
      detail:
        "Even smart models fail on dirty, incomplete data. Data quality is always step zero.",
    },
  ],
  3: [
    {
      icon: "⚡",
      title: "AI speeds decisions — it doesn’t replace them",
      detail:
        "In crisis, AI can scan data and propose plans in seconds, but “customers vs margin” calls stay with people.",
    },
    {
      icon: "🎯",
      title: "Complex scenes need structured prompts",
      detail:
        "When three fires burn at once, “fix everything” fails — assign roles, priorities, and steps to steer the model.",
    },
    {
      icon: "🤝",
      title: "Best human–AI split",
      detail:
        "Let AI crunch numbers, draft plans, and quantify risk; humans own values, relationships, and strategic bets.",
    },
  ],
  4: [
    {
      icon: "💰",
      title: "Not every AI bet is worth funding",
      detail:
        "Pick projects by time-to-value, data readiness, team fit, and ROI — not just how cool the tech looks.",
    },
    {
      icon: "⚖️",
      title: "Quick Win + Strategic Bet",
      detail:
        "Fund cheap fast wins to build muscle while you stage longer bets. Don’t spray budget across every idea.",
    },
    {
      icon: "🚀",
      title: "Start with data",
      detail:
        "Every AI program begins with flows, cleanliness, and interfaces. Great models on bad data still fail.",
    },
  ],
};

export default function StageRecap({ stageId }: { stageId: number }) {
  const [expanded, setExpanded] = useState(true);
  const items = STAGE_RECAPS[stageId] || [];

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 animate-slide-up">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
          <span>📝</span> Stage recap
        </h3>
        <span
          className={`text-emerald-400 text-xs transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl bg-gray-50 border border-black/[0.04] p-3"
            >
              <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
              <div>
                <p className="text-xs font-bold text-gray-900 mb-0.5">
                  {item.title}
                </p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
