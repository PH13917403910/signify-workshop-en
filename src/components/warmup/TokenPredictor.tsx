"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { WarmupScenario, TokenCandidate } from "@/lib/warmup-data";
import {
  INSIGHTS,
  TRAINING_CARDS,
  BAR_LABELS,
  SAMPLING_CANDIDATES,
  applyTemperature,
  simulateExpectedSamples,
  computeEffectiveTemperature,
  getScorecardBand,
  getTemperatureHint,
} from "@/lib/warmup-data";
import type { WarmupPhase } from "./WarmupCanvas";
import NeuralNetworkFlow from "./NeuralNetworkFlow";

const EASE = [0.16, 1, 0.3, 1] as const;

interface UserPrediction {
  step: number;
  picked: string;
  modelTop: string;
  modelTopProb: number;
  rank: number;
}

interface Props {
  scenario: WarmupScenario;
  onPhaseChange: (phase: WarmupPhase) => void;
  onCandidatesChange: (c: TokenCandidate[]) => void;
  onTemperatureChange: (t: number) => void;
  onSamplingTrigger: () => void;
  onTrainCard: (cardIndex: number) => void;
  temperature: number;
  barValues: number[];
  trainedCount: number;
  lastCardBoosts: Record<string, number> | null;
  trainPulseTrigger: number;
}

