"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTeam } from "@/hooks/useTeam";
import { TEAM_IDS, TEAM_LABELS, TEAM_COLORS, type TeamId } from "@/lib/types";
import { useWorkshopState } from "@/hooks/useSocket";
import { getSocket } from "@/lib/socket-client";
import SpotlightCard from "@/components/shared/SpotlightCard";
import ScrollReveal from "@/components/shared/ScrollReveal";

const TEAM_ICONS: Record<TeamId, string> = {
  demand: "📈",
  supply: "🏭",
  om: "📋",
  logistics: "🚛",
};

const TEAM_DESC: Record<TeamId, string> = {
  demand: "Demand Planning — forecasting, analytics, and growth drivers",
  supply: "Supply Planning — capacity, materials, and resilient supply",
  om: "Order Management — end-to-end control from order to delivery",
  logistics: "Logistics — warehousing, distribution, and last-mile optimization",
};

export default function JoinPage() {
  const router = useRouter();
  const { team, joinTeam } = useTeam();
  const { state } = useWorkshopState();
  const [selectedTeam, setSelectedTeam] = useState<TeamId | null>(null);
  const [newName, setNewName] = useState("");
  const [memberNames, setMemberNames] = useState<string[]>([]);

  useEffect(() => {
    if (team) {
      setSelectedTeam(team);
      const names = state.teams[team]?.memberNames || [];
      setMemberNames(names);
    }
  }, [team, state.teams]);

  const handleSelectTeam = (teamId: TeamId) => {
    joinTeam(teamId);
    setSelectedTeam(teamId);
    const names = state.teams[teamId]?.memberNames || [];
    setMemberNames(names);
  };

  const handleAddMember = () => {
    const name = newName.trim();
    if (!name || !selectedTeam) return;
    if (memberNames.includes(name)) return;
    const updated = [...memberNames, name];
    setMemberNames(updated);
    setNewName("");
    getSocket().emit("team:setMembers", { teamId: selectedTeam, names: updated });
  };

  const handleRemoveMember = (name: string) => {
    if (!selectedTeam) return;
    const updated = memberNames.filter((n) => n !== name);
    setMemberNames(updated);
    getSocket().emit("team:setMembers", { teamId: selectedTeam, names: updated });
  };

  const handleDone = () => {
    router.push("/");
  };

  if (selectedTeam) {
    const color = TEAM_COLORS[selectedTeam];
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl text-4xl mb-3"
              style={{ backgroundColor: `${color}15` }}
            >
              {TEAM_ICONS[selectedTeam]}
            </div>
            <h1 className="text-2xl font-black text-gray-900">{TEAM_LABELS[selectedTeam]}</h1>
            <p className="text-sm text-gray-500 mt-1">Team lead: check in every member</p>
          </div>

          <div className="card-glass rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Team members
              </h3>
              <span className="text-xs text-gray-400">{memberNames.length} checked in</span>
            </div>

            {memberNames.length > 0 ? (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {memberNames.map((name, i) => (
                    <motion.div
                      key={name}
                      layout
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.95 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                      className="flex items-center justify-between rounded-xl px-4 py-2.5"
                      style={{
                        backgroundColor: `${color}08`,
                        border: `1px solid ${color}15`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {name.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-gray-800">{name}</span>
                        {i === 0 && (
                          <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold bg-yellow-500/15 text-yellow-600">
                            Lead
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveMember(name)}
                        className="text-gray-400 hover:text-red-500 active:text-red-500 transition text-xs min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
                      >
                        Remove
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-black/[0.08] py-8 text-center">
                <p className="text-gray-400 text-sm">No members yet — add someone</p>
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                placeholder="Enter name or nickname..."
                className="input-glow flex-1 rounded-xl bg-white border border-black/[0.08] px-4 py-2.5 text-gray-900 placeholder-gray-400 text-sm"
                style={{ "--tw-ring-color": color } as React.CSSProperties}
              />
              <button
                onClick={handleAddMember}
                disabled={!newName.trim()}
                className="rounded-xl px-5 py-2.5 font-bold text-white disabled:opacity-35 shrink-0 text-sm"
                style={{ backgroundColor: color }}
              >
                + Check in
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSelectedTeam(null)}
              className="flex-1 rounded-xl bg-black/[0.03] px-4 py-3 text-sm font-medium text-gray-500 hover:bg-black/[0.06] transition"
            >
              ← Switch team
            </button>
            <button
              onClick={handleDone}
              disabled={memberNames.length === 0}
              className="flex-1 rounded-xl px-4 py-3 font-bold text-white disabled:opacity-35 text-sm"
              style={{ backgroundColor: memberNames.length > 0 ? color : undefined }}
            >
              {memberNames.length > 0 ? `Start (${memberNames.length})` : "Add members first"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <h1 className="text-3xl font-black text-gray-900 mb-2 font-display tracking-tight">Choose your team</h1>
      <p className="text-gray-500 mb-8">
        Then check in your members
      </p>

      <div className="grid gap-4 sm:grid-cols-2 w-full max-w-2xl">
        {TEAM_IDS.map((id, i) => {
          const isSelected = team === id;
          const names = state.teams[id]?.memberNames || [];

          return (
            <ScrollReveal key={id} delay={i * 60}>
              <SpotlightCard
                as="button"
                onClick={() => handleSelectTeam(id)}
                className={`group relative rounded-2xl p-6 text-left transition-all duration-300 w-full ${
                  isSelected
                    ? "ring-2 scale-[1.02]"
                    : "card-glass hover:scale-[1.01]"
                }`}
                style={{
                  ...(isSelected
                    ? {
                        backgroundColor: `${TEAM_COLORS[id]}08`,
                        borderColor: `${TEAM_COLORS[id]}40`,
                        ringColor: TEAM_COLORS[id],
                        boxShadow: `0 4px 24px ${TEAM_COLORS[id]}12`,
                      }
                    : {}),
                }}
              >
                <div className="flex items-start gap-4 relative z-[2]">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-xl text-3xl"
                    style={{ backgroundColor: `${TEAM_COLORS[id]}12` }}
                  >
                    {TEAM_ICONS[id]}
                  </div>
                  <div className="flex-1">
                    <h3
                      className="text-lg font-bold mb-1 font-display"
                      style={{ color: TEAM_COLORS[id] }}
                    >
                      {TEAM_LABELS[id]}
                    </h3>
                    <p className="text-sm text-gray-500">{TEAM_DESC[id]}</p>
                    {names.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {names.map((n) => (
                          <span
                            key={n}
                            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{ backgroundColor: `${TEAM_COLORS[id]}12`, color: TEAM_COLORS[id] }}
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-gray-400">Not checked in yet</p>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div
                    className="absolute top-3 right-3 rounded-full px-2 py-0.5 text-xs font-bold z-[2]"
                    style={{
                      backgroundColor: `${TEAM_COLORS[id]}12`,
                      color: TEAM_COLORS[id],
                    }}
                  >
                    ✓ Joined
                  </div>
                )}
              </SpotlightCard>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}
