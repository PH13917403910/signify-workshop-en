"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { stages } from "@/lib/workshop-data";
import PromptChallenge from "@/components/games/PromptChallenge";
import LegoArchitect from "@/components/games/LegoArchitect";
import CrisisPrompt from "@/components/games/CrisisPrompt";
import SharkTank from "@/components/games/SharkTank";
import { useTeam } from "@/hooks/useTeam";
import RotationHint from "@/components/shared/RotationHint";

const GAME_COMPONENTS: Record<number, React.ComponentType> = {
  1: PromptChallenge,
  2: LegoArchitect,
  3: CrisisPrompt,
  4: SharkTank,
};

export default function GamePage() {
  const params = useParams();
  const stageId = Number(params.id);
  const stage = stages.find((s) => s.id === stageId);
  const { team } = useTeam();
  const GameComponent = GAME_COMPONENTS[stageId];

  if (!stage || !GameComponent) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Game not found</p>
      </div>
    );
  }

  if (!team && stageId !== 4) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">👥</p>
          <p className="text-gray-500 mb-4">Join a team first</p>
          <Link
            href="/join"
            className="rounded-xl bg-accent px-6 py-3 font-bold text-white hover:bg-accent-light transition"
          >
            Choose team
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/" className="hover:text-gray-600 transition">Home</Link>
        <span>/</span>
        <Link href={`/stage/${stageId}`} className="hover:text-gray-600 transition">
          Stage {stageId} · {stage.title}
        </Link>
        <span>/</span>
        <span className="text-gray-600">Game</span>
      </nav>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg font-bold text-gray-900">
          <span className="mr-1">{stage.icon}</span>
          {stage.gameName}
        </h1>
        <Link
          href={`/stage/${stageId}/poll`}
          className="text-xs text-amber-600 hover:text-amber-500 transition"
        >
          Go to poll →
        </Link>
      </div>

      {stageId <= 3 && <RotationHint gameId={stageId} />}

      <GameComponent />
    </div>
  );
}