export default function TokenPredictor({
  scenario,
  onPhaseChange,
  onCandidatesChange,
  onTemperatureChange,
  onSamplingTrigger,
  onTrainCard,
  temperature,
  barValues,
  trainedCount,
  lastCardBoosts,
  trainPulseTrigger,
}: Props) {
  const [phase, setPhase] = useState<WarmupPhase>("predict");
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [justSelected, setJustSelected] = useState<string | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const [pickedTrap, setPickedTrap] = useState(false);
  const [choiceRanks, setChoiceRanks] = useState<number[]>([]);
  const [userPredictions, setUserPredictions] = useState<UserPrediction[]>([]);
  const [samplingResults, setSamplingResults] = useState<string[]>([]);
  const [fedCards, setFedCards] = useState<Set<number>>(new Set());

  const step = scenario.steps[stepIndex];
  const isLastStep = stepIndex >= scenario.steps.length - 1;

  const changePhase = useCallback(
    (p: WarmupPhase) => {
      setPhase(p);
      onPhaseChange(p);
      if (p === "sampling") {
        onCandidatesChange(SAMPLING_CANDIDATES);
      }
    },
    [onPhaseChange, onCandidatesChange],
  );

  const handleTokenSelect = useCallback(
    (candidate: TokenCandidate, _index: number) => {
      if (justSelected) return;

      setJustSelected(candidate.token);
      setSelectedTokens((prev) => [...prev, candidate.token]);

      const sorted = [...step.candidates].sort(
        (a, b) => b.probability - a.probability,
      );
      const rank = sorted.findIndex((c) => c.token === candidate.token);
      const normalizedRank = (rank / (step.candidates.length - 1)) * 2;
      setChoiceRanks((prev) => [...prev, normalizedRank]);

      const modelTop = sorted[0];
      setUserPredictions((prev) => [
        ...prev,
        {
          step: stepIndex,
          picked: candidate.token,
          modelTop: modelTop.token,
          modelTopProb: modelTop.probability,
          rank: rank + 1,
        },
      ]);

      if (isLastStep) {
        setPickedTrap(!!candidate.isHallucination);
      }

      setShowReveal(true);
    },
    [justSelected, step, isLastStep, stepIndex],
  );

  const handleRevealContinue = useCallback(() => {
    setShowReveal(false);

    if (isLastStep) {
      setTimeout(() => changePhase("hallucination"), 300);
      return;
    }

    const nextIdx = stepIndex + 1;
    setStepIndex(nextIdx);
    setJustSelected(null);
    onCandidatesChange(scenario.steps[nextIdx].candidates);
  }, [isLastStep, stepIndex, scenario, changePhase, onCandidatesChange]);

  const handleSample = useCallback(() => {
    const probs = applyTemperature(
      SAMPLING_CANDIDATES.map((c) => c.probability),
      temperature,
    );
    const cumulative: number[] = [];
    let sum = 0;
    for (const p of probs) {
      sum += p;
      cumulative.push(sum);
    }
    const rand = Math.random();
    const idx = cumulative.findIndex((c) => rand <= c);
    const token = SAMPLING_CANDIDATES[idx >= 0 ? idx : 0].token;
    setSamplingResults((prev) => [...prev, token].slice(-8));
    onSamplingTrigger();
  }, [temperature, onSamplingTrigger]);

  const handleFeedCard = useCallback(
    (cardIdx: number) => {
      if (fedCards.has(cardIdx)) return;
      setFedCards((prev) => new Set(prev).add(cardIdx));
      onTrainCard(cardIdx);
    },
    [fedCards, onTrainCard],
  );

  const handleSpeedTrain = useCallback(() => {
    TRAINING_CARDS.forEach((_, i) => {
      if (!fedCards.has(i)) {
        setTimeout(() => {
          setFedCards((prev) => new Set(prev).add(i));
          onTrainCard(i);
        }, i * 150);
      }
    });
  }, [fedCards, onTrainCard]);

  return (
    <div className="relative z-10 pointer-events-auto">
      <AnimatePresence mode="wait">
        {phase === "predict" && (
          <PredictOverlay
            key={`predict-${stepIndex}`}
            step={step}
            stepIndex={stepIndex}
            totalSteps={scenario.steps.length}
            justSelected={justSelected}
            showReveal={showReveal}
            onSelect={handleTokenSelect}
            onRevealContinue={handleRevealContinue}
            context={scenario.context}
            predictionHint={scenario.predictionHint}
            temperatureHints={scenario.temperatureHints}
            temperature={temperature}
            onTemperatureChange={onTemperatureChange}
            showTemperature={stepIndex >= 1}
            isLastStep={isLastStep}
          />
        )}

        {phase === "hallucination" && (
          <HallucinationOverlay
            key="hallucination"
            pickedTrap={pickedTrap}
            reveal={step.hallucinationReveal!}
            fallback={step.hallucinationFallback!}
            selectedToken={selectedTokens[selectedTokens.length - 1]}
            onContinue={() => changePhase("bridge")}
          />
        )}

        {phase === "bridge" && (
          <BridgeOverlay
            key="bridge"
            userPredictions={userPredictions}
            samplingHint={scenario.samplingHint}
            onContinue={() => changePhase("sampling")}
          />
        )}

        {phase === "sampling" && (
          <SamplingOverlay
            key="sampling"
            results={samplingResults}
            temperature={temperature}
            temperatureHints={scenario.temperatureHints}
            onTemperatureChange={onTemperatureChange}
            onSample={handleSample}
            onContinue={() => changePhase("training")}
          />
        )}

        {phase === "training" && (
          <TrainingOverlay
            key="training"
            fedCards={fedCards}
            barValues={barValues}
            trainedCount={trainedCount}
            lastCardBoosts={lastCardBoosts}
            trainPulseTrigger={trainPulseTrigger}
            insight={scenario.trainingInsight}
            caption={scenario.trainingCaption}
            onFeedCard={handleFeedCard}
            onSpeedTrain={handleSpeedTrain}
            onContinue={() => changePhase("insight")}
          />
        )}

        {phase === "insight" && (
          <InsightOverlay key="insight" choiceRanks={choiceRanks} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════
   Shared: Temperature Simulation Panel
   ═════════════════════════════════════════════════════════ */

const SIM_COLORS = [
  "bg-amber-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-500",
];

function TemperatureSimPanel({
  candidates,
  temperature,
  temperatureHints,
  onTemperatureChange,
}: {
  candidates: { token: string; probability: number }[];
  temperature: number;
  temperatureHints: WarmupScenario["temperatureHints"];
  onTemperatureChange: (t: number) => void;
}) {
  const samples = useMemo(
    () =>
      simulateExpectedSamples(
        candidates.map((c) => c.probability),
        temperature,
        20,
      ),
    [candidates, temperature],
  );

  const tempHint = getTemperatureHint(temperatureHints, temperature);
  const topToken = candidates[0].token;
  const topCount = samples[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="card-glass rounded-xl px-5 py-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-amber-600/80 uppercase tracking-wider font-display">
          Temperature
        </span>
        <span className="text-sm font-mono text-gray-900 tabular-nums">
          {temperature.toFixed(1)}
        </span>
      </div>
      <input
        type="range"
        min={0.1}
        max={2.0}
        step={0.1}
        value={temperature}
        onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
        className="w-full accent-amber-500 cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>Conservative (0.1)</span>
        <span>Neutral (1.0)</span>
        <span>Exploratory (2.0)</span>
      </div>
      <p className="text-[11px] text-amber-600/60 mt-2 leading-relaxed">
        {tempHint}
      </p>

      <div className="mt-3 pt-3 border-t border-black/[0.04]">
        <p className="text-[11px] text-gray-400 mb-2.5">
          If you “roll” 20 times at this temperature:
        </p>
        <div className="space-y-1.5">
          {candidates.map((c, i) => (
            <div key={c.token} className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500 w-20 shrink-0 truncate">
                {c.token}
              </span>
              <div className="flex-1 flex flex-wrap gap-0.5">
                {Array.from({ length: samples[i] }).map((_, j) => (
                  <motion.div
                    key={j}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: j * 0.02, duration: 0.2 }}
                    className={`w-2.5 h-2.5 rounded-[2px] ${SIM_COLORS[i % SIM_COLORS.length]}`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-mono text-gray-400 tabular-nums w-8 text-right">
                {samples[i]}×
              </span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-amber-600/70 mt-3 leading-relaxed">
          {temperature < 0.6
            ? `The model almost always picks “${topToken}” (${topCount}/20) — very confident, little variety`
            : temperature <= 1.3
              ? `“${topToken}” still wins most often (${topCount}/20), but other tokens appear sometimes`
              : `Choices spread out (“${topToken}” only ${topCount}/20) — more creative, less predictable`}
        </p>
      </div>
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════
   Phase 1: Predict Overlay
   ═════════════════════════════════════════════════════════ */

function PredictOverlay({
  step,
  stepIndex,
  totalSteps,
  justSelected,
  showReveal,
  onSelect,
  onRevealContinue,
  context,
  predictionHint,
  temperatureHints,
  temperature,
  onTemperatureChange,
  showTemperature,
  isLastStep,
}: {
  step: WarmupScenario["steps"][number];
  stepIndex: number;
  totalSteps: number;
  justSelected: string | null;
  showReveal: boolean;
  onSelect: (c: TokenCandidate, i: number) => void;
  onRevealContinue: () => void;
  context: string;
  predictionHint: string;
  temperatureHints: WarmupScenario["temperatureHints"];
  temperature: number;
  onTemperatureChange: (t: number) => void;
  showTemperature: boolean;
  isLastStep: boolean;
}) {
  const adjustedProbs = useMemo(
    () =>
      applyTemperature(
        step.candidates.map((c) => c.probability),
        temperature,
      ),
    [step.candidates, temperature],
  );

  const modelTop = useMemo(() => {
    let maxIdx = 0;
    for (let i = 1; i < adjustedProbs.length; i++) {
      if (adjustedProbs[i] > adjustedProbs[maxIdx]) maxIdx = i;
    }
    return {
      token: step.candidates[maxIdx].token,
      prob: adjustedProbs[maxIdx],
    };
  }, [step.candidates, adjustedProbs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="space-y-5"
    >
      {stepIndex === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card-glass rounded-xl px-5 py-4"
        >
          <p className="text-xs font-bold text-accent/70 uppercase tracking-wider mb-1.5 font-display">
            Scenario
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">{context}</p>
        </motion.div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-gray-400">
          Step {stepIndex + 1} / {totalSteps}
        </span>
        <div className="flex-1 h-1 rounded-full bg-black/[0.03] overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent to-amber-500 rounded-full"
            initial={{ width: `${(stepIndex / totalSteps) * 100}%` }}
            animate={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.5, ease: EASE }}
          />
        </div>
      </div>

      {stepIndex === 0 && !showReveal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg bg-accent/5 border border-accent/10 px-4 py-2.5"
        >
          <p className="text-xs text-accent/80 leading-relaxed">
            {predictionHint}
          </p>
        </motion.div>
      )}

      <div className="card-glass rounded-xl p-5">
        <p className="text-xs text-gray-400 mb-3 font-display uppercase tracking-wider">
          Model is generating…
        </p>
        <p className="text-base sm:text-lg text-gray-900 leading-relaxed font-medium">
          {step.textSoFar}
          <span className="inline-flex items-center ml-1">
            <span className="h-5 w-[2px] bg-accent animate-pulse" />
          </span>
        </p>
      </div>

      {!showReveal ? (
        <>
          <div>
            <p className="text-xs text-gray-400 mb-3">
              Which token do you think the model picks next?
              <span className="text-accent"> ▼</span>
            </p>
            <div className="grid gap-2">
              {step.candidates.map((c, i) => {
                const isSelected = justSelected === c.token;
                const prob = adjustedProbs[i];
                return (
                  <motion.button
                    key={c.token}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.35, ease: EASE }}
                    onClick={() => onSelect(c, i)}
                    disabled={!!justSelected}
                    className={`group relative flex items-center gap-3 rounded-xl border p-3 sm:p-4 text-left transition-all ${
                      isSelected
                        ? "border-accent/50 bg-accent/10"
                        : justSelected
                          ? "border-black/[0.03] bg-black/[0.01] opacity-40"
                          : "border-black/[0.06] bg-black/[0.02] hover:border-accent/30 hover:bg-accent/5"
                    }`}
                  >
                    <span
                      className={`text-sm font-bold transition-colors shrink-0 ${
                        isSelected
                          ? "text-accent"
                          : "text-gray-700 group-hover:text-gray-900"
                      }`}
                    >
                      {c.token}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-black/[0.03] overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          isSelected
                            ? "bg-accent"
                            : c.isHallucination
                              ? "bg-gradient-to-r from-amber-500 to-orange-500"
                              : "bg-black/[0.08]"
                        }`}
                        animate={{ width: `${prob * 100}%` }}
                        transition={{ duration: 0.4, ease: EASE }}
                      />
                    </div>
                    <span
                      className={`text-xs font-mono tabular-nums w-10 text-right shrink-0 ${
                        isSelected ? "text-accent" : "text-gray-400"
                      }`}
                    >
                      {Math.round(prob * 100)}%
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {showTemperature && (
            <TemperatureSimPanel
              candidates={step.candidates}
              temperature={temperature}
              temperatureHints={temperatureHints}
              onTemperatureChange={onTemperatureChange}
            />
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="space-y-4"
        >
          <div className="card-glass rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-accent/60 font-display mb-1.5">
                  Your pick
                </p>
                <p className="text-base font-bold text-accent">
                  {justSelected}
                </p>
              </div>
              <div className="rounded-lg bg-black/[0.02] border border-black/[0.06] p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-display mb-1.5">
                  Model top token
                </p>
                <p className="text-base font-bold text-gray-900">
                  {modelTop.token}{" "}
                  <span className="text-xs font-mono text-gray-400">
                    {Math.round(modelTop.prob * 100)}%
                  </span>
                </p>
              </div>
            </div>

            {justSelected === modelTop.token ? (
              <p className="text-xs text-green-600/80 text-center">
                ✓ You matched the model’s top choice!
              </p>
            ) : (
              <p className="text-xs text-amber-600/80 text-center">
                Different from the top token — the model favors “{modelTop.token}”
              </p>
            )}
          </div>

          {step.teachingNote && (
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 px-4 py-2.5">
              <p className="text-xs text-amber-600/80 leading-relaxed">
                {step.teachingNote}
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={onRevealContinue}
              className="btn-shimmer rounded-xl bg-gradient-to-r from-accent to-amber-500 px-8 py-3 font-bold text-white shadow-lg shadow-accent/15 hover:shadow-accent/40 hover:scale-105 transition-all"
            >
              {isLastStep ? "See what this choice implies →" : "Next step →"}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════
   Phase 2: Hallucination Overlay
   ═════════════════════════════════════════════════════════ */

function HallucinationOverlay({
  pickedTrap,
  reveal,
  fallback,
  selectedToken,
  onContinue,
}: {
  pickedTrap: boolean;
  reveal: string;
  fallback: string;
  selectedToken: string;
  onContinue: () => void;
}) {
  const text = pickedTrap ? reveal : fallback;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col items-center justify-center min-h-[55vh] text-center px-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
        className="text-6xl mb-6"
      >
        {pickedTrap ? "⚠️" : "🧐"}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
        className="max-w-lg"
      >
        <h2 className="font-display text-2xl font-black text-gray-900 mb-2">
          You picked “
          <span className={pickedTrap ? "text-red-500" : "text-green-600"}>
            {selectedToken}
          </span>
          ”
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {pickedTrap
            ? "It was the highest-probability token — but it is wrong here."
            : "Not the top probability — but you avoided the trap."}
        </p>

        <div
          className={`card-glass rounded-2xl p-6 text-left border ${
            pickedTrap ? "border-red-500/20" : "border-green-500/20"
          }`}
        >
          <p className="text-base text-gray-700 leading-relaxed">{text}</p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-4 rounded-xl bg-accent/5 border border-accent/10 px-5 py-3"
        >
          <p className="text-sm text-accent/90 font-medium">
            This is <span className="font-bold">hallucination</span>
            ——LLMs pick statistically likely tokens, not guaranteed facts.
          </p>
        </motion.div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        onClick={onContinue}
        className="mt-8 btn-shimmer rounded-xl bg-gradient-to-r from-accent to-amber-500 px-8 py-3.5 font-bold text-white shadow-lg shadow-accent/15 hover:shadow-accent/40 hover:scale-105 transition-all"
      >
        Does the model always pick the same token? →
      </motion.button>
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════
   Phase 2.5: Bridge Overlay (predict → sampling)
   ═════════════════════════════════════════════════════════ */

function BridgeOverlay({
  userPredictions,
  samplingHint,
  onContinue,
}: {
  userPredictions: UserPrediction[];
  samplingHint: string;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
        className="max-w-lg w-full space-y-5"
      >
        <div>
          <h2 className="font-display text-2xl font-black text-gray-900 mb-2">
            You just did the model’s core job
          </h2>
          <p className="text-sm text-gray-500">
            Every step, the model samples the next token from a probability distribution
          </p>
        </div>

        <div className="card-glass rounded-xl p-5 text-left space-y-2">
          {userPredictions.map((p) => (
            <div key={p.step} className="flex items-start gap-2 text-sm">
              <span className="text-gray-400 shrink-0 w-14">
                Step {p.step + 1}
              </span>
              <span className="text-accent font-medium shrink-0">
                {p.picked}
              </span>
              <span className="text-gray-400 text-xs pt-0.5">
                {p.picked === p.modelTop
                  ? "= model top"
                  : `≠ model top “${p.modelTop}” (${Math.round(p.modelTopProb * 100)}%)`}
              </span>
            </div>
          ))}
        </div>

        <div className="card-glass rounded-xl px-5 py-4 border border-accent/10">
          <p className="text-sm text-gray-600 leading-relaxed">
            {samplingHint}
          </p>
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={onContinue}
          className="btn-shimmer rounded-xl bg-gradient-to-r from-accent to-amber-500 px-8 py-3.5 font-bold text-white shadow-lg shadow-accent/15 hover:shadow-accent/40 hover:scale-105 transition-all"
        >
          See what sampling actually draws →
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════
   Phase 3: Sampling Overlay
   ═════════════════════════════════════════════════════════ */

function SamplingOverlay({
  results,
  temperature,
  temperatureHints,
  onTemperatureChange,
  onSample,
  onContinue,
}: {
  results: string[];
  temperature: number;
  temperatureHints: WarmupScenario["temperatureHints"];
  onTemperatureChange: (t: number) => void;
  onSample: () => void;
  onContinue: () => void;
}) {
  const autoFired = useRef(false);
  const onSampleRef = useRef(onSample);
  onSampleRef.current = onSample;

  useEffect(() => {
    if (autoFired.current) return;
    autoFired.current = true;
    for (let i = 0; i < 3; i++) {
      setTimeout(() => onSampleRef.current(), (i + 1) * 500);
    }
  }, []);

  const canProceed = results.length >= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="space-y-5"
    >
      <div className="text-center">
        <h2 className="font-display text-2xl font-black text-gray-900 mb-2">
          Sampling ≠ certainty
        </h2>
        <p className="text-sm text-gray-500">
          Same distribution, different rolls each time
        </p>
      </div>

      <div className="card-glass rounded-xl px-5 py-4">
        <p className="text-xs text-gray-400 mb-3">
          After “South China hub stock on hand,” what comes next?
        </p>
        <div className="flex justify-center">
          <button
            onClick={onSample}
            className="btn-shimmer rounded-xl bg-gradient-to-r from-accent to-amber-500 px-8 py-3 font-bold text-white shadow-lg shadow-accent/15 hover:shadow-accent/40 hover:scale-105 transition-all"
          >
            🎲 Roll again
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-glass rounded-xl px-5 py-4"
        >
          <p className="text-xs text-gray-400 mb-2">
            Samples (same prompt, different draws):
          </p>
          <div className="flex flex-wrap gap-2">
            {results.map((r, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center rounded-lg bg-accent/10 border border-accent/20 px-3 py-1.5 text-sm font-medium text-accent"
              >
                #{i + 1} {r}
              </motion.span>
            ))}
          </div>
          {results.length >= 2 && (
            <p className="text-[11px] text-amber-600/70 mt-3">
              {new Set(results).size < results.length
                ? "Repeats — likely tokens show up more often, but not every time."
                : "All different — sampling is stochastic; high probability means high odds, not certainty."}
            </p>
          )}
        </motion.div>
      )}

      <TemperatureSimPanel
        candidates={SAMPLING_CANDIDATES}
        temperature={temperature}
        temperatureHints={temperatureHints}
        onTemperatureChange={onTemperatureChange}
      />

      {canProceed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-glass rounded-xl px-5 py-3 border border-amber-500/10"
        >
          <p className="text-sm text-amber-600/80 leading-relaxed mb-3">
            That is why two ChatGPT answers can differ — it is rolling against the same distribution.
          </p>
          <button
            onClick={onContinue}
            className="btn-shimmer rounded-xl bg-gradient-to-r from-accent to-amber-500 px-8 py-3 font-bold text-white shadow-lg shadow-accent/15 hover:shadow-accent/40 hover:scale-105 transition-all"
          >
            Where do those probabilities come from? See training →
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════
   Phase 4: Training Overlay
   ═════════════════════════════════════════════════════════ */

function TrainingOverlay({
  fedCards,
  barValues,
  trainedCount,
  lastCardBoosts,
  trainPulseTrigger,
  insight,
  caption,
  onFeedCard,
  onSpeedTrain,
  onContinue,
}: {
  fedCards: Set<number>;
  barValues: number[];
  trainedCount: number;
  lastCardBoosts: Record<string, number> | null;
  trainPulseTrigger: number;
  insight: string;
  caption: string;
  onFeedCard: (i: number) => void;
  onSpeedTrain: () => void;
  onContinue: () => void;
}) {
  const allFed = trainedCount >= TRAINING_CARDS.length;
  const showSpeed = trainedCount >= 4 && !allFed;

  const stageLabel =
            trainedCount === 0
      ? "Still uncertain…"
      : trainedCount < 4
        ? "Preferences emerging…"
        : trainedCount < 8
          ? "Pattern sharpening…"
          : "Training complete!";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="space-y-5"
    >
      <div className="text-center">
        <h2 className="font-display text-2xl font-black text-gray-900 mb-1">
          Train the model
        </h2>
        <p className="text-sm text-gray-500">{caption}</p>
      </div>

      <div className="card-glass rounded-xl px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400">
            Tap cards to feed the model ({trainedCount}/{TRAINING_CARDS.length})
          </span>
          <span className="text-xs text-amber-600 font-medium">{stageLabel}</span>
        </div>

        <div className="grid gap-2 max-h-[35vh] overflow-y-auto pr-1">
          {TRAINING_CARDS.map((card, i) => {
            const isFed = fedCards.has(i);
            return (
              <motion.button
                key={i}
                layout
                onClick={() => onFeedCard(i)}
                disabled={isFed}
                className={`text-left rounded-lg border px-4 py-2.5 text-sm transition-all ${
                  isFed
                    ? "border-accent/20 bg-accent/5 opacity-40 cursor-default"
                    : "border-black/[0.06] bg-black/[0.02] hover:border-accent/30 hover:bg-accent/5 cursor-pointer"
                }`}
              >
                <span className={isFed ? "text-gray-400 line-through" : "text-gray-600"}>
                  {card.text}
                </span>
                {isFed && <span className="ml-2 text-accent text-xs">✓ Learned</span>}
              </motion.button>
            );
          })}
        </div>

        {showSpeed && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onSpeedTrain}
            className="mt-3 w-full rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-500/20 transition"
          >
            ⚡ Fast-forward (feed remaining cards)
          </motion.button>
        )}
      </div>

      <NeuralNetworkFlow
        barValues={barValues}
        lastCardBoosts={lastCardBoosts}
        pulseTrigger={trainPulseTrigger}
        trainedCount={trainedCount}
      />

      {allFed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <div className="card-glass rounded-xl px-5 py-4 border border-amber-500/10">
            <p className="text-sm text-amber-600/90 leading-relaxed">{insight}</p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={onContinue}
              className="btn-shimmer rounded-xl bg-gradient-to-r from-accent to-amber-500 px-8 py-3.5 font-bold text-white shadow-lg shadow-accent/15 hover:shadow-accent/40 hover:scale-105 transition-all"
            >
              See what you learned →
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════
   Phase 5: Insight + Scorecard
   ═════════════════════════════════════════════════════════ */

function InsightOverlay({ choiceRanks }: { choiceRanks: number[] }) {
  const effectiveT = computeEffectiveTemperature(choiceRanks);
  const band = getScorecardBand(effectiveT);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-glass rounded-2xl p-6 border-gradient"
      >
        <div className="text-center mb-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-4xl mb-2"
          >
            🤖
          </motion.div>
          <h2 className="font-display text-xl font-black text-gray-900">
            Your prediction style
          </h2>
        </div>
        <div className="text-center">
          <p className="text-3xl font-black gradient-text font-display">
            {band.label}
          </p>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Effective temperature ≈ {effectiveT.toFixed(1)}
          </p>
          <p className="text-sm text-gray-500 mt-3 max-w-md mx-auto leading-relaxed">
            {band.description}
          </p>
        </div>
      </motion.div>

      <div className="text-center">
        <h2 className="font-display text-xl font-black text-gray-900 mb-1">
          Three ideas to carry forward
        </h2>
        <p className="text-xs text-gray-400">
          You will see these again in every stage today
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {INSIGHTS.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.15, duration: 0.5, ease: EASE }}
            className="card-glass rounded-2xl p-5 border-gradient"
          >
            <div className="text-3xl mb-3">{insight.icon}</div>
            <h3 className="font-display text-base font-bold text-gray-900 mb-2">
              {insight.title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-3">
              {insight.body}
            </p>
            <p className="text-xs text-accent/70 leading-relaxed">
              → {insight.link}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex justify-center gap-4 pt-4"
      >
        <Link
          href="/"
          className="rounded-xl border border-black/[0.06] bg-black/[0.03] px-8 py-3.5 font-bold text-gray-900 hover:bg-black/[0.04] hover:border-black/[0.08] transition-all"
        >
          Home
        </Link>
        <Link
          href="/stage/1"
          className="btn-shimmer rounded-xl bg-gradient-to-r from-accent to-amber-500 px-8 py-3.5 font-bold text-white shadow-lg shadow-accent/15 hover:shadow-accent/40 hover:scale-105 transition-all"
        >
          Go to Stage 1 →
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-center"
      >
        <a
          href="https://bbycroft.net/llm"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-accent transition-colors"
        >
          Explore Transformer internals — 3D visualization →
        </a>
      </motion.div>
    </motion.div>
  );
}
