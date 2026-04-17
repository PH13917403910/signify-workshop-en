import { NextRequest, NextResponse } from "next/server";
import { getWorkshopFull } from "@/lib/db";
import { pollQuestions, sharkProjects } from "@/lib/workshop-data";
import { TEAM_LABELS, type TeamId } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const workshopId = Number(id);
  if (!Number.isFinite(workshopId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const data = getWorkshopFull(workshopId);
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const enrichedParticipants: Record<string, { label: string; members: string[] }> = {};
    for (const [teamId, members] of Object.entries(data.participants)) {
      enrichedParticipants[teamId] = {
        label: TEAM_LABELS[teamId as TeamId] || teamId,
        members,
      };
    }

    const enrichedPolls: Record<
      number,
      {
        question: string;
        results: Record<string, { label: string; count: number }>;
        customTexts: Record<string, string>;
      }
    > = {};
    for (const [pollIdStr, pollData] of Object.entries(data.polls)) {
      const pollId = Number(pollIdStr);
      const question = pollQuestions.find((p) => p.stageId === pollId);
      const results: Record<string, { label: string; count: number }> = {};
      for (const [optId, voters] of Object.entries(pollData.votes)) {
        const opt = question?.options.find((o) => o.id === optId);
        results[optId] = {
          label: opt?.label || optId,
          count: voters.length,
        };
      }
      enrichedPolls[pollId] = {
        question: question?.question || `Poll ${pollId}`,
        results,
        customTexts: pollData.customTexts,
      };
    }

    const projectLookup = Object.fromEntries(sharkProjects.map((p) => [p.id, p.name]));

    const enrichedGame4: Record<string, { name: string; total: number; teamBreakdown: Record<string, number> }> = {};
    for (const [projectId, g4data] of Object.entries(data.game4)) {
      const teamBreakdown: Record<string, number> = {};
      for (const [voterId, count] of Object.entries(g4data.voters)) {
        const tid = voterId.split(":")[0];
        teamBreakdown[tid] = (teamBreakdown[tid] || 0) + count;
      }
      enrichedGame4[projectId] = {
        name: projectLookup[projectId] || projectId,
        total: g4data.total,
        teamBreakdown,
      };
    }

    return NextResponse.json({
      workshop: data.workshop,
      participants: enrichedParticipants,
      polls: enrichedPolls,
      games: data.games,
      game4: enrichedGame4,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
