/* ─── Types ─── */

export interface TokenCandidate {
  token: string;
  probability: number;
  isHallucination?: boolean;
}

export interface TokenStep {
  textSoFar: string;
  candidates: TokenCandidate[];
  teachingNote?: string;
  hallucinationReveal?: string;
  hallucinationFallback?: string;
}

export interface WarmupScenario {
  title: string;
  context: string;
  predictionHint: string;
  samplingHint: string;
  temperatureHints: Record<"low" | "mid" | "high", string>;
  steps: TokenStep[];
  trainingInsight: string;
  trainingCaption: string;
}

export interface TrainingCardMapping {
  text: string;
  boosts: Record<string, number>;
}

export interface ScorecardBand {
  maxT: number;
  label: string;
  description: string;
}

/* ─── Temperature math ─── */

export function applyTemperature(
  baseProbs: number[],
  temperature: number,
): number[] {
  const t = Math.max(temperature, 0.05);
  const scaled = baseProbs.map((p) => Math.pow(Math.max(p, 1e-8), 1 / t));
  const sum = scaled.reduce((a, b) => a + b, 0);
  return scaled.map((v) => v / sum);
}

/* ─── Scenario data ─── */

export const warmupScenario: WarmupScenario = {
  title: "You are the LLM",
  context:
    "East China DC sends an alert: a fast-moving SKU is about to fall below safety stock. As the model, you must generate the next word of an analysis.",
  predictionHint:
    "You are guessing what the model is most likely to output next. After you pick, compare your intuition to the real probability distribution.",
  samplingHint:
    "The model does not always pick the highest-probability token—it samples from the distribution, so the same question can yield different answers.",
  temperatureHints: {
    low: "🔦 Spotlight mode—a narrow beam that mostly lights up the top token. Very confident, little variety.",
    mid: "💡 Natural light—tokens are lit in proportion to their probability. Balance of certainty and creativity.",
    high: "🌅 Floodlight mode—a wide beam that also lights low-probability tokens. More creative, less predictable.",
  },

  steps: [
    {
      textSoFar: "East China SKU-4521 is critical; recommend",
      candidates: [
        { token: "immediately", probability: 0.52 },
        { token: "temporarily", probability: 0.21 },
        { token: "consider", probability: 0.14 },
        { token: "delay", probability: 0.08 },
        { token: "ignore", probability: 0.05 },
      ],
      teachingNote: "The model does the same thing—picks among candidates, often favoring the highest probability.",
    },
    {
      textSoFar: "East China SKU-4521 is critical; recommend immediately",
      candidates: [
        { token: "transfer from South China DC", probability: 0.32 },
        { token: "contact suppliers", probability: 0.28 },
        { token: "pause new orders", probability: 0.20 },
        { token: "activate air freight", probability: 0.12 },
        { token: "notify customers", probability: 0.08 },
      ],
      teachingNote:
        "Watch the distribution—\"transfer\" and \"contact suppliers\" are close; the model's choice is not absolute.",
    },
    {
      textSoFar:
        "East China SKU-4521 is critical; recommend immediately transfer from South China DC",
      candidates: [
        { token: "5,000 units", probability: 0.38 },
        { token: "2,000 units", probability: 0.28 },
        { token: "10,000 units", probability: 0.18 },
        { token: "500 units", probability: 0.1 },
        { token: "all available stock", probability: 0.06 },
      ],
      teachingNote:
        "These numbers come from statistical patterns in training data—the model has not queried real inventory.",
    },
    {
      textSoFar:
        "East China SKU-4521 is critical; recommend immediately transfer from South China DC 5,000 units. South China DC current stock",
      candidates: [
        {
          token: "ample (12,000 units)",
          probability: 0.67,
          isHallucination: true,
        },
        { token: "needs confirmation", probability: 0.13 },
        { token: "about 8,000 units", probability: 0.1 },
        { token: "below 3,000 units", probability: 0.06 },
        { token: "data missing", probability: 0.04 },
      ],
      teachingNote:
        "⚠️ Highest probability ≠ truth—this step hides a hallucination trap.",
      hallucinationReveal:
        "Like many people, you picked the highest-probability token—but it is fabricated. South China DC actually holds only 1,200 units, far below the transfer need. The model chose the statistically common phrase \"ample stock\" and invented a plausible number.",
      hallucinationFallback:
        "Good instinct—but the model would pick \"ample (12,000 units)\" ~67% of the time because that phrasing is common in training data. South China DC actually has only 1,200 units; the number is invented.",
    },
  ],

  trainingInsight:
    "After ingesting millions of supply-chain texts, the model learned that \"inventory alert\" is often followed by \"recommend transfer\"—but it never truly queried warehouse data.",
  trainingCaption: "Training = learning co-occurrence frequencies from massive text",
};

/* ─── Sampling demo (reuses last step candidates) ─── */

export const SAMPLING_CANDIDATES = warmupScenario.steps[3].candidates;

/* ─── Insight cards ─── */

