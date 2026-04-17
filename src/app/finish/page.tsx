"use client";

import { useState } from "react";
import Link from "next/link";
import ScrollReveal from "@/components/shared/ScrollReveal";
import WarmUpQuiz from "@/components/shared/WarmUpQuiz";
import { completionQuiz } from "@/lib/workshop-data";
import EmailCollection from "@/components/finish/EmailCollection";

const TAKEAWAYS = [
  {
    stage: "Stage 1",
    icon: "🎯",
    title: "The power of Prompts",
    detail: "Use the CCF framework (Context + Constraints + Format) to write high-quality AI instructions",
  },
  {
    stage: "Stage 2",
    icon: "🏗️",
    title: "AI technical architecture",
    detail: "Understand the four layers HANA → MCP → LLM → Agent and how AI connects to enterprise data",
  },
  {
    stage: "Stage 3",
    icon: "⚡",
    title: "Human–AI collaborative decisions",
    detail: "In crisis scenarios, AI analyzes — humans decide",
  },
  {
    stage: "Stage 4",
    icon: "💰",
    title: "AI investment evaluation",
    detail: "Prioritize AI initiatives by time-to-value, data readiness, and ROI",
  },
];

const NEXT_STEPS = [
  "Back at work, pick one repetitive task and try completing it with AI help",
  "Share today’s Prompt tips with teammates",
  "Review data quality in your domain — it’s the starting point for every AI project",
  "Talk to IT: can our systems plug into AI safely and effectively?",
  "Keep an AI decision log: each time AI assists, note your decision, AI’s suggestion, what you chose, and the outcome — the fastest way to improve human–AI collaboration",
];

const QUICK_ACTIONS = [
  "Use CCF to improve a routine report prompt",
  "Map data quality in my area",
  "Share today’s human–AI collaboration patterns with the team",
];

export default function FinishPage() {
  const [commitment, setCommitment] = useState("");
  const [committed, setCommitted] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <section className="text-center animate-fade-in-blur">
        <div className="text-6xl mb-4">🎓</div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 font-display tracking-tight">
          Congratulations — workshop complete!
        </h1>
        <p className="text-gray-500 text-lg">
          You’ve completed all 4 stages of the Signify Supply Chain AI Workshop
        </p>
      </section>

      <ScrollReveal>
        <section className="card-glass rounded-2xl p-6">
          <h2 className="text-sm font-bold text-accent uppercase tracking-wider mb-4 font-display">
            Today’s takeaways
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {TAKEAWAYS.map((t, i) => (
              <ScrollReveal key={t.stage} delay={i * 80}>
                <div className="rounded-xl bg-gray-50 border border-black/[0.04] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{t.icon}</span>
                    <span className="text-[11px] text-gray-400 font-mono font-display">
                      {t.stage}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1 font-display">{t.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {t.detail}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={80}>
        <section className="card-glass rounded-2xl p-6 border-l-4 border-accent/30">
          <h2 className="text-sm font-bold text-accent uppercase tracking-wider mb-4 font-display">
            Completion quiz
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Quick recap of all 4 stages — how much stuck?
          </p>
          <WarmUpQuiz questions={completionQuiz} />
        </section>
      </ScrollReveal>

      <ScrollReveal delay={120}>
        <section className="card-glass rounded-2xl p-6 border-l-4 border-accent/30">
          <h2 className="text-sm font-bold text-accent uppercase tracking-wider mb-3 font-display">
            My first step
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            What’s the first AI-related thing you’ll do when you’re back at work?
          </p>

          {!committed ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action}
                    onClick={() => setCommitment(action)}
                    className={`rounded-lg px-3 py-2 text-xs transition-all ${
                      commitment === action
                        ? "bg-accent/10 border border-accent/30 text-accent"
                        : "bg-black/[0.03] border border-black/[0.04] text-gray-500 hover:bg-black/[0.05]"
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
              <textarea
                value={commitment}
                onChange={(e) => setCommitment(e.target.value)}
                placeholder="Or write your own action plan..."
                rows={2}
                className="w-full rounded-xl bg-white border border-black/[0.08] px-4 py-3 text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
              <button
                onClick={() => commitment.trim() && setCommitted(true)}
                disabled={!commitment.trim()}
                className="w-full rounded-xl bg-accent px-4 py-3 font-bold text-white hover:brightness-110 disabled:opacity-35"
              >
                Commit ✊
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-accent/5 border border-accent/15 p-5 text-center space-y-2">
              <p className="text-2xl">🎯</p>
              <p className="text-sm font-bold text-accent">Commitment saved!</p>
              <p className="text-xs text-gray-500 leading-relaxed px-4">
                &ldquo;{commitment}&rdquo;
              </p>
              <p className="text-[11px] text-gray-400 mt-2">
                Change starts with one small step. Good luck!
              </p>
            </div>
          )}
        </section>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <section className="card-glass rounded-2xl p-6 border-l-4 border-green-500/30">
          <h2 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-4 font-display">
            Four things to do tomorrow
          </h2>
          <div className="space-y-3">
            {NEXT_STEPS.map((step, i) => (
              <ScrollReveal key={i} delay={i * 60}>
                <div className="flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-xs font-bold text-green-600 font-display">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-600 leading-relaxed">{step}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <section className="flex justify-center">
          <div
            className="relative w-full max-w-sm rounded-2xl overflow-hidden border-gradient holographic p-6 text-center shadow-lg"
            style={{
              background: "linear-gradient(135deg, rgba(249,115,22,0.06), rgba(255,255,255,0.95) 40%, rgba(245,158,11,0.04))",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.05),transparent_50%)]" />
            <div className="relative z-10">
              <div className="text-5xl mb-3">🏆</div>
              <p className="text-[11px] text-gray-400 uppercase tracking-[0.3em] mb-1 font-display">
                Certificate of Completion
              </p>
              <h3 className="text-lg font-black text-gray-900 mb-1 font-display tracking-tight">
                Supply Chain AI Pioneer
              </h3>
              <p className="text-xs text-gray-500 mb-4 font-display">
                Signify Supply Chain AI Transformation Workshop
              </p>
              <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent mb-4" />
              <div className="flex justify-center gap-6 text-[11px] text-gray-400">
                <div><p className="font-bold text-gray-900 text-sm font-display">4</p>stages done</div>
                <div><p className="font-bold text-gray-900 text-sm font-display">4</p>games cleared</div>
                <div><p className="font-bold text-gray-900 text-sm font-display">2026</p>edition</div>
              </div>
              <p className="mt-4 text-[11px] text-gray-400">Screenshot and share your win →</p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={120}>
        <EmailCollection />
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <section className="text-center space-y-4">
          <p className="text-gray-500 text-sm">
            AI transformation isn’t the finish line — it’s the start. Every good Prompt is progress in how you work with AI.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/"
              className="rounded-xl border border-accent/25 bg-accent/5 px-6 py-3 font-bold text-accent hover:bg-accent/12 active:scale-[0.975] transition-all"
            >
              Back to home
            </Link>
            <a
              href="https://gemini.google.com/app"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shimmer rounded-xl bg-gradient-to-r from-accent to-amber-500 px-6 py-3 font-bold text-white shadow-lg shadow-accent/15 hover:shadow-accent/25 active:scale-[0.975] transition-all hover:scale-105"
            >
              Keep practicing with Gemini →
            </a>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <footer className="text-center text-xs text-gray-400 py-4 font-display tracking-wider">
          Signify Greater China &middot; Supply Chain AI Transformation Workshop 2026
        </footer>
      </ScrollReveal>
    </div>
  );
}
