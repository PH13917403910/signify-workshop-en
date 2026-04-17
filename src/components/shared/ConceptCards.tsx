"use client";

import { useState } from "react";
import type { ConceptCard } from "@/lib/types";

interface ConceptCardsProps {
  cards: ConceptCard[];
}

export default function ConceptCards({ cards }: ConceptCardsProps) {
  const [flippedSet, setFlippedSet] = useState<Set<number>>(new Set());

  if (!cards || cards.length === 0) return null;

  function toggle(idx: number) {
    setFlippedSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  const allFlipped = flippedSet.size === cards.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-accent">💡 Key concepts</span>
        {allFlipped && (
          <span className="text-[11px] text-emerald-400/70 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Unlock all
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map((card, i) => {
          const isFlipped = flippedSet.has(i);
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={`flip-card text-left h-40 sm:h-44 ${isFlipped ? "flipped" : ""}`}
            >
              <div className="flip-card-inner">
                {/* Front */}
                <div className="flip-card-front flex flex-col items-center justify-center gap-2 rounded-xl border border-black/[0.06] bg-black/[0.02] p-4 backdrop-blur-sm hover:border-black/[0.08] active:border-black/[0.08] active:bg-black/[0.04] transition-colors">
                  <span className="text-2xl">{card.icon}</span>
                  <p className="text-sm font-medium text-gray-700 text-center leading-snug">
                    {card.front}
                  </p>
                  <span className="text-[11px] text-gray-400 mt-1">Tap to flip ↻</span>
                </div>

                {/* Back */}
                <div className="flip-card-back flex flex-col justify-center rounded-xl border border-accent/15 bg-accent/[0.04] p-4 backdrop-blur-sm">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {card.back}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
