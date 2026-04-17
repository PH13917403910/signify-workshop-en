"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { stages } from "@/lib/workshop-data";
import LivePoll from "@/components/polls/LivePoll";

export default function PollPage() {
  const params = useParams();
  const stageId = Number(params.id);
  const stage = stages.find((s) => s.id === stageId);

  if (!stage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Page not found</p>
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
        <span className="text-gray-600">Poll</span>
      </nav>

      <h1 className="text-lg font-bold text-gray-900">
        📊 Live Poll · {stage.title}
      </h1>

      <LivePoll stageId={stageId} />
    </div>
  );
}
