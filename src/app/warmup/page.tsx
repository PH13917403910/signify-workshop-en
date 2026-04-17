"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import TokenPredictor from "@/components/warmup/TokenPredictor";
import {
  warmupScenario,
  TRAINING_CARDS,
  BAR_LABELS,
  type TokenCandidate,
} from "@/lib/warmup-data";
import type { WarmupPhase } from "@/components/warmup/WarmupCanvas";

const WarmupCanvas = dynamic(
  () => import("@/components/warmup/WarmupCanvas"),
  { ssr: false },
);

export default function WarmupPage() {
  const [phase, setPhase] = useState<WarmupPhase>("predict");
  const [candidates, setCandidates] = useState<TokenCandidate[]>(
    warmupScenario.steps[0].candidates,
  );
  const [temperature, setTemperature] = useState(1.0);
  const [samplingTrigger, setSamplingTrigger] = useState(0);
  const [trainedCount, setTrainedCount] = useState(0);
  const [trainPulseTrigger, setTrainPulseTrigger] = useState(0);
  const [barValues, setBarValues] = useState<number[]>(
    () => BAR_LABELS.map(() => 1 / BAR_LABELS.length),
  );
  const [lastCardBoosts, setLastCardBoosts] = useState<Record<string, number> | null>(null);

  const barAccRef = useRef<number[]>(BAR_LABELS.map(() => 0));

  const handleTrainCard = useCallback((cardIndex: number) => {
    const card = TRAINING_CARDS[cardIndex];
    if (!card) return;

    setLastCardBoosts(card.boosts);

    const acc = barAccRef.current;
    for (const [label, boost] of Object.entries(card.boosts)) {
      const idx = BAR_LABELS.indexOf(label);
      if (idx >= 0) acc[idx] += boost;
    }

    const sum = acc.reduce((a, b) => a + b, 0);
    const base = 1 / BAR_LABELS.length;
    const newVals = sum > 0
      ? acc.map((v) => base * 0.3 + (v / sum) * 0.7)
      : BAR_LABELS.map(() => base);

    const total = newVals.reduce((a, b) => a + b, 0);
    setBarValues(newVals.map((v) => v / total));
    setTrainedCount((c) => c + 1);
    setTrainPulseTrigger((c) => c + 1);
  }, []);

  return (
    <>
      <WarmupCanvas
        phase={phase}
        candidates={candidates}
        temperature={temperature}
        samplingBallTrigger={samplingTrigger}
        trainedCount={trainedCount}
        trainPulseTrigger={trainPulseTrigger}
        barValues={barValues}
      />

      <div className="relative z-10 max-w-2xl mx-auto pt-8 pb-16 px-4">
        <div className="text-center mb-8 animate-fade-in-blur">
          <p className="text-xs font-bold text-accent/70 uppercase tracking-[0.3em] font-display mb-3">
            Warm-Up Experience
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
            <span className="gradient-text">You are the LLM</span>
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Experience how LLMs work — predicting the next token, one word at a time
          </p>
        </div>

        <TokenPredictor
          scenario={warmupScenario}
          onPhaseChange={setPhase}
          onCandidatesChange={setCandidates}
          onTemperatureChange={setTemperature}
          onSamplingTrigger={() => setSamplingTrigger((c) => c + 1)}
          onTrainCard={handleTrainCard}
          temperature={temperature}
          barValues={barValues}
          trainedCount={trainedCount}
          lastCardBoosts={lastCardBoosts}
          trainPulseTrigger={trainPulseTrigger}
        />
      </div>
    </>
  );
}
