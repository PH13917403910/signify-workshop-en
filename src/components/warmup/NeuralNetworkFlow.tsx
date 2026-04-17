"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BAR_LABELS } from "@/lib/warmup-data";

/* ─── Layout constants ─── */

const INPUT_LABELS = ["Text", "Word freq", "Context"];
const HIDDEN_COUNT = 5;
const OUTPUT_COUNT = BAR_LABELS.length; // 6

const COL_INPUT = 55;
const COL_HIDDEN = 210;
const COL_OUTPUT = 365;
const BAR_X = 400;
const BAR_MAX_W = 100;

function yPositions(count: number, height: number, pad: number) {
  const step = (height - pad * 2) / (count - 1 || 1);
  return Array.from({ length: count }, (_, i) => pad + i * step);
}

const SVG_W = 520;
const SVG_H = 240;
const PAD = 28;

const inputY = yPositions(INPUT_LABELS.length, SVG_H, PAD + 30);
const hiddenY = yPositions(HIDDEN_COUNT, SVG_H, PAD + 10);
const outputY = yPositions(OUTPUT_COUNT, SVG_H, PAD);

/* ─── Connection seed (stable random-looking weights for input→hidden) ─── */

function seededWeights(rows: number, cols: number, seed: number): number[][] {
  const w: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      const x = Math.sin(seed + r * 7.3 + c * 13.7) * 0.5 + 0.5;
      row.push(x);
    }
    w.push(row);
  }
  return w;
}

const INPUT_HIDDEN_W = seededWeights(INPUT_LABELS.length, HIDDEN_COUNT, 42);

/* ─── Types ─── */

interface Props {
  barValues: number[];
  lastCardBoosts: Record<string, number> | null;
  pulseTrigger: number;
  trainedCount: number;
}

/* ─── Component ─── */

