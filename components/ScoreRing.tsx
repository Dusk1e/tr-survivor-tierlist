"use client";

import { scoreColor } from "@/lib/dims";

/**
 * Colored score circle. Ring + number colored by how good the score is;
 * the red corner badge shows HOW MANY approved votes it's based on.
 */
export default function ScoreRing({
  value,
  count,
  size = 48,
  stroke = 5,
  showCount = true,
}: {
  value: number | null; // 0..100 or null (no votes yet)
  count?: number;
  size?: number;
  stroke?: number;
  showCount?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  const color = value == null ? "#5b6470" : scoreColor(pct);

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="rgba(10,14,20,0.72)"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke}
        />
        {value != null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * pct) / 100}
            style={{
              transition: "stroke-dashoffset 0.6s ease",
              filter: `drop-shadow(0 0 4px ${color}aa)`,
            }}
          />
        )}
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-display font-bold"
        style={{ color, fontSize: size * 0.3 }}
      >
        {value == null ? "–" : `${Math.round(pct)}`}
      </span>

      {showCount && count != null && count > 0 && (
        <span
          className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 font-display text-[10px] font-bold text-white"
          style={{
            background: "#d93a42",
            boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
          }}
          title={`${count} onaylı oy`}
        >
          {count}
        </span>
      )}
    </div>
  );
}
