"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { GLOSSARY } from "@/lib/glossary";

export default function Term({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const entry = GLOSSARY[id];
  const tooltipId = useId();
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const handler = () => close();
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [open, close]);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({
      top: rect.top,
      left: rect.left + rect.width / 2,
    });
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen((p) => !p);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
      }
    },
    [open, close],
  );

  if (!entry) return <>{children}</>;

  const showAbove = pos ? pos.top > 120 : true;

  const tooltip =
    open && mounted && pos
      ? createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            className="fixed z-[9999] w-72 rounded-xl bg-gray-50 border border-black/[0.06] shadow-lg p-3 pointer-events-none"
            style={
              showAbove
                ? { top: pos.top - 8, left: pos.left, transform: "translate(-50%, -100%)" }
                : { top: pos.top + 28, left: pos.left, transform: "translateX(-50%)" }
            }
          >
            <span className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-accent">{entry.term}</span>
              {entry.english && (
                <span className="text-[11px] text-gray-400">{entry.english}</span>
              )}
            </span>
            <span className="text-[11px] text-gray-600 leading-relaxed block">
              {entry.definition}
            </span>
            {showAbove ? (
              <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-50" />
            ) : (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-px border-4 border-transparent border-b-gray-50" />
            )}
          </span>,
          document.body,
        )
      : null;

  return (
    <span ref={wrapperRef} className="relative inline-block pointer-events-auto">
      <button
        ref={btnRef}
        type="button"
        className="border-b border-dashed border-gray-500 cursor-help hover:border-accent hover:text-accent transition-colors inline text-inherit font-inherit bg-transparent p-0 text-left"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((p) => !p)}
        onKeyDown={handleKeyDown}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
      >
        {children}
      </button>
      {tooltip}
    </span>
  );
}
