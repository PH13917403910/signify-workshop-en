"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { WarmUpQuestion } from "@/lib/types";

interface WarmUpQuizProps {
  questions: WarmUpQuestion[];
}

export default function WarmUpQuiz({ questions }: WarmUpQuizProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  if (!questions || questions.length === 0) return null;

  const q = questions[currentIdx];
  const isCorrect = selected === q.correctId;

  function handleSelect(optionId: string) {
    if (revealed) return;
    setSelected(optionId);
    setRevealed(true);
    if (optionId === q.correctId) setCorrectCount((c) => c + 1);
  }

  function handleNext() {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setCompleted(true);
    }
  }

  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3"
      >
        <span className="text-lg">✅</span>
        <span className="text-sm text-emerald-300">
          Warm-up done — {correctCount}/{questions.length} correct
        </span>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium text-amber-600">⚡ Quick quiz</span>
        <span className="text-xs text-gray-500">
          {currentIdx + 1} / {questions.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl border border-black/[0.04] bg-black/[0.02] p-5 backdrop-blur-sm"
        >
          <p className="text-sm font-medium text-gray-700 mb-4">{q.question}</p>

          <div className="space-y-2">
            {q.options.map((opt) => {
              const isThis = selected === opt.id;
              const isAnswer = opt.id === q.correctId;
              let borderClass = "border-black/[0.06] hover:border-black/[0.08]";
              if (revealed && isAnswer) borderClass = "border-emerald-500/50 bg-emerald-500/10";
              else if (revealed && isThis && !isCorrect) borderClass = "border-red-500/50 bg-red-500/10";

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  disabled={revealed}
                  className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-all ${borderClass} ${
                    revealed ? "cursor-default" : "cursor-pointer"
                  }`}
                >
                  <span className="text-xs font-bold text-gray-400 mr-2">{opt.id}</span>
                  <span className={revealed && isAnswer ? "text-emerald-300" : "text-gray-600"}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                  isCorrect
                    ? "border border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                    : "border border-amber-500/20 bg-amber-500/5 text-amber-300"
                }`}>
                  <p className="font-medium mb-1">{isCorrect ? "✓ Correct!" : "✗ Not quite"}</p>
                  <p className="text-xs opacity-80">{q.insight}</p>
                </div>
                <button
                  onClick={handleNext}
                  className="mt-3 rounded-lg bg-black/[0.04] px-5 py-3 text-sm font-medium text-gray-600 hover:bg-black/[0.06] active:bg-black/[0.08]"
                >
                  {currentIdx < questions.length - 1 ? "Next →" : "Done ✓"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
