"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  pointerWithin,
} from "@dnd-kit/core";
import { getSocket } from "@/lib/socket-client";
import { useTeam } from "@/hooks/useTeam";
import { legoCards, GAME2_SCENARIO, ARCHITECTURE_SIM_STEPS, WHAT_IF_SCENARIOS, SIMULATION_CHECKPOINTS, CONNECTION_LABEL_HINTS, REFERENCE_ARCHITECTURE, ARCHITECTURE_PRINCIPLES } from "@/lib/workshop-data";
import type { CanvasCard, Connection, LegoCard } from "@/lib/types";
import StageRecap from "@/components/shared/StageRecap";
import TeamStatusBar from "@/components/shared/TeamStatusBar";
import SubmitCelebration from "@/components/shared/SubmitCelebration";

const CARD_W = 160;
const CARD_H = 52;

function PaletteCard({
  card,
  used,
  onShowInfo,
}: {
  card: LegoCard;
  used: boolean;
  onShowInfo: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${card.id}`,
    data: { card, source: "palette" },
    disabled: used,
  });

  return (
    <div className="relative group">
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`flex items-center gap-3 rounded-xl px-4 py-3 cursor-grab active:cursor-grabbing transition-all ${
          used
            ? "opacity-30 pointer-events-none"
            : isDragging
              ? "opacity-50"
              : "hover:scale-105"
        }`}
        style={{
          backgroundColor: `${card.color}20`,
          border: `1px solid ${card.color}40`,
        }}
      >
        <span className="text-2xl">{card.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{card.label}</p>
          {card.dataRole && (
            <span className="text-[9px] text-gray-400">{card.dataRole}</span>
          )}
        </div>
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            onShowInfo(card.id);
          }}
          className="h-5 w-5 rounded-full bg-black/[0.03] text-gray-400 text-[11px] hover:bg-black/[0.05] hover:text-gray-900 transition shrink-0 flex items-center justify-center"
          title="View details"
        >
          ?
        </button>
      </div>
    </div>
  );
}

function CanvasCardComponent({
  item,
  card,
  isConnecting,
  onStartConnect,
  onRemove,
}: {
  item: CanvasCard;
  card: LegoCard;
  isConnecting: boolean;
  onStartConnect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `canvas-${item.id}`,
    data: { item, source: "canvas" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`absolute flex items-center gap-2 rounded-xl px-3 py-2.5 shadow-lg cursor-grab active:cursor-grabbing select-none group transition-all duration-500 ${isDragging ? "opacity-50 z-50" : "z-10"}`}
      style={{
        left: item.x,
        top: item.y,
        backgroundColor: `${card.color}30`,
        border: `2px solid ${card.color}80`,
        minWidth: CARD_W,
      }}
      data-card-id={card.id}
      {...listeners}
      {...attributes}
    >
      <span className="text-xl">{card.icon}</span>
      <span className="text-sm font-bold text-gray-900">{card.label}</span>
      <button
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartConnect(item.id);
        }}
        className={`ml-auto h-5 w-5 rounded-full border-2 shrink-0 transition ${
          isConnecting
            ? "bg-accent border-accent scale-125"
            : "border-black/[0.12] hover:border-accent hover:bg-accent/20"
        }`}
        title="Connect"
      />
      <button
        onPointerDown={(e) => {
          e.stopPropagation();
          onRemove(item.id);
        }}
        className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-400"
        title="Remove"
      >
        ×
      </button>
    </div>
  );
}

function ConnectionLine({
  conn,
  cards,
  onLabelChange,
  onDelete,
}: {
  conn: Connection;
  cards: CanvasCard[];
  onLabelChange: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}) {
  const from = cards.find((c) => c.id === conn.from);
  const to = cards.find((c) => c.id === conn.to);
  if (!from || !to) return null;

  const x1 = from.x + CARD_W / 2;
  const y1 = from.y + CARD_H / 2;
  const x2 = to.x + CARD_W / 2;
  const y2 = to.y + CARD_H / 2;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g>
      <defs>
        <marker
          id={`arrow-${conn.id}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
        </marker>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#f97316"
        strokeWidth={2}
        markerEnd={`url(#arrow-${conn.id})`}
        opacity={0.7}
      />
      <foreignObject x={midX - 60} y={midY - 14} width={120} height={28}>
        <div className="flex items-center gap-1">
          <input
            value={conn.label}
            onChange={(e) => onLabelChange(conn.id, e.target.value)}
            placeholder="Label…"
            className="w-full rounded bg-gray-50 border border-black/[0.06] px-2 py-0.5 text-[11px] text-gray-900 text-center focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            onClick={() => onDelete(conn.id)}
            className="text-red-500 hover:text-red-300 text-xs shrink-0"
          >
            ×
          </button>
        </div>
      </foreignObject>
    </g>
  );
}

function CanvasDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });
  return (
    <div
      ref={setNodeRef}
      className={`transition-colors rounded-2xl ${isOver ? "ring-2 ring-accent/50" : ""}`}
    >
      {children}
    </div>
  );
}

export default function LegoArchitect() {
  const { team } = useTeam();
  const [canvasCards, setCanvasCards] = useState<CanvasCard[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasH, setCanvasH] = useState(500);
  const [inspectCard, setInspectCard] = useState<string | null>(null);
  const [designRationale, setDesignRationale] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [simPhase, setSimPhase] = useState<"build" | "simulate" | "whatif">("build");
  const [simStep, setSimStep] = useState(-1);
  const [simRunning, setSimRunning] = useState(false);
  const [simPaused, setSimPaused] = useState(false);
  const [checkpointAnswer, setCheckpointAnswer] = useState<string | null>(null);
  const [checkpointRevealed, setCheckpointRevealed] = useState(false);
  const simStepRef = useRef(0);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [whatIfActive, setWhatIfActive] = useState<string | null>(null);
  const [whatIfDone, setWhatIfDone] = useState<Set<string>>(new Set());
  const [whatIfPrediction, setWhatIfPrediction] = useState<Record<string, string>>({});
  const [whatIfRevealed, setWhatIfRevealed] = useState<Set<string>>(new Set());
  const [highlightNode, setHighlightNode] = useState<string | null>(null);

  // Restore game state on mount (handles page refresh)
  useEffect(() => {
    if (!team) return;
    getSocket().emit(
      "game:getData",
      { teamId: team, gameId: 2 },
      (data: { cards?: CanvasCard[]; connections?: Connection[]; designRationale?: string; submitted?: boolean } | null) => {
        if (!data) return;
        if (data.submitted) {
          setSubmitted(true);
          if (data.cards) setCanvasCards(data.cards);
          if (data.connections) setConnections(data.connections);
          if (data.designRationale) setDesignRationale(data.designRationale);
        }
      },
    );
  }, [team]);

  const allWhatIfDone = WHAT_IF_SCENARIOS.length > 0 && WHAT_IF_SCENARIOS.every((s) => whatIfDone.has(s.id));

  const stopSimTimer = () => {
    if (simTimerRef.current) { clearInterval(simTimerRef.current); simTimerRef.current = null; }
  };

  const startSimTimer = () => {
    simTimerRef.current = setInterval(() => {
      const next = simStepRef.current + 1;
      if (next >= ARCHITECTURE_SIM_STEPS.length) {
        stopSimTimer();
        setSimRunning(false);
        setSimStep(ARCHITECTURE_SIM_STEPS.length - 1);
        return;
      }
      simStepRef.current = next;
      setSimStep(next);
      setHighlightNode(ARCHITECTURE_SIM_STEPS[next].from);
      if (SIMULATION_CHECKPOINTS.find((cp) => cp.afterStep === next)) {
        stopSimTimer();
        setSimPaused(true);
      }
    }, 1800);
  };

  const runSimulation = () => {
    setSimPhase("simulate");
    setSimStep(0);
    simStepRef.current = 0;
    setSimRunning(true);
    setSimPaused(false);
    const firstCp = SIMULATION_CHECKPOINTS.find((cp) => cp.afterStep === 0);
    if (firstCp) { setSimPaused(true); } else { startSimTimer(); }
  };

  const resumeAfterCheckpoint = () => {
    setSimPaused(false);
    setCheckpointAnswer(null);
    setCheckpointRevealed(false);
    startSimTimer();
  };

  const runWhatIf = (scenarioId: string) => {
    setWhatIfActive(scenarioId);
    setWhatIfRevealed((prev) => new Set(prev).add(scenarioId));
    setTimeout(() => {
      setWhatIfDone((prev) => new Set(prev).add(scenarioId));
    }, 2500);
  };

  useEffect(() => {
    const updateH = () => {
      setCanvasH(Math.max(400, window.innerHeight - 280));
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConnectingFrom(null);
    };
    updateH();
    window.addEventListener("resize", updateH);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", updateH);
      window.removeEventListener("keydown", handleKeyDown);
      stopSimTimer();
    };
  }, []);

  const usedCardIds = new Set(canvasCards.map((c) => c.cardId));

  const clamp = (x: number, y: number): { x: number; y: number } => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const maxX = rect ? rect.width - CARD_W : 600;
    const maxY = rect ? rect.height - CARD_H : 400;
    return {
      x: Math.max(0, Math.min(maxX, x)),
      y: Math.max(0, Math.min(maxY, y)),
    };
  };

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over, delta, activatorEvent } = e;
    const data = active.data.current;
    if (!data) return;

    if (data.source === "palette") {
      if (over?.id !== "canvas") return;
      const card = data.card as LegoCard;
      if (usedCardIds.has(card.id)) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const pointer = activatorEvent as PointerEvent;
      const dropX = pointer.clientX + delta.x - rect.left - CARD_W / 2;
      const dropY = pointer.clientY + delta.y - rect.top - CARD_H / 2;
      const pos = clamp(dropX, dropY);

      setCanvasCards((prev) => [
        ...prev,
        { id: `c-${Date.now()}`, cardId: card.id, x: pos.x, y: pos.y },
      ]);
    } else if (data.source === "canvas") {
      const item = data.item as CanvasCard;
      setCanvasCards((prev) =>
        prev.map((c) => {
          if (c.id !== item.id) return c;
          const pos = clamp(c.x + delta.x, c.y + delta.y);
          return { ...c, ...pos };
        }),
      );
    }
  };

  const handleStartConnect = useCallback(
    (id: string) => {
      if (!connectingFrom) {
        setConnectingFrom(id);
      } else if (connectingFrom !== id) {
        const exists = connections.some(
          (c) =>
            (c.from === connectingFrom && c.to === id) ||
            (c.from === id && c.to === connectingFrom),
        );
        if (!exists) {
          setConnections((prev) => [
            ...prev,
            {
              id: `conn-${Date.now()}`,
              from: connectingFrom,
              to: id,
              label: "",
            },
          ]);
        }
        setConnectingFrom(null);
      } else {
        setConnectingFrom(null);
      }
    },
    [connectingFrom, connections],
  );

  const removeFromCanvas = useCallback((itemId: string) => {
    setCanvasCards((prev) => prev.filter((c) => c.id !== itemId));
    setConnections((prev) =>
      prev.filter((c) => c.from !== itemId && c.to !== itemId),
    );
  }, []);

  const usedCardTypes = new Set(canvasCards.map((c) => c.cardId));
  const hasDataSource = usedCardTypes.has("hana");
  const hasConnector = usedCardTypes.has("mcp");
  const hasReasoning = usedCardTypes.has("llm");
  const hasExecution = usedCardTypes.has("agent");
  const usedDistractors = canvasCards.filter((c) => {
    const card = legoCards.find((lc) => lc.id === c.cardId);
    return card?.isDistractor;
  });
  const validationChecks = [
    { id: "data-source", pass: hasDataSource, label: "Data source", icon: "💾" },
    { id: "connector", pass: hasConnector, label: "Secure link", icon: "🔗" },
    { id: "reasoning", pass: hasReasoning, label: "Reasoning", icon: "🧠" },
    { id: "execution", pass: hasExecution, label: "Execution loop", icon: "⚡" },
  ];
  const allCriteriaMet = validationChecks.every((v) => v.pass);
  const connectionCount = connections.filter((c) => c.label.trim()).length;

  const handleSubmit = () => {
    if (!team) return;
    setSubmitted(true);
    getSocket().emit("game2:submit", {
      teamId: team,
      cards: canvasCards,
      connections,
      designRationale,
    });
  };

  const activeCard = activeId?.startsWith("palette-")
    ? legoCards.find((c) => `palette-${c.id}` === activeId)
    : null;

  return (
    <div className="space-y-4">
      <SubmitCelebration show={submitted} message="Architecture submitted!" />

      {/* Mobile hint */}
      <div className="md:hidden rounded-xl bg-yellow-500/5 border border-yellow-500/20 px-4 py-2.5 text-xs text-yellow-600 text-center">
        💻 This activity uses drag-and-drop — a desktop browser works best
      </div>

      {/* Scenario */}
      <div className="card-glass rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📦</span>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">
              Scenario: {GAME2_SCENARIO.title}
            </h3>
            <p className="text-sm text-gray-600">{GAME2_SCENARIO.description}</p>
            <p className="text-xs text-accent mt-2">
              💡 {GAME2_SCENARIO.hint}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              ⚠ {GAME2_SCENARIO.challenge}
            </p>
          </div>
        </div>
      </div>

      {/* Inspected card detail */}
      {inspectCard && (() => {
        const card = legoCards.find((c) => c.id === inspectCard);
        if (!card) return null;
        return (
          <div
            className="rounded-xl p-4 animate-slide-up"
            style={{
              backgroundColor: `${card.color}10`,
              border: `1px solid ${card.color}30`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{card.icon}</span>
                <span className="text-sm font-bold text-gray-900">{card.label}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                  style={{ backgroundColor: `${card.color}20`, color: card.color }}
                >
                  {card.dataRole}
                </span>
              </div>
              <button
                onClick={() => setInspectCard(null)}
                className="text-gray-400 hover:text-gray-900 text-xs"
              >
                Close ✕
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-2">{card.description}</p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-white/50 p-2">
                <span className="text-gray-400">In →</span>
                <p className="text-gray-600 mt-0.5">{card.inputs}</p>
              </div>
              <div className="rounded-lg bg-white/50 p-2">
                <span className="text-gray-400">→ Out</span>
                <p className="text-gray-600 mt-0.5">{card.outputs}</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Step guide */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
        <span className={canvasCards.length > 0 ? "text-green-600" : "text-gray-400"}>
          ① Drag blocks onto the canvas
        </span>
        <span>→</span>
        <span className={connections.length > 0 ? "text-green-600" : "text-gray-400"}>
          ② Tap the dot to connect
        </span>
        <span>→</span>
        <span className={connectionCount > 0 ? "text-green-600" : "text-gray-400"}>
          ③ Label each connection
        </span>
        <span>→</span>
        <span className={designRationale.trim() ? "text-green-600" : "text-gray-400"}>
          ④ Write rationale
        </span>
        <span>→</span>
        <span>⑤ Submit</span>
      </div>

      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={pointerWithin}
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Palette */}
          <div className="md:w-52 shrink-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Block library
            </p>
            <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
              {legoCards.map((card) => (
                <PaletteCard
                  key={card.id}
                  card={card}
                  used={usedCardIds.has(card.id)}
                  onShowInfo={(id) => setInspectCard(inspectCard === id ? null : id)}
                />
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-2 hidden md:block">
              Tap ? for details, drag onto the canvas
            </p>
          </div>

          {/* Canvas */}
          <div className="flex-1 min-w-0">
            <CanvasDropZone>
              <div
                ref={canvasRef}
                className="relative rounded-2xl border-2 border-dashed border-black/[0.06] bg-gray-50"
                style={{ height: canvasH }}
              >
                {connectingFrom && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 rounded-full bg-accent/20 px-3 py-1 text-xs text-accent">
                    Tap another block’s dot to finish the link (ESC to cancel)
                  </div>
                )}

                {/* Connection lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  {connections.map((conn) => (
                    <ConnectionLine
                      key={conn.id}
                      conn={conn}
                      cards={canvasCards}
                      onLabelChange={(id, label) =>
                        setConnections((prev) =>
                          prev.map((c) => (c.id === id ? { ...c, label } : c)),
                        )
                      }
                      onDelete={(id) =>
                        setConnections((prev) =>
                          prev.filter((c) => c.id !== id),
                        )
                      }
                    />
                  ))}
                </svg>

                {/* Canvas cards */}
                {canvasCards.map((item) => {
                  const card = legoCards.find((c) => c.id === item.cardId)!;
                  return (
                    <CanvasCardComponent
                      key={item.id}
                      item={item}
                      card={card}
                      isConnecting={connectingFrom === item.id}
                      onStartConnect={handleStartConnect}
                      onRemove={removeFromCanvas}
                    />
                  );
                })}

                {canvasCards.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                    ← Drag blocks here to start your architecture
                  </div>
                )}
              </div>
            </CanvasDropZone>

            {/* Actions bar */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => {
                  setCanvasCards([]);
                  setConnections([]);
                  setConnectingFrom(null);
                  setShowValidation(false);
                }}
                className="rounded-lg bg-black/[0.03] px-4 py-2 text-sm text-gray-500 hover:bg-black/[0.05]"
              >
                Clear canvas
              </button>
              <button
                onClick={() => setShowValidation(!showValidation)}
                className="rounded-lg bg-accent/10 px-4 py-2 text-sm text-accent hover:bg-accent/20 transition"
              >
                {showValidation ? "Hide checks" : "🔍 Architecture check"}
              </button>
            </div>
          </div>
        </div>

        {/* Connection Label Hints */}
        {connections.length > 0 && connections.some((c) => !c.label.trim()) && !submitted && (
          <div className="rounded-xl bg-gray-50 border border-black/[0.04] p-3 animate-slide-up">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              💡 Connection label hints (tap to fill the next unlabeled link)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CONNECTION_LABEL_HINTS.map((hint) => (
                <button
                  key={hint}
                  onClick={() => {
                    setConnections((prev) => {
                      const idx = prev.findIndex((c) => !c.label.trim());
                      if (idx === -1) return prev;
                      return prev.map((c, i) => (i === idx ? { ...c, label: hint } : c));
                    });
                  }}
                  className="rounded-md bg-accent/10 border border-accent/20 px-2.5 py-1 text-[11px] text-accent hover:bg-accent/20 transition"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Architecture Validation Panel */}
        {showValidation && canvasCards.length > 0 && (
          <div className="rounded-2xl border border-black/[0.06] bg-gray-50 p-5 space-y-4 animate-slide-up">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Architecture sanity check
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {validationChecks.map((v) => (
                <div
                  key={v.id}
                  className={`rounded-xl p-3 text-center transition-all ${
                    v.pass
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-gray-100 border border-black/[0.04]"
                  }`}
                >
                  <p className="text-lg">{v.icon}</p>
                  <p className={`text-[11px] font-bold mt-1 ${v.pass ? "text-green-600" : "text-gray-400"}`}>
                    {v.pass ? "✓ " : "✗ "}{v.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-[11px]">
              <span className={connections.length >= 3 ? "text-green-600" : "text-gray-400"}>
                Links: {connections.length} (aim for ≥ 3)
              </span>
              <span className={connectionCount >= 3 ? "text-green-600" : "text-gray-400"}>
                Labeled: {connectionCount} (label all if you can)
              </span>
              {usedDistractors.length > 0 && (
                <span className="text-yellow-600">
                  ⚠ {usedDistractors.length} block(s) may be non-core — double-check before you submit
                </span>
              )}
            </div>
            {allCriteriaMet && connectionCount >= 3 && (
              <div className={`rounded-lg px-3 py-2 text-xs ${
                usedDistractors.length === 0
                  ? "bg-green-500/10 border border-green-500/20 text-green-600"
                  : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-600"
              }`}>
                {usedDistractors.length === 0
                  ? "✅ Check passed — four core blocks present and links labeled"
                  : "⚠ Core blocks are present, but there may be extras — debrief will show the reference"}
              </div>
            )}
          </div>
        )}

        {/* Phase 2: Run Simulation */}
        {showValidation && allCriteriaMet && connectionCount >= 3 && simPhase === "build" && (
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5 text-center space-y-3 animate-slide-up">
            <p className="text-lg">🚀</p>
            <p className="text-sm font-bold text-gray-900">Checks passed!</p>
            <p className="text-xs text-gray-500">Your stack is ready. Run a simulation to see how data flows through it.</p>
            <button
              onClick={runSimulation}
              className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white hover:brightness-110"
            >
              ▶ Run simulation
            </button>
          </div>
        )}

        {simPhase !== "build" && (
          <div className="rounded-2xl border border-accent/20 bg-gray-50 p-5 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <h4 className="text-sm font-bold text-accent">Simulation: VIP order delay</h4>
              </div>
              {simRunning && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-accent">
                  <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  Running…
                </span>
              )}
              {!simRunning && simStep >= ARCHITECTURE_SIM_STEPS.length - 1 && simPhase === "simulate" && (
                <span className="text-[11px] text-green-600">✓ Simulation done</span>
              )}
            </div>

            <div className="space-y-2">
              {ARCHITECTURE_SIM_STEPS.slice(0, simStep + 1).map((step, i) => {
                const isLatest = i === simStep;
                const fromIcon = step.from === "trigger" ? "📥" : step.from === "complete" ? "✅" :
                  step.from === "agent" ? "🤖" : step.from === "mcp" ? "🔌" :
                  step.from === "hana" ? "💾" : step.from === "llm" ? "🧠" : "➡️";
                const toIcon = step.to === "complete" ? "✅" : step.to === "trigger" ? "📥" :
                  step.to === "agent" ? "🤖" : step.to === "mcp" ? "🔌" :
                  step.to === "hana" ? "💾" : step.to === "llm" ? "🧠" : "➡️";
                return (
                  <div
                    key={i}
                    className={`rounded-lg border px-4 py-3 transition-all duration-500 ${
                      isLatest ? "border-accent/30 bg-accent/[0.06] animate-slide-up" : "border-black/[0.04] bg-black/[0.02] opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span>{fromIcon}</span>
                      <span className="text-gray-400">→</span>
                      <span>{toIcon}</span>
                      <span className="text-gray-500 font-medium">{step.label}</span>
                    </div>
                    <code className="text-[11px] text-accent/70 bg-accent/5 rounded px-2 py-0.5 block break-all">
                      {step.data}
                    </code>
                  </div>
                );
              })}
            </div>

            {/* Checkpoint pause */}
            {simPaused && (() => {
              const cp = SIMULATION_CHECKPOINTS.find((c) => c.afterStep === simStep);
              if (!cp) return null;
              return (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-4 space-y-3 animate-slide-up">
                  <p className="text-xs font-bold text-amber-600">⏸ Checkpoint</p>
                  <p className="text-sm font-bold text-gray-900">{cp.question}</p>
                  <div className="space-y-2">
                    {cp.options.map((opt) => {
                      const selected = checkpointAnswer === opt.id;
                      const revealed = checkpointRevealed;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => { if (!revealed) { setCheckpointAnswer(opt.id); setCheckpointRevealed(true); } }}
                          disabled={revealed}
                          className={`w-full text-left rounded-lg px-4 py-2.5 text-xs transition border ${
                            revealed && opt.correct
                              ? "bg-green-500/10 border-green-500/30 text-green-600"
                              : revealed && selected && !opt.correct
                                ? "bg-red-500/10 border-red-500/30 text-red-500"
                                : selected
? "bg-accent/10 border-accent/30 text-gray-900"
                                : "bg-gray-50 border-black/[0.04] text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {opt.label}
                          {revealed && opt.correct && " ✓"}
                        </button>
                      );
                    })}
                  </div>
                  {checkpointRevealed && (
                    <div className="space-y-2 animate-slide-up">
                      <p className="text-xs text-gray-500 leading-relaxed bg-accent/5 rounded-lg p-3 border border-accent/10">
                        {cp.explanation}
                      </p>
                      <button
                        onClick={resumeAfterCheckpoint}
                        className="w-full rounded-lg bg-accent/20 px-4 py-2 text-xs font-bold text-accent hover:bg-accent/30 transition"
                      >
                        Continue simulation →
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {!simRunning && !simPaused && simStep >= ARCHITECTURE_SIM_STEPS.length - 1 && (
              <div className="space-y-3 animate-slide-up">
                <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-4 text-center">
                  <p className="text-xs text-green-600 font-bold mb-1">Simulation complete</p>
                  <div className="flex justify-center gap-6 text-xs mt-2">
                    <div className="text-center">
                      <p className="text-gray-400">Manual handling</p>
                      <p className="text-gray-900 font-bold text-lg">~4 h</p>
                    </div>
                    <div className="text-2xl text-gray-400">→</div>
                    <div className="text-center">
                      <p className="text-gray-400">AI Agent</p>
                      <p className="text-accent font-bold text-lg">~30 s</p>
                    </div>
                  </div>
                </div>

                {simPhase === "simulate" && (
                  <button
                    onClick={() => setSimPhase("whatif")}
                    className="w-full rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm font-bold text-amber-600 hover:bg-amber-500/20 transition"
                  >
                    🔬 Open What-If stress test →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Phase 3: What-If Scenarios */}
        {simPhase === "whatif" && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-5 space-y-4 animate-slide-up">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔬</span>
              <h4 className="text-sm font-bold text-amber-600">What-If stress test</h4>
              <span className="text-[11px] text-gray-400 ml-auto">
                {whatIfDone.size}/{WHAT_IF_SCENARIOS.length} scenarios run
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Turn off one layer and watch where the flow breaks — see why each tier matters.
            </p>
            <div className="space-y-3">
              {WHAT_IF_SCENARIOS.map((scenario) => {
                const done = whatIfDone.has(scenario.id);
                const revealed = whatIfRevealed.has(scenario.id);
                const isActive = whatIfActive === scenario.id && !done;
                const hasPrediction = !!whatIfPrediction[scenario.id];
                const predictionCorrect = scenario.predictions.find(
                  (p) => p.id === whatIfPrediction[scenario.id]
                )?.correct;
                return (
                  <div
                    key={scenario.id}
                    className={`rounded-xl border p-4 transition-all ${
                      done ? "border-black/[0.06] bg-gray-50" :
                      isActive ? "border-red-500/30 bg-red-500/[0.04]" :
                      "border-amber-500/20 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-900">
                        {scenario.label}
                      </span>
                      {done && (
                        <span className="text-[11px] text-green-600">✓ Done</span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-red-500">
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          Failing…
                        </span>
                      )}
                    </div>

                    {/* Prediction phase */}
                    {!revealed && !done && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500">
                          If {scenario.label}, what do you predict happens?
                        </p>
                        <div className="space-y-1.5">
                          {scenario.predictions.map((pred) => (
                            <button
                              key={pred.id}
                              onClick={() => setWhatIfPrediction((prev) => ({ ...prev, [scenario.id]: pred.id }))}
                              className={`w-full text-left rounded-lg px-3 py-2 text-xs transition border ${
                                whatIfPrediction[scenario.id] === pred.id
                                  ? "bg-accent/10 border-accent/30 text-gray-900"
                                  : "bg-gray-50 border-black/[0.04] text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              {pred.label}
                            </button>
                          ))}
                        </div>
                        {hasPrediction && (
                          <button
                            onClick={() => runWhatIf(scenario.id)}
                            className="w-full rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/20 transition"
                          >
                            🔴 Shut down & verify my guess
                          </button>
                        )}
                      </div>
                    )}

                    {/* Result phase */}
                    {(isActive || done) && (
                      <div className="space-y-2 animate-slide-up">
                        <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
                          <p className="text-xs text-red-500 leading-relaxed font-mono">
                            {scenario.errorMessage}
                          </p>
                        </div>
                        {done && (
                          <>
                            <div className={`rounded-lg px-3 py-2 text-xs font-bold ${
                              predictionCorrect
                                ? "bg-green-500/10 border border-green-500/20 text-green-600"
                                : "bg-amber-500/10 border border-amber-500/20 text-amber-600"
                            }`}>
                              {predictionCorrect ? "✓ Prediction matched!" : "✗ Off target — here is what happened:"}
                            </div>
                            <div className="rounded-lg bg-accent/5 border border-accent/20 p-3">
                              <p className="text-xs text-gray-600 leading-relaxed">
                                <span className="text-accent font-bold">Insight:</span> {scenario.insight}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {allWhatIfDone && (
              <div className="space-y-3 animate-slide-up">
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs text-green-600 text-center">
                  ✅ Stress test complete — you saw why each layer matters
                </div>
                <div className="rounded-xl border border-accent/20 bg-accent/[0.03] p-4">
                  <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3">🏛 Three architecture principles</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {ARCHITECTURE_PRINCIPLES.map((p) => (
                      <div key={p.title} className="rounded-lg bg-gray-50 border border-black/[0.04] p-3">
                        <p className="text-lg mb-1">{p.icon}</p>
                        <p className="text-xs font-bold text-gray-900 mb-1">{p.title}</p>
                        <p className="text-[11px] text-gray-500 leading-relaxed">{p.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Design rationale */}
        {canvasCards.length > 0 && !submitted && (
          <div className="rounded-2xl border border-black/[0.06] bg-gray-50 p-5 space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              📝 Design rationale (required before submit)
            </h4>
            <div className="grid gap-2 md:grid-cols-2 mb-2">
              {GAME2_SCENARIO.designQuestions.map((q, i) => (
                <p key={i} className="text-[11px] text-gray-400 flex items-start gap-1.5">
                  <span className="text-accent shrink-0">{i + 1}.</span>
                  {q}
                </p>
              ))}
            </div>
            <textarea
              value={designRationale}
              onChange={(e) => setDesignRationale(e.target.value)}
              placeholder="Answer the prompts above with a short rationale for your architecture…"
              rows={4}
              className="w-full rounded-xl bg-gray-50 border border-black/[0.06] px-4 py-3 text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            />
          </div>
        )}

        {/* Team status — near submit for context */}
        <TeamStatusBar gameId={2} />

        {/* Submit area */}
        <div className="flex justify-end">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={canvasCards.length === 0 || !designRationale.trim() || !allWhatIfDone}
              className="rounded-xl bg-green-600 px-8 py-3 font-bold text-white hover:bg-green-500 disabled:opacity-35"
            >
              🏁 Submit architecture
            </button>
          ) : (
            <span className="text-green-600 text-sm font-bold flex items-center gap-2">
              ✅ Submitted
            </span>
          )}
        </div>

        {/* Reference Architecture — revealed after submission */}
        {submitted && (
          <div className="rounded-2xl border border-accent/20 bg-accent/[0.03] p-5 space-y-4 animate-slide-up">
            <h4 className="text-sm font-bold text-accent">📐 Reference architecture</h4>
            <p className="text-xs text-gray-500">{REFERENCE_ARCHITECTURE.explanation}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 py-3">
              {REFERENCE_ARCHITECTURE.nodes.map((nodeId, i) => {
                const card = legoCards.find((c) => c.id === nodeId);
                if (!card) return null;
                return (
                  <div key={nodeId} className="flex items-center gap-3">
                    <div
                      className="rounded-lg px-3 py-2 text-xs font-bold text-gray-900 flex items-center gap-1.5"
                      style={{ backgroundColor: `${card.color}30`, border: `1px solid ${card.color}60` }}
                    >
                      <span>{card.icon}</span> {card.label}
                    </div>
                    {i < REFERENCE_ARCHITECTURE.nodes.length - 1 && (
                      <span className="text-accent text-lg">↔</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="space-y-1.5">
              {REFERENCE_ARCHITECTURE.connections.map((conn, i) => {
                const fromCard = legoCards.find((c) => c.id === conn.from);
                const toCard = legoCards.find((c) => c.id === conn.to);
                return (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-gray-500">
                    <span className="font-bold text-gray-900">{fromCard?.icon} {fromCard?.label}</span>
                    <span className="text-accent">→</span>
                    <span className="font-bold text-gray-900">{toCard?.icon} {toCard?.label}</span>
                    <span className="text-gray-400">: {conn.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400 text-center">
              Compare your diagram to the reference: do arrows and labels match the data flow?
            </p>
          </div>
        )}

        {/* Stage Recap - shows after submission */}
        {submitted && <StageRecap stageId={2} />}

        <DragOverlay>
          {activeCard && (
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3 shadow-2xl"
              style={{
                backgroundColor: `${activeCard.color}40`,
                border: `2px solid ${activeCard.color}`,
              }}
            >
              <span className="text-xl">{activeCard.icon}</span>
              <span className="text-sm font-bold text-gray-900">
                {activeCard.label}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
