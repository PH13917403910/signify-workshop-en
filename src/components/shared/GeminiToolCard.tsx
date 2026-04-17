"use client";

import { useState } from "react";

const WORKFLOW_STEPS = [
  { step: "1", label: "Open Gemini with the button below", icon: "🔗" },
  { step: "2", label: "Type your Prompt in the input box", icon: "✍️" },
  { step: "3", label: "Press Enter and wait for the reply", icon: "⏳" },
  { step: "4", label: "Copy the reply and paste it back here", icon: "📋" },
  { step: "5", label: "Save the attempt, tune the Prompt, retry", icon: "🔄" },
];

export default function GeminiToolCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl card-glass border border-black/[0.06] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              AI tool: Google Gemini
            </h3>
            <p className="text-[11px] text-gray-400">
              Prompt = the instructions you give the model — like briefing a sharp new hire
            </p>
          </div>
        </div>
        <a
          href="https://gemini.google.com/app"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-xl bg-black/[0.05] border border-black/[0.06] px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-black/[0.08] transition-all hover:scale-105"
        >
          Open Gemini →
        </a>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[11px] text-gray-500 hover:text-gray-600 transition flex items-center gap-1"
      >
        {expanded ? "Hide" : "Show"} workflow
        <span
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <div className="mt-3 flex flex-wrap gap-2 animate-slide-up">
          {WORKFLOW_STEPS.map((s) => (
            <div
              key={s.step}
              className="flex items-center gap-2 rounded-lg bg-gray-50 border border-black/[0.04] px-3 py-2"
            >
              <span className="text-xs">{s.icon}</span>
              <span className="text-[11px] text-gray-600">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
