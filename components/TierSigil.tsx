"use client";

import { TierConfig } from "@/lib/types";

/**
 * Modern rank badge — a beveled hexagon with per-tier gradient, inner ring
 * and glow that scales with the tier's `glow` level. Sharp, not childish.
 */
export default function TierSigil({
  tier,
  size = 56,
}: {
  tier: TierConfig;
  size?: number;
}) {
  const gid = `sig-${tier.id}`;
  const glow = tier.glow ?? 0;
  const isHeart = tier.shape === "heart";

  /** Aşk Köşesi rozeti — altıgen yerine çizilmiş kalp. */
  const HEART =
    "M50,89 C50,89 9,61 9,36 C9,20 21,10 33,10 C41,10 47,15 50,21 " +
    "C53,15 59,10 67,10 C79,10 91,20 91,36 C91,61 50,89 50,89 Z";
  const HEART_INNER =
    "M50,79 C50,79 18,57 18,37 C18,25 26,18 34,18 C41,18 46,23 50,29 " +
    "C54,23 59,18 66,18 C74,18 82,25 82,37 C82,57 50,79 50,79 Z";

  return (
    <div
      className="relative shrink-0"
      style={{
        width: size,
        height: size,
        filter: `drop-shadow(0 6px ${8 + glow * 6}px ${tier.accent}${
          glow >= 2 ? "66" : "40"
        })`,
      }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={tier.accent} />
            <stop offset="100%" stopColor={tier.accent2} />
          </linearGradient>
          <linearGradient id={`${gid}-hi`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {isHeart ? (
          <>
            <path
              d={HEART}
              fill={`url(#${gid})`}
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="2"
            />
            <path
              d={HEART_INNER}
              fill="none"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="2"
            />
            {/* parlama */}
            <ellipse cx="34" cy="28" rx="9" ry="6" fill="rgba(255,255,255,0.45)" />
          </>
        ) : (
          <>
            {/* hexagon */}
            <polygon
              points="50,4 92,27 92,73 50,96 8,73 8,27"
              fill={`url(#${gid})`}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="2"
            />
            {/* inner ring */}
            <polygon
              points="50,12 84,31 84,69 50,88 16,69 16,31"
              fill="none"
              stroke="rgba(10,14,20,0.35)"
              strokeWidth="3"
            />
            {/* top gloss */}
            <polygon
              points="50,4 92,27 92,50 8,50 8,27"
              fill={`url(#${gid}-hi)`}
            />

            <text
              x="50"
              y="63"
              textAnchor="middle"
              fontFamily="var(--font-display), sans-serif"
              fontWeight="700"
              fontSize="42"
              fill="#ffffff"
              style={{ letterSpacing: "-0.02em" }}
            >
              {tier.sigil}
            </text>
          </>
        )}
      </svg>

      {/* extra aura for the top tiers */}
      {glow >= 2.4 && (
        <span
          className="pointer-events-none absolute inset-0 animate-pulse-glow rounded-full"
          style={{ boxShadow: `0 0 ${14 + glow * 8}px ${tier.accent}55` }}
        />
      )}
    </div>
  );
}
