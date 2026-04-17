"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { pollQuestions, sharkProjects } from "@/lib/workshop-data";
import { TEAM_LABELS, type TeamId } from "@/lib/types";

const BAR_COLORS = ["bg-orange-500", "bg-amber-500", "bg-yellow-500", "bg-emerald-500"];

interface Workshop {
  id: number;
  title: string;
  event_date: string;
  event_time: string;
  created_at: string;
  completed_at: string | null;
  status: string;
  participant_count: number;
}

interface WorkshopDetail {
  workshop: Workshop;
  participants: Record<string, { label: string; members: string[] }>;
  polls: Record<
    number,
    {
      question: string;
      results: Record<string, { label: string; count: number }>;
      customTexts: Record<string, string>;
    }
  >;
  games: Record<number, Record<string, unknown>>;
  game4: Record<string, { name: string; total: number; teamBreakdown: Record<string, number> }>;
}

interface ComparisonData {
  workshops: Workshop[];
  comparison: Record<number, Record<number, Record<string, number>>>;
  pollMeta: { pollId: number; question: string; options: { id: string; label: string }[] }[];
}

// ── Workshop List Card ──────────────────────────────────────────────
function WorkshopCard({
  ws,
  selected,
  onToggle,
  onView,
}: {
  ws: Workshop;
  selected: boolean;
  onToggle: () => void;
  onView: () => void;
}) {
  return (
    <div className="card-glass rounded-xl p-4 border border-black/[0.04] hover:border-black/[0.06] transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-gray-900">{ws.event_date}</span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                ws.status === "active"
                  ? "bg-green-500/15 text-green-600"
                  : "bg-black/[0.03] text-gray-400"
              }`}
            >
              {ws.status === "active" ? "Active" : "Archived"}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {ws.event_time} · {ws.participant_count} participants
          </p>
          {ws.completed_at && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              Archived {new Date(ws.completed_at).toLocaleString("en-US")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggle}
              className="accent-accent w-3.5 h-3.5"
            />
            Compare
          </label>
          <button
            onClick={onView}
            className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition"
          >
            View details
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Panel ────────────────────────────────────────────────────
function DetailPanel({
  detail,
  onClose,
}: {
  detail: WorkshopDetail;
  onClose: () => void;
}) {
  const totalParticipants = Object.values(detail.participants).reduce(
    (sum, t) => sum + t.members.length,
    0,
  );

  return (
    <div className="card-glass rounded-2xl p-6 border border-black/[0.06] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {detail.workshop.event_date} — workshop detail
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {detail.workshop.event_time} · {totalParticipants} people total
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg bg-black/[0.03] px-3 py-1.5 text-xs text-gray-500 hover:bg-black/[0.04] transition"
        >
          Back to list
        </button>
      </div>

      {/* Participants */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Participants</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(detail.participants).map(([teamId, team]) => (
            <div key={teamId} className="rounded-lg bg-black/[0.03] p-3">
              <p className="text-xs font-medium text-accent mb-1.5">
                {team.label}
              </p>
              <div className="flex flex-wrap gap-1">
                {team.members.map((name, i) => (
                  <span
                    key={i}
                    className="inline-block rounded bg-black/[0.05] px-1.5 py-0.5 text-[11px] text-gray-600"
                  >
                    {name}
                  </span>
                ))}
                {team.members.length === 0 && (
                  <span className="text-[11px] text-gray-400">No members</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Polls */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Poll results</h3>
        <div className="space-y-4">
          {Object.entries(detail.polls).map(([pollIdStr, poll]) => {
            const totalVotes = Object.values(poll.results).reduce(
              (sum, r) => sum + r.count,
              0,
            );
            return (
              <div key={pollIdStr} className="rounded-lg bg-black/[0.03] p-4">
                <p className="text-xs font-medium text-gray-600 mb-3">
                  <span className="text-accent">Stage {pollIdStr}</span>{" "}
                  {poll.question}
                </p>
                <div className="space-y-2">
                  {Object.entries(poll.results).map(([optId, r], i) => {
                    const pct = totalVotes > 0 ? (r.count / totalVotes) * 100 : 0;
                    return (
                      <div key={optId}>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-gray-500 truncate max-w-[80%]">
                            {r.label}
                          </span>
                          <span className="text-gray-400">
                            {r.count} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-black/[0.03] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${BAR_COLORS[i % BAR_COLORS.length]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {Object.keys(poll.customTexts).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-black/[0.04]">
                    <p className="text-[10px] text-gray-400 mb-1">Custom responses:</p>
                    {Object.values(poll.customTexts).map((t, i) => (
                      <p key={i} className="text-[11px] text-gray-500">
                        · {t}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {Object.keys(detail.polls).length === 0 && (
            <p className="text-xs text-gray-400">No poll data</p>
          )}
        </div>
      </section>

      {/* Games */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Game submissions</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((gameId) => {
            const gameData = detail.games[gameId];
            if (!gameData) return null;
            const teamEntries = Object.entries(gameData);
            if (teamEntries.length === 0) return null;
            return (
              <div key={gameId} className="rounded-lg bg-black/[0.03] p-4">
                <p className="text-xs font-medium text-accent mb-2">
                  Game {gameId}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {teamEntries.map(([teamId, data]) => {
                    const d = data as { submitted?: boolean; finalAnswer?: string };
                    return (
                      <div
                        key={teamId}
                        className="rounded bg-black/[0.03] p-2 text-[11px]"
                      >
                        <span className="font-medium text-gray-600">
                          {TEAM_LABELS[teamId as TeamId] || teamId}
                        </span>
                        <span
                          className={`ml-1.5 ${d.submitted ? "text-green-600" : "text-gray-400"}`}
                        >
                          {d.submitted ? "✓ Submitted" : "Draft"}
                        </span>
                        {d.finalAnswer && (
                          <p className="text-gray-400 mt-1 line-clamp-2">
                            {String(d.finalAnswer).slice(0, 200)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Game 4 */}
      {Object.keys(detail.game4).length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Game 4 voting ranks</h3>
          <div className="space-y-2">
            {Object.entries(detail.game4)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([, proj], idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-lg bg-black/[0.03] p-3"
                >
                  <span className="text-lg font-black text-accent w-6 text-center">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900">
                      {proj.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {Object.entries(proj.teamBreakdown)
                        .map(
                          ([tid, cnt]) =>
                            `${TEAM_LABELS[tid as TeamId] || tid}: ${cnt}`,
                        )
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-accent">
                    {proj.total}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Comparison Panel ────────────────────────────────────────────────
function ComparisonPanel({
  data,
  onClose,
}: {
  data: ComparisonData;
  onClose: () => void;
}) {
  const workshopLabels = Object.fromEntries(
    data.workshops.map((w) => [w.id, w.event_date]),
  );
  const wsIds = data.workshops.map((w) => w.id);

  return (
    <div className="card-glass rounded-2xl p-6 border border-black/[0.06] space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Cross-workshop poll comparison ({wsIds.length} sessions)
        </h2>
        <button
          onClick={onClose}
          className="rounded-lg bg-black/[0.03] px-3 py-1.5 text-xs text-gray-500 hover:bg-black/[0.04] transition"
        >
          Back to list
        </button>
      </div>

      {data.pollMeta.map((poll) => {
        const hasData = wsIds.some(
          (wid) => data.comparison[wid]?.[poll.pollId],
        );
        if (!hasData) return null;

        return (
          <div key={poll.pollId} className="rounded-lg bg-black/[0.03] p-4">
            <p className="text-xs font-medium text-gray-600 mb-3">
              <span className="text-accent">Stage {poll.pollId}</span>{" "}
              {poll.question}
            </p>
            <div className="space-y-3">
              {poll.options.map((opt) => (
                <div key={opt.id}>
                  <p className="text-[11px] text-gray-500 mb-1.5 truncate">
                    {opt.label}
                  </p>
                  <div className="space-y-1">
                    {wsIds.map((wid, wi) => {
                      const pollData = data.comparison[wid]?.[poll.pollId];
                      const count = pollData?.[opt.id] || 0;
                      const total = pollData
                        ? Object.values(pollData).reduce((a, b) => a + b, 0)
                        : 0;
                      const pct = total > 0 ? (count / total) * 100 : 0;
                      return (
                        <div key={wid} className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 w-20 shrink-0 text-right">
                            {workshopLabels[wid]}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-black/[0.03] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${BAR_COLORS[wi % BAR_COLORS.length]}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 w-12 shrink-0">
                            {count} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {data.pollMeta.every(
        (poll) => !wsIds.some((wid) => data.comparison[wid]?.[poll.pollId]),
      ) && <p className="text-xs text-gray-400">No poll data for selected sessions</p>}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────
export default function HistoryPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [detail, setDetail] = useState<WorkshopDetail | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/workshops");
      const data = await res.json();
      setWorkshops(data.workshops || []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const viewDetail = async (id: number) => {
    setLoadingDetail(true);
    setComparison(null);
    try {
      const res = await fetch(`/api/workshops/${id}`);
      const data = await res.json();
      if (data.workshop) setDetail(data as WorkshopDetail);
    } catch {
      /* ignore */
    }
    setLoadingDetail(false);
  };

  const startComparison = async () => {
    if (selectedIds.size < 2) return;
    setLoadingDetail(true);
    setDetail(null);
    try {
      const ids = Array.from(selectedIds).join(",");
      const res = await fetch(`/api/workshops/compare?ids=${ids}`);
      const data = await res.json();
      if (data.comparison) setComparison(data as ComparisonData);
    } catch {
      /* ignore */
    }
    setLoadingDetail(false);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (detail) {
    return (
      <div className="space-y-4">
        <nav className="flex items-center gap-2 text-xs text-gray-400">
          <Link href="/admin" className="hover:text-gray-900 transition">
            Console
          </Link>
          <span>/</span>
          <Link
            href="/admin/history"
            className="hover:text-gray-900 transition"
            onClick={(e) => {
              e.preventDefault();
              setDetail(null);
            }}
          >
            History
          </Link>
          <span>/</span>
          <span className="text-gray-500">{detail.workshop.event_date}</span>
        </nav>
        <DetailPanel detail={detail} onClose={() => setDetail(null)} />
      </div>
    );
  }

  if (comparison) {
    return (
      <div className="space-y-4">
        <nav className="flex items-center gap-2 text-xs text-gray-400">
          <Link href="/admin" className="hover:text-gray-900 transition">
            Console
          </Link>
          <span>/</span>
          <Link
            href="/admin/history"
            className="hover:text-gray-900 transition"
            onClick={(e) => {
              e.preventDefault();
              setComparison(null);
            }}
          >
            History
          </Link>
          <span>/</span>
          <span className="text-gray-500">Cross-session compare</span>
        </nav>
        <ComparisonPanel data={comparison} onClose={() => setComparison(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-gray-900">History</h1>
          <Link
            href="/admin"
            className="rounded-lg bg-black/[0.03] px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-black/[0.04] transition"
          >
            ← Back to console
          </Link>
        </div>
        {selectedIds.size >= 2 && (
          <button
            onClick={startComparison}
            disabled={loadingDetail}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white hover:brightness-110 transition disabled:opacity-50"
          >
            {loadingDetail ? "Loading..." : `Compare ${selectedIds.size} selected`}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : workshops.length === 0 ? (
        <div className="card-glass rounded-2xl p-12 text-center">
          <p className="text-gray-400 text-sm">No workshop records yet</p>
          <p className="text-gray-400 text-xs mt-1">
            After you run a workshop, data is saved here automatically
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {workshops.map((ws) => (
            <WorkshopCard
              key={ws.id}
              ws={ws}
              selected={selectedIds.has(ws.id)}
              onToggle={() => toggleSelect(ws.id)}
              onView={() => viewDetail(ws.id)}
            />
          ))}
        </div>
      )}

      {loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}
    </div>
  );
}
