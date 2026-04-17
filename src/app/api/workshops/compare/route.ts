import { NextRequest, NextResponse } from "next/server";
import { getWorkshopsComparison, listWorkshops } from "@/lib/db";
import { pollQuestions } from "@/lib/workshop-data";

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({ error: "ids parameter required" }, { status: 400 });
  }

  const ids = idsParam
    .split(",")
    .map(Number)
    .filter((n) => Number.isFinite(n));
  if (ids.length < 2) {
    return NextResponse.json({ error: "At least 2 ids required" }, { status: 400 });
  }

  try {
    const workshops = listWorkshops().filter((w) => ids.includes(w.id));
    const comparison = getWorkshopsComparison(ids);

    const pollMeta = pollQuestions.map((pq) => ({
      pollId: pq.stageId,
      question: pq.question,
      options: pq.options.map((o) => ({ id: o.id, label: o.label })),
    }));

    return NextResponse.json({ workshops, comparison, pollMeta });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
