"use client";

import Link from "next/link";
import { useWorkshopState } from "@/hooks/useSocket";
import { pollQuestions, stages } from "@/lib/workshop-data";

const BAR_COLORS = [
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-emerald-500",
];

export default function SummaryPage() {
  const { state } = useWorkshopState();

  const allPolls = pollQuestions.map((pq) => {
    const pollState = state.polls[pq.stageId];
    const stage = stages.find((s) => s.id === pq.stageId);

    const allOptionIds = [...pq.options.map((o) => o.id), "custom"];
    const totalVotes = pollState
      ? allOptionIds.reduce((acc, id) => {
          const arr = pollState.votes[id];
          return acc + (Array.isArray(arr) ? arr.length : 0);
        }, 0)
      : 0;

    const options = pq.options.map((opt) => {
      const count =
        pollState && Array.isArray(pollState.votes[opt.id])
          ? pollState.votes[opt.id].length
          : 0;
      const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
      return { ...opt, count, pct };
    });

    const customCount =
      pollState && Array.isArray(pollState.votes["custom"])
        ? pollState.votes["custom"].length
        : 0;
    const customPct = totalVotes > 0 ? (customCount / totalVotes) * 100 : 0;
    const customTexts = pollState?.customTexts
      ? Object.values(pollState.customTexts)
      : [];

    const allOptions = [
      ...options,
      { id: "custom", label: "Custom response", emoji: "✎", count: customCount, pct: customPct },
    ];

    const winner = allOptions.reduce(
      (a, b) => (b.count > a.count ? b : a),
      allOptions[0],
    );

    return { pq, stage, pollState, totalVotes, options: allOptions, customTexts, winner };
  });

  const grandTotal = allPolls.reduce((sum, p) => sum + p.totalVotes, 0);
  const activePollCount = allPolls.filter((p) => p.totalVotes > 0).length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="text-xs text-gray-400 hover:text-gray-600 transition mb-2 inline-block"
          >
            ← Back to console
          </Link>
          <h1 className="text-2xl font-black text-gray-900">Poll data summary</h1>
          <p className="text-sm text-gray-400 mt-1">
            Live analysis of workshop polls
          </p>
        </div>
        <div className="flex gap-4 text-center">
          <div className="card-glass rounded-xl px-5 py-3">
            <p className="text-2xl font-black text-accent">{grandTotal}</p>
            <p className="text-[11px] text-gray-400 uppercase">Total votes</p>
          </div>
          <div className="card-glass rounded-xl px-5 py-3">
            <p className="text-2xl font-black text-amber-600">
              {activePollCount}/{allPolls.length}
            </p>
            <p className="text-[11px] text-gray-400 uppercase">Polls run</p>
          </div>
        </div>
      </div>

      {/* Poll Cards */}
      {allPolls.map(({ pq, stage, totalVotes, options, customTexts, winner }, idx) => {
        const hasData = totalVotes > 0;
        return (
          <div
            key={pq.stageId}
            className="card-glass rounded-2xl overflow-hidden"
          >
            {/* Stage header stripe */}
            <div
              className={`px-6 py-3 flex items-center justify-between ${
                hasData
                  ? "bg-gradient-to-r from-accent/10 to-transparent"
                  : "bg-black/[0.02]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{stage?.icon}</span>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">
                    Stage {pq.stageId} · {stage?.subtitle}
                  </p>
                  <p className="text-sm font-bold text-gray-900">{stage?.title}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-gray-900">{totalVotes}</p>
                <p className="text-[11px] text-gray-400">votes</p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Question */}
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                {pq.question}
              </p>

              {hasData ? (
                <>
                  {/* Horizontal bar chart */}
                  <div className="space-y-3">
                    {options.map((opt, oi) => (
                      <div key={opt.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <span className="text-base">{opt.emoji}</span>
                            <span className="font-medium">{opt.id}.</span>
                            <span className="line-clamp-1 max-w-xs">
                              {opt.label.slice(0, 30)}
                              {opt.label.length > 30 ? "..." : ""}
                            </span>
                          </span>
                          <span className="font-bold text-gray-900 tabular-nums">
                            {Math.round(opt.pct)}%{" "}
                            <span className="text-gray-400 font-normal">
                              ({opt.count})
                            </span>
                          </span>
                        </div>
                        <div className="h-6 w-full rounded-lg bg-gray-100 overflow-hidden relative">
                          <div
                            className={`h-full rounded-lg transition-all duration-700 ${BAR_COLORS[oi % BAR_COLORS.length]} ${
                              opt.id === winner.id && totalVotes > 0
                                ? "opacity-100"
                                : "opacity-60"
                            }`}
                            style={{ width: `${Math.max(opt.pct, 1)}%` }}
                          />
                          {opt.id === winner.id && totalVotes > 0 && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-700">
                              TOP
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Insight / Winner */}
                  <div className="rounded-xl bg-accent/5 border border-accent/20 px-4 py-3 flex items-start gap-3">
                    <span className="text-xl">{winner.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-accent mb-0.5">
                        Top consensus
                      </p>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {winner.label}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {winner.count} votes · {Math.round(winner.pct)}% of participants
                      </p>
                    </div>
                  </div>

                  {/* Custom entries */}
                  {customTexts.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-amber-600 mb-2">
                        ✎ Custom responses ({customTexts.length})
                      </p>
                      <div className="space-y-1.5">
                        {customTexts.map((text, i) => (
                          <div
                            key={i}
                            className="rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-2 text-xs text-gray-600"
                          >
                            &ldquo;{text}&rdquo;
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-gray-400 text-sm">No poll data yet</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Open this stage&apos;s poll from the console to see live results
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Cross-poll insight */}
      {activePollCount >= 2 && (
        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-4">
            Cross-stage insights
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-400 mb-2">Participation trend</p>
              <div className="flex items-end gap-3 h-20">
                {allPolls.map(({ pq, totalVotes }) => {
                  const maxVotes = Math.max(
                    ...allPolls.map((p) => p.totalVotes),
                    1,
                  );
                  const heightPct = (totalVotes / maxVotes) * 100;
                  return (
                    <div
                      key={pq.stageId}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-[11px] text-gray-500 font-bold tabular-nums">
                        {totalVotes}
                      </span>
                      <div
                        className="w-full rounded-t-md bg-accent transition-all duration-500"
                        style={{ height: `${Math.max(heightPct, 4)}%` }}
                      />
                      <span className="text-[11px] text-gray-400">
                        S{pq.stageId}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-400 mb-2">Top option per stage</p>
              <div className="space-y-2">
                {allPolls
                  .filter((p) => p.totalVotes > 0)
                  .map(({ pq, winner, stage }) => (
                    <div
                      key={pq.stageId}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="text-gray-400 w-6 shrink-0">
                        S{pq.stageId}
                      </span>
                      <span>{winner.emoji}</span>
                      <span className="text-gray-600 line-clamp-1">
                        {winner.label.slice(0, 35)}...
                      </span>
                      <span className="ml-auto text-accent font-bold tabular-nums shrink-0">
                        {Math.round(winner.pct)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