export default function NeuralNetworkFlow({
  barValues,
  lastCardBoosts,
  pulseTrigger,
  trainedCount,
}: Props) {
  const [animating, setAnimating] = useState(false);
  const [animPhase, setAnimPhase] = useState(0); // 0 idle, 1 input, 2 hidden, 3 output

  const maturity = Math.min(trainedCount / 12, 1);

  const boostedIndices = useMemo(() => {
    if (!lastCardBoosts) return new Set<number>();
    const set = new Set<number>();
    for (const label of Object.keys(lastCardBoosts)) {
      const idx = BAR_LABELS.indexOf(label);
      if (idx >= 0) set.add(idx);
    }
    return set;
  }, [lastCardBoosts]);

  const triggerAnimation = useCallback(() => {
    setAnimating(true);
    setAnimPhase(1);
    const t1 = setTimeout(() => setAnimPhase(2), 250);
    const t2 = setTimeout(() => setAnimPhase(3), 600);
    const t3 = setTimeout(() => {
      setAnimPhase(0);
      setAnimating(false);
    }, 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  useEffect(() => {
    if (pulseTrigger > 0) {
      const cleanup = triggerAnimation();
      return cleanup;
    }
  }, [pulseTrigger, triggerAnimation]);

  const hiddenOutputOpacity = useMemo(() => {
    return hiddenY.map((_, hi) =>
      outputY.map((_, oi) => {
        const base = 0.03 + maturity * barValues[oi] * 0.5;
        return Math.min(base, 0.6);
      }),
    );
  }, [maturity, barValues]);

  return (
    <div className="card-glass rounded-xl px-3 py-3 sm:px-5 sm:py-4">
      <p className="text-[11px] text-gray-400 mb-2">
        How training data flows through the network:
      </p>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full"
        style={{ maxHeight: 220 }}
      >
        {/* ── Input → Hidden connections ── */}
        {inputY.map((iy, ii) =>
          hiddenY.map((hy, hi) => {
            const baseOp = 0.03 + maturity * INPUT_HIDDEN_W[ii][hi] * 0.15;
            const active = animating && (animPhase >= 1 && animPhase <= 2);
            return (
              <motion.line
                key={`ih-${ii}-${hi}`}
                x1={COL_INPUT + 8}
                y1={iy}
                x2={COL_HIDDEN - 8}
                y2={hy}
                stroke={active ? "#f97316" : "#1d1d1f"}
                strokeWidth={active ? 1.5 : 0.8}
                initial={false}
                animate={{
                  strokeOpacity: active ? 0.4 : baseOp,
                }}
                transition={{ duration: 0.3 }}
              />
            );
          }),
        )}

        {/* ── Hidden → Output connections ── */}
        {hiddenY.map((hy, hi) =>
          outputY.map((oy, oi) => {
            const baseOp = hiddenOutputOpacity[hi][oi];
            const isBoosted = boostedIndices.has(oi);
            const active =
              animating && animPhase >= 2 && animPhase <= 3 && isBoosted;
            return (
              <motion.line
                key={`ho-${hi}-${oi}`}
                x1={COL_HIDDEN + 8}
                y1={hy}
                x2={COL_OUTPUT - 8}
                y2={oy}
                stroke={active ? "#f97316" : "#1d1d1f"}
                strokeWidth={active ? 1.8 : 0.8}
                initial={false}
                animate={{
                  strokeOpacity: active ? 0.55 : baseOp,
                }}
                transition={{ duration: 0.3 }}
              />
            );
          }),
        )}

        {/* ── Input nodes ── */}
        {inputY.map((y, i) => {
          const active = animating && animPhase >= 1;
          return (
            <g key={`in-${i}`}>
              <motion.circle
                cx={COL_INPUT}
                cy={y}
                r={7}
                initial={false}
                animate={{
                  fill: active ? "#f97316" : "#e5e5ea",
                  r: active ? 8.5 : 7,
                }}
                transition={{ duration: 0.25 }}
              />
              <text
                x={COL_INPUT - 18}
                y={y + 4}
                textAnchor="end"
                className="text-[10px]"
                fill="#6e6e73"
              >
                {INPUT_LABELS[i]}
              </text>
            </g>
          );
        })}

        {/* ── Hidden nodes ── */}
        {hiddenY.map((y, i) => {
          const active = animating && animPhase >= 2;
          return (
            <motion.circle
              key={`hid-${i}`}
              cx={COL_HIDDEN}
              cy={y}
              r={6}
              initial={false}
              animate={{
                fill: active ? "#fb923c" : "#e5e5ea",
                r: active ? 7.5 : 6,
              }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
            />
          );
        })}

        {/* ── Output nodes + bar chart ── */}
        {outputY.map((y, i) => {
          const isBoosted = boostedIndices.has(i);
          const active = animating && animPhase >= 3 && isBoosted;
          const barW = Math.max(2, barValues[i] * BAR_MAX_W);
          return (
            <g key={`out-${i}`}>
              <motion.circle
                cx={COL_OUTPUT}
                cy={y}
                r={5.5}
                initial={false}
                animate={{
                  fill: active ? "#f97316" : "#e5e5ea",
                  r: active ? 7 : 5.5,
                }}
                transition={{ duration: 0.25 }}
              />
              {/* Bar */}
              <motion.rect
                x={BAR_X}
                y={y - 5}
                height={10}
                rx={2}
                fill="#f97316"
                initial={false}
                animate={{
                  width: barW,
                  fillOpacity: 0.25 + barValues[i] * 0.6,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              {/* Label */}
              <text
                x={BAR_X + BAR_MAX_W + 6}
                y={y + 3.5}
                className="text-[9px] font-mono"
                fill="#6e6e73"
              >
                {BAR_LABELS[i]} {Math.round(barValues[i] * 100)}%
              </text>
            </g>
          );
        })}

        {/* ── Layer labels ── */}
        <text
          x={COL_INPUT}
          y={SVG_H - 4}
          textAnchor="middle"
          className="text-[9px]"
          fill="#aeaeb2"
        >
          Input
        </text>
        <text
          x={COL_HIDDEN}
          y={SVG_H - 4}
          textAnchor="middle"
          className="text-[9px]"
          fill="#aeaeb2"
        >
          Hidden
        </text>
        <text
          x={COL_OUTPUT}
          y={SVG_H - 4}
          textAnchor="middle"
          className="text-[9px]"
          fill="#aeaeb2"
        >
          Output
        </text>
      </svg>

      {trainedCount === 0 && (
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          After feeding training text, watch how internal connections shift
        </p>
      )}
      {trainedCount > 0 && trainedCount < 12 && (
        <p className="text-[10px] text-amber-600/70 mt-1.5 text-center">
          Connections strengthen — the net learns what usually follows “inventory alert”
        </p>
      )}
      {trainedCount >= 12 && (
        <p className="text-[10px] text-accent/70 mt-1.5 text-center">
          Training done — the path to “suggest transfer” is strongest because it appears most often
        </p>
      )}
    </div>
  );
}
