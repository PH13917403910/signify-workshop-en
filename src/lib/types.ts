export type AdminCommand =
  | { type: "navigate"; route: string; label: string }
  | { type: "playVideo"; stageId: number }
  | { type: "stopVideo" };

export interface TimerState {
  running: boolean;
  remaining: number;
  total: number;
}

export interface PollState {
  open: boolean;
  showResults: boolean;
  votes: Record<string, string[]>;
  customTexts: Record<string, string>;
}

export interface Game4State {
  open: boolean;
  showResults: boolean;
  allocations: Record<string, Record<string, number>>;
}

export interface WorkshopSyncState {
  currentStage: number;
  eventDate: string;
  eventTime: string;
  teams: Record<string, { members: number; memberNames: string[] }>;
  polls: Record<number, PollState>;
  game3Phase: "red" | "green";
  game4: Game4State;
}

export interface StageInfo {
  id: number;
  title: string;
  subtitle: string;
  time: string;
  durationMin: number;
  icon: string;
  description: string;
  videoTitle: string;
  videoUrl: string;
  videoStart: number;
  videoEnd: number;
  videoQuote: string;
  videoQuoteCn: string;
  videoSpeaker: string;
  openingScript: string;
  participantNote: string;
  beforeAfter: { before: string; after: string };
  gameName: string;
  gameDurationMin: number;
  debriefQuestion: string;
  learningOutcomes?: string[];
}

export interface PollQuestion {
  stageId: number;
  question: string;
  options: { id: string; label: string; emoji: string }[];
}

export interface SharkProject {
  id: string;
  name: string;
  type: "Quick Win" | "Strategic Bet";
  description: string;
  plainDescription: string;
  icon: string;
  cost: string;
  costValue: number;
  timeline: string;
  risk: string;
  prerequisites: string;
  expectedBenefits: string;
  targetTeams: string;
  mondayAction: string;
  dependencies?: string[];
  conflicts?: string[];
}

export interface StressTestOption {
  id: string;
  label: string;
  correct: boolean;
}

export interface StressTest {
  id: string;
  scenario: string;
  question: string;
  options: StressTestOption[];
  insight: string;
}

export interface LegoCard {
  id: string;
  label: string;
  icon: string;
  color: string;
  isDistractor: boolean;
  description?: string;
  dataRole?: string;
  inputs?: string;
  outputs?: string;
}

export interface CanvasCard {
  id: string;
  cardId: string;
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface StickyNote {
  id: string;
  zone: string;
  text: string;
  type: "red" | "green";
  x: number;
  y: number;
  parentId?: string;
}

export interface WarmUpQuestion {
  question: string;
  options: { id: string; label: string }[];
  correctId: string;
  insight: string;
}

export interface ConceptCard {
  front: string;
  back: string;
  icon: string;
}

export interface FacilitatorStep {
  action: "video" | "script" | "game" | "debrief" | "poll" | "break";
  label: string;
  duration: string;
  tips?: string;
}

export interface AgentSimStep {
  type: "receive" | "plan" | "tool_call" | "reasoning" | "action" | "report";
  label: string;
  thinking: string;
  toolCall?: string;
  result?: string;
  icon: string;
}

export interface SimulationStep {
  from: string;
  to: string;
  label: string;
  data: string;
}

export interface WhatIfPrediction {
  id: string;
  label: string;
  correct: boolean;
}

export interface WhatIfScenario {
  id: string;
  toggleOff: string;
  label: string;
  breakAt: string;
  errorMessage: string;
  insight: string;
  predictions: WhatIfPrediction[];
}

export interface SimCheckpoint {
  afterStep: number;
  question: string;
  options: { id: string; label: string; correct: boolean }[];
  explanation: string;
}

export interface CrisisAgent {
  id: string;
  name: string;
  icon: string;
  specialty: string;
  color: string;
  workflows: Record<string, CrisisAgentWorkflow>;
}

export interface CrisisAgentWorkflow {
  crisisId: string;
  steps: { action: string; detail: string; duration: string }[];
  output: string;
  decisionComments?: Record<string, string>;
  conflictNote?: string;
}

export interface AiConsultantQuestion {
  id: string;
  label: string;
  icon: string;
  answer: string;
}

export const TEAM_IDS = ["demand", "supply", "om", "logistics"] as const;
export type TeamId = (typeof TEAM_IDS)[number];

export const TEAM_LABELS: Record<TeamId, string> = {
  demand: "Demand Planning",
  supply: "Supply Planning",
  om: "Order Desk",
  logistics: "Logistics",
};

export const TEAM_COLORS: Record<TeamId, string> = {
  demand: "#f97316",
  supply: "#f59e0b",
  om: "#94a3b8",
  logistics: "#10b981",
};
