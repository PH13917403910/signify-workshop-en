"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { stages, warmUpQuizzes, conceptCards } from "@/lib/workshop-data";
import { useWorkshopState } from "@/hooks/useSocket";
import AutoTerm from "@/components/shared/AutoTerm";
import ScrollReveal from "@/components/shared/ScrollReveal";
import SpotlightCard from "@/components/shared/SpotlightCard";
import WarmUpQuiz from "@/components/shared/WarmUpQuiz";
import ConceptCards from "@/components/shared/ConceptCards";
import AIFiascoDemo from "@/components/shared/AIFiascoDemo";
import AgentSimulator from "@/components/shared/AgentSimulator";

function isLocalVideo(url: string): boolean {
  return url.startsWith("/videos/") || url.startsWith("./");
}

export default function StagePage() {
  const params = useParams();
  const stageId = Number(params.id);
  const { state } = useWorkshopState();
  const stage = stages.find((s) => s.id === stageId);

  if (!stage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Stage not found</p>
      </div>
    );
  }

  const isCurrent = state.currentStage === stage.id;
  const isCompleted = state.currentStage > stage.id;
  const hasLocalVideo = isLocalVideo(stage.videoUrl);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/" className="hover:text-gray-600 transition">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-600">
          Stage {stage.id} · {stage.title}
        </span>
      </nav>

      {/* Stage header */}
      <ScrollReveal>
        <div className="text-center py-4 relative">
          <span className="absolute left-1/2 top-0 -translate-x-1/2 text-[120px] md:text-[160px] font-black text-black/[0.025] font-display leading-none select-none pointer-events-none tracking-tighter">
            {String(stage.id).padStart(2, "0")}
          </span>

          <div className="flex items-center justify-center gap-1.5 mb-4 relative">
            {stages.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <div
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    state.currentStage > s.id
                      ? "bg-green-500"
                      : state.currentStage === s.id
                        ? "bg-accent ring-2 ring-accent/30 ring-offset-1 ring-offset-[#f5f5f7]"
                        : s.id === stage.id
                          ? "bg-black/20"
                          : "bg-black/10"
                  }`}
                />
                {s.id < 4 && (
                  <div
                    className={`h-0.5 w-6 sm:w-10 rounded-full ${
                      state.currentStage > s.id ? "bg-green-500/40" : "bg-black/[0.05]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mb-3 relative">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                isCurrent
                  ? "bg-accent/12 text-accent"
                  : isCompleted
                    ? "bg-green-500/10 text-green-600"
                    : "bg-black/[0.04] text-gray-400"
              }`}
            >
              Stage {stage.id}
            </span>
            <span className="text-xs text-gray-400">{stage.time}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-1 font-display tracking-tight relative">
            <span className="mr-2">{stage.icon}</span>
            {stage.title}
          </h1>
          <p className="text-lg text-gray-500 relative">{stage.subtitle}</p>
        </div>
      </ScrollReveal>

      {/* Video + Quote */}
      <ScrollReveal delay={40}>
        <div className="card-glass rounded-2xl overflow-hidden">
          <div className="p-1.5 pb-0">
            {hasLocalVideo ? (
              <video
                className="w-full rounded-xl bg-gray-100"
                controls
                preload="metadata"
                playsInline
              >
                <source src={stage.videoUrl} type="video/mp4" />
                Your browser does not support video playback
              </video>
            ) : (
              <div className="rounded-xl bg-gray-50 p-8 text-center">
                <p className="text-4xl mb-3">🎬</p>
                <p className="text-gray-900 font-bold">{stage.videoTitle}</p>
                <p className="text-xs text-gray-400 mt-2">Watch the video on the facilitator&apos;s screen</p>
              </div>
            )}
          </div>
          <div className="p-6 pt-4 text-center">
            <p className="text-sm font-bold text-gray-900">{stage.videoTitle}</p>
            <blockquote className="text-accent italic mt-2 text-sm max-w-xl mx-auto">
              &ldquo;{stage.videoQuote}&rdquo;
            </blockquote>
            {stage.videoQuoteCn && (
              <p className="text-gray-500 text-xs mt-1.5 max-w-xl mx-auto">
                {stage.videoQuoteCn}
              </p>
            )}
            <p className="text-gray-400 text-xs mt-1">— {stage.videoSpeaker}</p>
          </div>
        </div>
      </ScrollReveal>

      {/* Objective */}
      <ScrollReveal delay={60}>
        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
            Objective
          </h2>
          <p className="text-gray-600 leading-relaxed">
            <AutoTerm text={stage.description} />
          </p>
        </div>
      </ScrollReveal>

      {/* Learning Outcomes */}
      {stage.learningOutcomes && stage.learningOutcomes.length > 0 && (
        <ScrollReveal delay={80}>
          <div className="card-glass rounded-2xl p-5">
            <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">
              🎓 After this stage, you will be able to
            </h3>
            <ul className="space-y-2">
              {stage.learningOutcomes.map((outcome, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-[11px] font-bold text-amber-600 mt-0.5">
                    {i + 1}
                  </span>
                  {outcome}
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      )}

      {/* Participant note */}
      {stage.participantNote && (
        <ScrollReveal delay={100}>
          <div className="rounded-2xl bg-accent/5 border border-accent/15 p-4 flex items-start gap-3">
            <span className="text-xl shrink-0">🎯</span>
            <p className="text-sm text-accent font-medium leading-relaxed">
              {stage.participantNote}
            </p>
          </div>
        </ScrollReveal>
      )}

      {/* Before / After */}
      {stage.beforeAfter && (
        <ScrollReveal delay={120}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="card-glass rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Before · pre-AI
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                {stage.beforeAfter.before}
              </p>
            </div>
            <div className="rounded-xl bg-accent/5 border border-accent/15 p-4">
              <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1.5">
                After · with AI
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                {stage.beforeAfter.after}
              </p>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Warm-Up Quiz */}
      {warmUpQuizzes[stageId] && (
        <ScrollReveal delay={140}>
          <WarmUpQuiz questions={warmUpQuizzes[stageId]} />
        </ScrollReveal>
      )}

      {/* Stage-specific interactive demos */}
      {stageId === 1 && (
        <ScrollReveal delay={160}>
          <AIFiascoDemo />
        </ScrollReveal>
      )}

      {/* Game entry */}
      <ScrollReveal delay={180}>
        <SpotlightCard className="card-glass rounded-2xl p-6 glow-accent relative overflow-hidden">
          <span className="absolute -right-4 -bottom-4 text-[96px] opacity-[0.03] select-none pointer-events-none leading-none">
            🎮
          </span>
          <div className="flex items-center justify-between flex-wrap gap-4 relative z-[2]">
            <div>
              <h2 className="text-sm font-bold text-accent uppercase tracking-wider mb-1">
                Interactive game
              </h2>
              <p className="text-xl font-bold text-gray-900 font-display">{stage.gameName}</p>
              <p className="text-sm text-gray-500 mt-1">
                ⏱ {stage.gameDurationMin} min
              </p>
            </div>
            <Link
              href={`/stage/${stage.id}/game`}
              className="btn-shimmer rounded-xl bg-gradient-to-r from-accent to-amber-500 px-6 py-3 font-bold text-white shadow-lg shadow-accent/15 hover:shadow-accent/25 transition-all hover:scale-105"
            >
              Enter game →
            </Link>
          </div>
        </SpotlightCard>
      </ScrollReveal>

      {/* Agent Simulator — Stage 1 only */}
      {stageId === 1 && (
        <ScrollReveal delay={60}>
          <AgentSimulator />
        </ScrollReveal>
      )}

      {/* Debrief */}
      <ScrollReveal delay={60}>
        <div className="card-glass rounded-2xl p-6 border-l-4 border-accent/30">
          <h2 className="text-sm font-bold text-accent uppercase tracking-wider mb-3">
            Debrief discussion
          </h2>
          <p className="text-gray-700 leading-relaxed text-base italic">
            &ldquo;<AutoTerm text={stage.debriefQuestion} />&rdquo;
          </p>
        </div>
      </ScrollReveal>

      {/* Concept Cards */}
      {conceptCards[stageId] && (
        <ScrollReveal delay={80}>
          <ConceptCards cards={conceptCards[stageId]} />
        </ScrollReveal>
      )}

      {/* Poll entry */}
      <ScrollReveal delay={100}>
        <SpotlightCard className="card-glass rounded-2xl p-6 glow-accent relative overflow-hidden">
          <span className="absolute -right-4 -bottom-4 text-[96px] opacity-[0.03] select-none pointer-events-none leading-none">
            📊
          </span>
          <div className="flex items-center justify-between flex-wrap gap-4 relative z-[2]">
            <div>
              <h2 className="text-sm font-bold text-accent uppercase tracking-wider mb-1">
                Checkpoint poll
              </h2>
              <p className="text-lg font-bold text-gray-900 font-display">Live Poll {stage.id}</p>
            </div>
            <Link
              href={`/stage/${stage.id}/poll`}
              className="rounded-xl border border-accent/25 bg-accent/8 px-6 py-3 font-bold text-accent hover:bg-accent/15 transition-all"
            >
              Join poll →
            </Link>
          </div>
        </SpotlightCard>
      </ScrollReveal>

      {/* Break notice after Stage 2 */}
      {stage.id === 2 && (
        <ScrollReveal>
          <div className="rounded-2xl bg-green-500/5 border border-green-500/15 p-4 flex items-center gap-3">
            <span className="text-2xl">☕</span>
            <div>
              <p className="text-sm font-bold text-green-600">Break 14:30 – 14:45</p>
              <p className="text-xs text-gray-500">After Stage 2, take 15 minutes to recharge for the second half</p>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Stage 4 wrap-up */}
      {stage.id === 4 && (
        <ScrollReveal>
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/8 to-accent/8 border border-amber-500/20 p-6 text-center space-y-3">
            <span className="text-4xl block">🎓</span>
            <p className="text-lg font-bold text-gray-900">Workshop wrap-up &amp; Q&amp;A (16:45 – 17:00)</p>
            <p className="text-sm text-gray-500">
              All 4 stages complete! Head to the completion page for your digital certificate
            </p>
            <Link
              href="/finish"
              className="inline-block rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/15 hover:shadow-amber-500/25 hover:scale-105 transition-all animate-pulse-gentle"
            >
              Go to completion page →
            </Link>
          </div>
        </ScrollReveal>
      )}

      {/* Navigation */}
      <ScrollReveal>
        <div className="flex justify-between pt-4">
          {stage.id > 1 ? (
            <Link
              href={`/stage/${stage.id - 1}`}
              className="rounded-xl border border-black/[0.08] bg-black/[0.02] px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-black/[0.05] hover:text-gray-700 hover:border-black/[0.12] transition-all"
            >
              ← {stages[stage.id - 2].title}
            </Link>
          ) : (
            <Link
              href="/"
              className="rounded-xl border border-black/[0.08] bg-black/[0.02] px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-black/[0.05] hover:text-gray-700 hover:border-black/[0.12] transition-all"
            >
              ← Back to home
            </Link>
          )}
          <div className="flex-1" />
          {stage.id < 4 && (
            <Link
              href={`/stage/${stage.id + 1}`}
              className="rounded-xl border border-accent/20 bg-accent/5 px-5 py-2.5 text-sm font-medium text-accent hover:bg-accent/12 hover:border-accent/35 transition-all"
            >
              {stages[stage.id].title} →
            </Link>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
}
