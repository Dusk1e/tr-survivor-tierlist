"use client";

import { DIMS, zoneOf } from "@/lib/dims";
import { Scores } from "@/lib/types";

/**
 * Per-dimension average bars: label · gradient-filled bar · % · zone tag.
 * The core "istatistik" view for a mouse.
 */
export default function ScoreBars({
  scores,
  compact = false,
}: {
  scores: Scores;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-1.5" : "space-y-2.5"}>
      {DIMS.map((d) => {
        const v = Math.round(scores[d.id] ?? 0);
        const zone = zoneOf(v);
        return (
          <div key={d.id}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span
                className={`font-system font-semibold text-choco/80 ${
                  compact ? "text-[11px]" : "text-sm"
                }`}
              >
                {d.label}
              </span>
              <span className="flex items-center gap-1.5">
                {!compact && (
                  <span
                    className="rounded-md px-1.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-wide"
                    style={{
                      color: zone.color,
                      background: `${zone.color}1c`,
                      border: `1px solid ${zone.color}55`,
                    }}
                  >
                    {zone.label}
                  </span>
                )}
                <span
                  className={`font-display font-bold ${
                    compact ? "text-[11px]" : "text-sm"
                  }`}
                  style={{ color: zone.color }}
                >
                  %{v}
                </span>
              </span>
            </div>
            <div
              className={`w-full overflow-hidden rounded-full ${
                compact ? "h-1.5" : "h-2.5"
              }`}
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${v}%`,
                  background: `linear-gradient(90deg, ${zone.color}88, ${zone.color})`,
                  boxShadow: `0 0 8px ${zone.color}66`,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
