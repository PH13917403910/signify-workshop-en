"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AmbientBackground from "@/components/layout/AmbientBackground";
import { useWorkshopState } from "@/hooks/useSocket";

function LogoMark() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-amber-500 shadow-lg shadow-accent/15 mx-auto mb-5">
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    </div>
  );
}

function AccessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state: wsState } = useWorkshopState();
  const eventDate = wsState.eventDate;
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        const next = searchParams.get("next") || "/";
        router.push(next);
        router.refresh();
      } else {
        setError(data.error || "Invalid access code");
      }
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm animate-fade-in-blur">
      <div className="text-center mb-8">
        <LogoMark />
        <h1 className="text-2xl font-black text-gray-900 font-display tracking-tight">
          Signify AI Workshop
        </h1>
        <p className="text-xs text-gray-400 mt-2 tracking-[0.2em] uppercase font-display">
          {eventDate} · Supply Chain AI Transformation Workshop
        </p>
      </div>

      <div className="card-glass rounded-2xl p-6 border-gradient noise">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 font-display">
          Access code
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Enter workshop access code"
          autoFocus
          autoComplete="off"
          className="input-glow w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3.5 text-center text-lg font-mono font-bold tracking-[0.25em] text-gray-900 placeholder:text-gray-400 placeholder:tracking-normal placeholder:font-semibold transition-all"
        />

        {error && (
          <p className="mt-3 text-center text-sm text-red-500">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !code.trim()}
          className="btn-shimmer mt-4 w-full rounded-xl bg-gradient-to-r from-accent to-amber-500 px-4 py-3.5 font-bold text-white shadow-lg shadow-accent/15 hover:shadow-accent/25 transition-all hover:scale-[1.02] disabled:opacity-35 disabled:hover:scale-100"
        >
          {loading ? "Verifying..." : "Enter workshop"}
        </button>
      </div>

      <p className="mt-6 text-center text-[11px] text-gray-400 tracking-wider">
        Code from facilitator · contact organizers if needed
      </p>
    </div>
  );
}

export default function AccessPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 pb-safe">
      <AmbientBackground />
      <div className="relative z-10">
        <Suspense fallback={
          <div className="text-center text-gray-400">Loading...</div>
        }>
          <AccessForm />
        </Suspense>
      </div>
    </div>
  );
}
