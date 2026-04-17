"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AI_FIASCO_DEMO } from "@/lib/workshop-data";

export default function AIFiascoDemo() {
  const [found, setFound] = useState<Set<number>>(new Set());
  const [activeError, setActiveError] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);

  const totalErrors = AI_FIASCO_DEMO.errors.length;
  const allFound = found.size === totalErrors;

  function handleClickSegment(errorId: number | null) {
    if (errorId === null || found.has(errorId)) return;
    const next = new Set(found);
    next.add(errorId);
    setFound(next);
    setActiveError(errorId);
  }

  const revealedError = activeError !== null
    ? AI_FIASCO_DEMO.errors.find((e) => e.id === activeError)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-red-500">🔍 AI failure hunt</span>
        <span className="text-xs text-gray-400">
          Found {found.size}/{totalErrors} issues
        </span>
      </div>

      <div className="rounded-xl border border-black/[0.04] bg-black/[0.02] p-5 backdrop-blur-sm space-y-4">
        {/* Fake prompt */}
        <div className="flex items-start gap-2">
          <span className="shrink-0 rounded-md bg-accent/20 px-2 py-0.5 text-[11px] font-bold text-accent">
            Prompt
          </span>
          <p className="text-sm text-gray-400 italic">
            &ldquo;{AI_FIASCO_DEMO.prompt}&rdquo;
          </p>
        </div>

        {/* Fake AI response with clickable error segments */}
        <div className="rounded-lg bg-gray-50 border border-black/[0.04] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-gray-400">AI reply</span>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {AI_FIASCO_DEMO.segments.map((seg, i) => {
              if (seg.errorId === null) {
                return <span key={i}>{seg.text}</span>;
              }
              const isFound = found.has(seg.errorId);
              return (
                <span
                  key={i}
                  onClick={() => handleClickSegment(seg.errorId)}
                  className={`cursor-pointer transition-all rounded px-0.5 -mx-0.5 ${
                    isFound
                      ? "bg-red-500/20 text-red-300 line-through decoration-red-400/50"
                      : "hover:bg-yellow-500/10 underline decoration-dashed decoration-yellow-500/40 underline-offset-2"
                  }`}
                >
                  {seg.text}
                </span>
              );
            })}
          </div>
        </div>

        {/* Hint toggle */}
        {!allFound && (
          <button
            onClick={() => setShowHint((v) => !v)}
            className="text-[11px] text-gray-400 hover:text-gray-500 transition"
          >
            {showHint ? "Hide hint" : "💡 Need a hint?"}
          </button>
        )}
        {showHint && !allFound && (
          <p className="text-[11px] text-yellow-600/70 bg-yellow-500/5 rounded-lg px-3 py-2">
            Tap the suspicious phrases. Watch names, numbers, and standards that feel “too perfect.”
          </p>
        )}

        {/* Error detail reveal */}
        <AnimatePresence mode="wait">
          {revealedError && (
            <motion.div
              key={revealedError.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-xs font-bold">
                    ✗ Issue #{revealedError.id + 1}
                  </span>
                  <span className="text-[11px] text-red-300/70 font-mono">
                    {revealedError.markerText}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {revealedError.explanation}
                </p>
                <p className="text-[11px] text-gray-400 italic">
                  ✦ {revealedError.realFact}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion insight */}
        <AnimatePresence>
          {allFound && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-2"
            >
              <p className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <span>⚠️</span> You found them all!
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                {AI_FIASCO_DEMO.insight}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
