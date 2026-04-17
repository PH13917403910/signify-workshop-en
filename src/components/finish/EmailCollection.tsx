"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkshopState } from "@/hooks/useSocket";
import { TEAM_LABELS, TEAM_IDS, type TeamId } from "@/lib/types";

const STORAGE_KEY = "signify-workshop-team";

type Step = "idle" | "collecting" | "review" | "sending" | "done";

interface MemberEmail {
  name: string;
  email: string;
  skipped: boolean;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function EmailCollection() {
  const { state } = useWorkshopState();
  const [team, setTeam] = useState<TeamId | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("idle");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [entries, setEntries] = useState<MemberEmail[]>([]);
  const [inputEmail, setInputEmail] = useState("");
  const [inputError, setInputError] = useState("");
  const [sendResults, setSendResults] = useState<{ email: string; success: boolean; error?: string }[]>([]);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as TeamId | null;
    if (stored && TEAM_IDS.includes(stored as TeamId)) {
      setTeam(stored);
    }
  }, []);

  useEffect(() => {
    if (team && state.teams[team]) {
      const names = state.teams[team].memberNames || [];
      if (names.length > 0) setMembers(names);
    }
  }, [team, state.teams]);

  const startCollecting = useCallback(() => {
    if (members.length === 0) return;
    setEntries(members.map((name) => ({ name, email: "", skipped: false })));
    setCurrentIdx(0);
    setInputEmail("");
    setInputError("");
    setStep("collecting");
  }, [members]);

  const handleNext = useCallback(() => {
    const trimmed = inputEmail.trim();
    if (trimmed && !isValidEmail(trimmed)) {
      setInputError("Enter a valid email address");
      return;
    }
    setEntries((prev) => {
      const next = [...prev];
      next[currentIdx] = {
        ...next[currentIdx],
        email: trimmed,
        skipped: !trimmed,
      };
      return next;
    });
    setInputError("");
    if (currentIdx < members.length - 1) {
      setCurrentIdx((i) => i + 1);
      setInputEmail("");
    } else {
      setStep("review");
    }
  }, [inputEmail, currentIdx, members.length]);

  const handleSend = useCallback(async () => {
    const toSend = entries.filter((e) => !e.skipped && e.email);
    if (toSend.length === 0) return;

    setStep("sending");
    try {
      const res = await fetch("/api/send-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participants: toSend.map((e) => ({ name: e.name, email: e.email })),
        }),
      });
      const data = await res.json();
      setSendResults(data.results || []);
    } catch {
      setSendResults(
        toSend.map((e) => ({ email: e.email, success: false, error: "Network error" }))
      );
    }
    setStep("done");
  }, [entries]);

  const handleResendOne = useCallback(
    async (oldEmail: string, newEmail: string) => {
      const entry = entries.find((e) => e.email === oldEmail);
      if (!entry || !isValidEmail(newEmail.trim())) return;

      setResending(true);
      try {
        const res = await fetch("/api/send-certificate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participants: [{ name: entry.name, email: newEmail.trim() }],
          }),
        });
        const data = await res.json();
        const result = data.results?.[0];
        if (result) {
          setSendResults((prev) =>
            prev.map((r) => (r.email === oldEmail ? { ...result } : r)),
          );
          setEntries((prev) =>
            prev.map((e) =>
              e.email === oldEmail ? { ...e, email: newEmail.trim() } : e,
            ),
          );
        }
      } catch {
        setSendResults((prev) =>
          prev.map((r) =>
            r.email === oldEmail
              ? { email: newEmail.trim(), success: false, error: "Network error" }
              : r,
          ),
        );
      }
      setResending(false);
      setEditingEmail(null);
    },
    [entries],
  );

  const validCount = entries.filter((e) => !e.skipped && e.email).length;

  if (!team) {
    return (
      <div className="card-glass rounded-2xl p-6 noise text-center space-y-4">
        <p className="text-2xl">📧</p>
        <h3 className="text-sm font-bold text-gray-900">Get your certificate</h3>
        <p className="text-xs text-gray-500">Choose your team first</p>
        <div className="grid grid-cols-2 gap-2">
          {TEAM_IDS.map((tid) => (
            <button
              key={tid}
              onClick={() => {
                setTeam(tid);
                localStorage.setItem(STORAGE_KEY, tid);
              }}
              className="rounded-lg bg-black/[0.03] border border-black/[0.06] px-3 py-2.5 text-xs font-medium text-gray-600 hover:bg-black/[0.05] transition"
            >
              {TEAM_LABELS[tid]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "idle") {
    return (
      <div className="card-glass rounded-2xl p-6 noise text-center space-y-4">
        <p className="text-3xl">📧</p>
        <h3 className="text-lg font-bold text-gray-900">Get your certificate</h3>
        <p className="text-sm text-gray-500">
          Team <span className="text-accent font-semibold">{TEAM_LABELS[team]}</span> · {members.length} members
        </p>
        <p className="text-xs text-gray-400">
          Enter emails one by one — we&apos;ll send the workshop certificate and recap PDF
        </p>
        <button
          onClick={startCollecting}
          disabled={members.length === 0}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-3 font-bold text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all hover:scale-[1.02] disabled:opacity-35"
        >
          Start collecting emails
        </button>
        {members.length === 0 && (
          <p className="text-xs text-red-500">No team members found — check in on Join first</p>
        )}
      </div>
    );
  }

  if (step === "collecting") {
    const member = members[currentIdx];
    return (
      <div className="card-glass rounded-2xl p-6 noise space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">📧 Collect emails</h3>
          <span className="text-xs text-gray-400 font-mono">
            {currentIdx + 1} / {members.length}
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5">
          {members.map((m, i) => (
            <div
              key={m}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < currentIdx
                  ? entries[i]?.skipped
                    ? "bg-gray-300"
                    : "bg-green-500"
                  : i === currentIdx
                    ? "bg-accent"
                    : "bg-black/[0.05]"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Current member</p>
              <p className="text-lg font-bold text-gray-900">{member}</p>
            </div>

            <div>
              <input
                type="email"
                value={inputEmail}
                onChange={(e) => {
                  setInputEmail(e.target.value);
                  setInputError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
                placeholder={`Email for ${member}`}
                autoFocus
                className="w-full rounded-xl bg-gray-50 border border-black/[0.06] px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
              {inputError && (
                <p className="mt-1.5 text-xs text-red-500">{inputError}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEntries((prev) => {
                    const next = [...prev];
                    next[currentIdx] = { ...next[currentIdx], email: "", skipped: true };
                    return next;
                  });
                  setInputError("");
                  if (currentIdx < members.length - 1) {
                    setCurrentIdx((i) => i + 1);
                    setInputEmail("");
                  } else {
                    setStep("review");
                  }
                }}
                className="rounded-xl border border-black/[0.06] bg-black/[0.03] px-4 py-2.5 text-xs text-gray-500 hover:bg-black/[0.05] transition"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:brightness-110 transition"
              >
                {currentIdx < members.length - 1 ? "Next →" : "Done"}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Already collected */}
        {currentIdx > 0 && (
          <div className="pt-3 border-t border-black/[0.04] space-y-1">
            {entries.slice(0, currentIdx).map((e) => (
              <div key={e.name} className="flex items-center gap-2 text-xs">
                <span className={e.skipped ? "text-gray-400" : "text-green-600"}>
                  {e.skipped ? "○" : "●"}
                </span>
                <span className="text-gray-500">{e.name}</span>
                <span className="text-gray-400 truncate">
                  {e.skipped ? "Skipped" : e.email}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="card-glass rounded-2xl p-6 noise space-y-5">
        <div className="text-center space-y-2">
          <p className="text-2xl">✅</p>
          <h3 className="text-sm font-bold text-gray-900">Confirm send</h3>
          <p className="text-xs text-gray-500">
            We will email {validCount} member(s) their workshop certificate
          </p>
        </div>

        <div className="space-y-1.5">
          {entries.map((e) => (
            <div
              key={e.name}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                e.skipped ? "bg-black/[0.02] text-gray-400" : "bg-black/[0.03] text-gray-600"
              }`}
            >
              <span className={e.skipped ? "text-gray-400" : "text-green-600"}>
                {e.skipped ? "○" : "●"}
              </span>
              <span className="font-medium">{e.name}</span>
              <span className="text-gray-400 ml-auto truncate max-w-[180px]">
                {e.skipped ? "Skipped" : e.email}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setStep("collecting");
              setCurrentIdx(0);
              setInputEmail(entries[0]?.email || "");
            }}
            className="rounded-xl border border-black/[0.06] bg-black/[0.03] px-4 py-2.5 text-xs text-gray-500 hover:bg-black/[0.05] transition"
          >
            Edit again
          </button>
          <button
            onClick={handleSend}
            disabled={validCount === 0}
            className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-3 font-bold text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all disabled:opacity-35"
          >
            Send certificates ({validCount})
          </button>
        </div>
      </div>
    );
  }

  if (step === "sending") {
    return (
      <div className="card-glass rounded-2xl p-6 noise text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-gray-500">Sending certificate emails...</p>
      </div>
    );
  }

  // step === "done"
  const successCount = sendResults.filter((r) => r.success).length;
  const failCount = sendResults.filter((r) => !r.success).length;

  return (
    <div className="card-glass rounded-2xl p-6 noise space-y-5">
      <div className="text-center space-y-2">
        <p className="text-3xl">{failCount === 0 ? "🎉" : "⚠️"}</p>
        <h3 className="text-sm font-bold text-gray-900">
          {failCount === 0
            ? `All ${successCount} emails sent!`
            : `${successCount} sent, ${failCount} failed`}
        </h3>
        <p className="text-xs text-gray-500">
          PDF certificate attached. If missing, check spam/junk
        </p>
      </div>

      <div className="space-y-2">
        {sendResults.map((r, i) => (
          <div
            key={`${r.email}-${i}`}
            className="rounded-lg bg-black/[0.03] p-3 space-y-2"
          >
            <div className="flex items-center gap-2 text-xs">
              <span className={r.success ? "text-green-600" : "text-red-500"}>
                {r.success ? "✓" : "✗"}
              </span>
              <span className="text-gray-600 truncate flex-1">{r.email}</span>
              {r.error && (
                <span className="text-red-500 text-[11px] truncate max-w-[100px]">
                  {r.error}
                </span>
              )}
              <button
                onClick={() => {
                  setEditingEmail(editingEmail === r.email ? null : r.email);
                  setEditValue(r.email);
                }}
                className="shrink-0 text-gray-400 hover:text-accent transition text-[11px] border border-black/[0.06] rounded-md px-1.5 py-0.5"
              >
                {editingEmail === r.email ? "Cancel" : "Edit"}
              </button>
            </div>

            {editingEmail === r.email && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 pt-1"
              >
                <input
                  type="email"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isValidEmail(editValue.trim())) {
                      handleResendOne(r.email, editValue);
                    }
                  }}
                  placeholder="Enter new email"
                  autoFocus
                  className="flex-1 rounded-lg bg-gray-50 border border-black/[0.06] px-3 py-2 text-gray-900 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  onClick={() => handleResendOne(r.email, editValue)}
                  disabled={resending || !isValidEmail(editValue.trim())}
                  className="shrink-0 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-35 hover:brightness-110 transition"
                >
                  {resending ? "Sending..." : "Resend"}
                </button>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {failCount > 0 && (
        <button
          onClick={handleSend}
          className="w-full rounded-xl border border-black/[0.06] bg-black/[0.03] px-4 py-2.5 text-xs text-gray-500 hover:bg-black/[0.05] transition"
        >
          Retry all failed sends
        </button>
      )}
    </div>
  );
}
