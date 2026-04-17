"use client";

import Term from "./Term";

interface TermPattern {
  pattern: RegExp;
  glossaryId: string;
}

const TERM_PATTERNS: TermPattern[] = [
  { pattern: /\bSAP HANA\b/gi, glossaryId: "hana" },
  { pattern: /\bAgentic AI\b/gi, glossaryId: "agentic-ai" },
  { pattern: /\bS&OP\b/g, glossaryId: "sop" },
  { pattern: /\bClean Core\b/gi, glossaryId: "clean-core" },
  { pattern: /\bDigital Twin\b/gi, glossaryId: "digital-twin" },
  { pattern: /\bWhat-if\b/gi, glossaryId: "what-if" },
  { pattern: /\bMCP\b/g, glossaryId: "mcp" },
  { pattern: /\bLLM\b/g, glossaryId: "llm" },
  { pattern: /\bPrompt\b/gi, glossaryId: "prompt" },
  { pattern: /\bAI Agent\b/gi, glossaryId: "agent" },
  { pattern: /\bCCF\b/g, glossaryId: "ccf" },
  { pattern: /\bHallucination\b/gi, glossaryId: "hallucination" },
  { pattern: /\bToken\b/gi, glossaryId: "token" },
  { pattern: /\bRAG\b/g, glossaryId: "rag" },
  { pattern: /\bCopilot\b/gi, glossaryId: "copilot" },
  { pattern: /\bB2B\b/g, glossaryId: "b2b-b2c" },
];

export default function AutoTerm({ text }: { text: string }) {
  const segments: { type: "text" | "term"; value: string; id?: string }[] = [];
  let remaining = text;
  const matched = new Set<string>();

  while (remaining.length > 0) {
    let earliest: { idx: number; len: number; id: string } | null = null;

    for (const tp of TERM_PATTERNS) {
      if (matched.has(tp.glossaryId)) continue;
      tp.pattern.lastIndex = 0;
      const m = tp.pattern.exec(remaining);
      if (m && (earliest === null || m.index < earliest.idx)) {
        earliest = { idx: m.index, len: m[0].length, id: tp.glossaryId };
      }
    }

    if (!earliest) {
      segments.push({ type: "text", value: remaining });
      break;
    }

    if (earliest.idx > 0) {
      segments.push({ type: "text", value: remaining.slice(0, earliest.idx) });
    }

    segments.push({
      type: "term",
      value: remaining.slice(earliest.idx, earliest.idx + earliest.len),
      id: earliest.id,
    });
    matched.add(earliest.id);
    remaining = remaining.slice(earliest.idx + earliest.len);
  }

  return (
    <>
      {segments.map((s, i) =>
        s.type === "term" ? (
          <Term key={i} id={s.id!}>
            {s.value}
          </Term>
        ) : (
          <span key={i}>{s.value}</span>
        ),
      )}
    </>
  );
}
