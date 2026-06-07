import React from "react";

interface LadleProps {
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export function Ladle({ color = "currentColor", strokeWidth = 3.4, style }: LadleProps) {
  return (
    <svg
      viewBox="0 0 54 80"
      aria-hidden="true"
      style={{ display: "block", width: "100%", height: "auto", overflow: "visible", ...style }}
    >
      <path d="M37 6 C 25 4, 24 18, 33 19" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M33 19 C 35 31, 31 41, 27 48" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M10 48 A 16 16 0 0 0 42 48" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <ellipse cx="26" cy="48" rx="16" ry="4.4" fill="none" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
}

interface WordmarkProps {
  size?: number;
  color?: string;
  markColor?: string;
  stacked?: boolean;
  strokeWidth?: number;
  className?: string;
}

export function Wordmark({
  size = 44,
  color = "var(--red)",
  markColor = "var(--mustard)",
  stacked = false,
  strokeWidth = 3.6,
  className,
}: WordmarkProps) {
  const apostrophe = (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        verticalAlign: "baseline",
        position: "relative",
        width: `${0.42 * size}px`,
        top: "-0.04em",
      }}
    >
      <Ladle color={markColor} strokeWidth={strokeWidth} />
    </span>
  );

  if (stacked) {
    return (
      <div
        className={`font-script ${className ?? ""}`}
        style={{ color, textAlign: "center", lineHeight: 1.0, whiteSpace: "nowrap" }}
        aria-label="Sunday's Lunch"
      >
        <div style={{ fontSize: size }}>Sunday{apostrophe}s</div>
        <div style={{ fontSize: size * 0.92, marginTop: size * 0.06 }}>Lunch</div>
      </div>
    );
  }

  return (
    <span
      className={`font-script ${className ?? ""}`}
      style={{ color, fontSize: size, whiteSpace: "nowrap", lineHeight: 1 }}
      aria-label="Sunday's Lunch"
    >
      Sunday{apostrophe}s Lunch
    </span>
  );
}
