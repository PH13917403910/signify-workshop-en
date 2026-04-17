"use client";

import { useState } from "react";
import { AGENT_SIMULATION_STEPS, CHATBOT_COMPARISON } from "@/lib/workshop-data";

const TYPE_STYLES: Record<string, { bg: string; border: string; badge: string; badgeText: string }> = {
  receive:   { bg: "bg-black/[0.02]", border: "border-black/[0.06]",  badge: "bg-gray-500/20",   badgeText: "text-gray-500" },
  plan:      { bg: "bg-amber-500/[0.04]", border: "border-amber-500/20", badge: "bg-amber-500/20", badgeText: "text-amber-600" },
  tool_call: { bg: "bg-accent/[0.05]", border: "border-accent/20", badge: "bg-accent/20",     badgeText: "text-accent" },
  reasoning: { bg: "bg-rose-500/[0.04]", border: "border-rose-500/20", badge: "bg-rose-500/20", badgeText: "text-rose-400" },
  action:    { bg: "bg-accent/[0.05]", border: "border-accent/20", badge: "bg-accent/20",     badgeText: "text-accent" },
  report:    { bg: "bg-green-500/[0.04]", border: "border-green-500/20", badge: "bg-green-500/20", badgeText: "text-green-600" },
};

const TYPE_LABELS: Record<string, string> = {
  receive: "Receive", plan: "Plan", tool_call: "Tool call",
  reasoning: "Reason", action: "Act", report: "Report",
};

export default function AgentSimulator() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [started, setStarted] = useState(false);

  const steps = AGENT_SIMULATION_STEPS;
  const allDone = currentStep >= steps.length - 1;

  const advance = () => {
    if (!started) {
      setStarted(true);
      setCurrentStep(0);
    } else if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  return (
    <div className="card-glass rounded-2xl p-6 noise space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-bold text-accent uppercase tracking-wider font-display">
            Agent mode demo
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Same crisis — watch how Agentic AI handles it
          </p>
        </div>
        {started && (
          <span className="text-[11px] text-gray-400">
            Step {currentStep + 1} / {steps.length}
          </span>
        )}
      </div>

      {!started && (
        <div className="rounded-xl bg-black/[0.01] border border-black/[0.04] p-5 text-center space-y-3">
          <p className="text-gray-500 text-sm leading-relaxed">
            In <span className="text-gray-900 font-medium">chatbot mode</span> you wrote a Prompt, waited, and judged manually.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed">
            Now watch <span className="text-accent font-medium">Agentic AI</span> tackle the same crisis.
          </p>
          <button
            onClick={advance}
            className="mt-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white hover:brightness-110"
          >
            Start Agent →
          </button>
        </div>
      )}

      {started && (
        <div className="space-y-3">
          {steps.slice(0, currentStep + 1).map((step, i) => {
            const style = TYPE_STYLES[step.type] ?? TYPE_STYLES.receive;
            const isLatest = i === currentStep;
            return (
              <div
                key={i}
                className={`rounded-xl border p-4 transition-all duration-500 ${style.bg} ${style.border} ${isLatest ? "animate-slide-up" : "opacity-70"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{step.icon}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${style.badge} ${style.badgeText}`}>
                    {TYPE_LABELS[step.type]}
                  </span>
                  <span className="text-xs font-bold text-gray-900">{step.label}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 shrink-0 w-8">💭</span>
                    <p className="text-gray-500 italic leading-relaxed">{step.thinking}</p>
                  </div>

                  {step.toolCall && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 shrink-0 w-8">⚡</span>
                      <code className="text-accent/80 bg-accent/5 px-2 py-1 rounded-lg text-[11px] break-all block w-full">
                        {step.toolCall}
                      </code>
                    </div>
                  )}

                  {step.result && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 shrink-0 w-8">📦</span>
                      <pre className="text-gray-600 bg-gray-50 px-3 py-2 rounded-lg text-[11px] whitespace-pre-wrap break-all w-full overflow-x-auto">
                        {step.result}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {!allDone && (
            <button
              onClick={advance}
              className="w-full rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-bold text-accent hover:bg-accent/20"
            >
              Next → {steps[currentStep + 1]?.label}
            </button>
          )}

          {allDone && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 space-y-4 animate-slide-up">
              <h3 className="text-sm font-bold text-accent font-display">
                Chatbot vs Agent
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg bg-black/[0.01] border border-black/[0.04] p-4">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Chatbot mode</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{CHATBOT_COMPARISON.chatbotResult}</p>
                </div>
                <div className="rounded-lg bg-accent/5 border border-accent/20 p-4">
                  <p className="text-[11px] font-bold text-accent uppercase tracking-wider mb-2">Agent mode</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{CHATBOT_COMPARISON.agentResult}</p>
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                <p className="text-xs text-gray-900 font-bold">Core difference</p>
                <p className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">{CHATBOT_COMPARISON.keyDifference}</p>
              </div>
              <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-4">
                <p className="text-xs text-amber-600 font-bold mb-1">💡 Your new role</p>
                <p className="text-xs text-gray-500 leading-relaxed">{CHATBOT_COMPARISON.humanRole}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