export const INSIGHTS = [
  {
    icon: "🎯",
    title: "An LLM predicts the next token",
    body: "What you just did is what the model does thousands of times per second. It does not \"understand\" in the human sense—it picks statistically likely continuations.",
    link: "That is why Stage 1 teaches CCF—better prompts = better context for the model.",
  },
  {
    icon: "⚠️",
    title: "High probability ≠ correct",
    body: "67% makes \"ample stock\" feel trustworthy, but it can be fabricated. The smoother the answer, the more you should verify.",
    link: "Stage 1 covers hallucinations and when not to trust model output.",
  },
  {
    icon: "📊",
    title: "Training data sets the boundary",
    body: "The model only knows patterns from its training corpus. It has seen many \"ample stock\" phrases, so it leans that way—even when reality differs.",
    link: "Stage 2 unpacks enterprise data plumbing—garbage in, garbage out.",
  },
];

/* ─── Training card mappings ─── */

export const BAR_LABELS = [
  "recommend transfer",
  "ample stock",
  "notify customer",
  "pause orders",
  "data missing",
  "activate air freight",
];

export const TRAINING_CARDS: TrainingCardMapping[] = [
  {
    text: "East China DC alert: transfer initiated...",
    boosts: { "recommend transfer": 0.12, "pause orders": 0.02 },
  },
  {
    text: "Q3 South China inventory ample, no replenishment needed...",
    boosts: { "ample stock": 0.14 },
  },
  {
    text: "Recommend immediate transfer of 3,000 units from nearby DC...",
    boosts: { "recommend transfer": 0.13 },
  },
  {
    text: "SKU-8812 fell below safety stock...",
    boosts: { "recommend transfer": 0.08, "notify customer": 0.04 },
  },
  {
    text: "Supplier lead time slipped 14 days; recommend air freight...",
    boosts: { "activate air freight": 0.1, "notify customer": 0.03 },
  },
  {
    text: "Last week East China stockout SKU Top 5...",
    boosts: { "recommend transfer": 0.06, "data missing": 0.03 },
  },
  {
    text: "Inventory turns down 12% YoY...",
    boosts: { "pause orders": 0.05, "recommend transfer": 0.04 },
  },
  {
    text: "Auto-replenishment triggered: South→East 2,000 units...",
    boosts: { "recommend transfer": 0.14 },
  },
  {
    text: "After an inventory alert, transfer is the most common action...",
    boosts: { "recommend transfer": 0.15 },
  },
  {
    text: "Exception alert: 3 SKUs below safety line...",
    boosts: { "recommend transfer": 0.06, "pause orders": 0.04 },
  },
  {
    text: "Monthly report: average transfer response time 4.2h...",
    boosts: { "recommend transfer": 0.05, "data missing": 0.02 },
  },
  {
    text: "Historical data shows Q4 demand up 35%...",
    boosts: { "ample stock": 0.03, "recommend transfer": 0.06 },
  },
];

/* ─── Scorecard bands ─── */

export const SCORECARD_BANDS: ScorecardBand[] = [
  {
    maxT: 0.4,
    label: "Greedy Decoder",
    description:
      "You almost always pick the top token—like a model near temperature 0: stable but little creativity.",
  },
  {
    maxT: 0.8,
    label: "Conservative",
    description:
      "You favor high-probability options with occasional risk—like ~0.5 temperature, good for reports.",
  },
  {
    maxT: 1.2,
    label: "Balanced",
    description:
      "Your choices are evenly spread—like temperature 1.0, balancing certainty and creativity.",
  },
  {
    maxT: 1.6,
    label: "Adventurous",
    description:
      "You often pick low-probability tokens—like high temperature: great for brainstorming, easy to drift.",
  },
  {
    maxT: Infinity,
    label: "Random Sampler",
    description:
      "Your choices feel nearly random—like temperature 2.0: surprising but unreliable.",
  },
];

export function computeEffectiveTemperature(choiceRanks: number[]): number {
  if (choiceRanks.length === 0) return 1.0;
  const avg = choiceRanks.reduce((a, b) => a + b, 0) / choiceRanks.length;
  return Math.round(avg * 10) / 10;
}

export function getTemperatureHint(
  hints: WarmupScenario["temperatureHints"],
  t: number,
): string {
  if (t < 0.6) return hints.low;
  if (t <= 1.3) return hints.mid;
  return hints.high;
}

export function getScorecardBand(effectiveT: number): ScorecardBand {
  return SCORECARD_BANDS.find((b) => effectiveT <= b.maxT) ?? SCORECARD_BANDS[SCORECARD_BANDS.length - 1];
}

/** Deterministic expected-sample counts for a given temperature. */
export function simulateExpectedSamples(
  baseProbs: number[],
  temperature: number,
  count: number = 20,
): number[] {
  const adjusted = applyTemperature(baseProbs, temperature);
  const exact = adjusted.map((p) => p * count);
  const result = exact.map((v) => Math.floor(v));
  let remainder = count - result.reduce((a, b) => a + b, 0);
  const fracs = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) {
    result[fracs[k].i]++;
  }
  return result;
}
