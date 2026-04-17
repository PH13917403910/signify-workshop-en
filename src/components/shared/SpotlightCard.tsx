"use client";

import { useRef, useCallback, type ReactNode, type CSSProperties } from "react";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "button";
  style?: CSSProperties;
  onClick?: () => void;
}

export default function SpotlightCard({
  children,
  className = "",
  as: Tag = "div",
  style,
  onClick,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <Tag
      ref={ref as never}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`spotlight-card ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
}
