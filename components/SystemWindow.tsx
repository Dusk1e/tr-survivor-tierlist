"use client";

import { Mouse, TargetAgg } from "@/lib/types";
import { tierOf } from "@/lib/tiers";
import { formatName } from "@/lib/format";
import MouseAvatar from "./MouseAvatar";
import ScoreBars from "./ScoreBars";
import ScoreRing from "./ScoreRing";

/** Hover peek card: identity + quick stats. Click opens the full modal. */
export default function SystemWindow({
  mouse,
  agg,
}: {
  mouse: Mouse;
  agg: TargetAgg | null;
}) {
  const tier = tierOf(mouse.tier);

  return (
    <div
      className="glass-strong sys-window w-[268px] p-4"
      style={{
        boxShadow: `0 0 0 1px ${tier.accent}3a, 0 16px 40px rgba(0,0,0,0.6)`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border"
          style={{ borderColor: `${tier.accent}88`, background: `${tier.accent}14` }}
        >
          <MouseAvatar src={mouse.image_url} alt={mouse.nickname} accent={tier.accent} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-base font-bold text-choco">
            {formatName(mouse.nickname)}
          </div>
          <div
            className="font-system text-[10px] font-bold uppercase tracking-wider"
            style={{ color: tier.deep }}
          >
            {tier.label}
          </div>
        </div>
        <ScoreRing
          value={agg ? agg.overall : null}
          count={agg?.count}
          size={42}
          stroke={4}
        />
      </div>

      <div className="my-3 hairline" />

      {agg ? (
        <>
          <ScoreBars scores={agg.avg} compact />
          <div className="mt-2 text-center font-system text-[10px] font-semibold uppercase tracking-wider text-choco/40">
            {agg.count > 0
              ? `${agg.count} onaylı oy · detay için tıkla`
              : "Tier başlangıç puanı · detay için tıkla"}
          </div>
        </>
      ) : (
        <div className="py-1 text-center font-system text-xs font-semibold text-choco/40">
          Henüz onaylı oy yok — ilk sen puanla!
        </div>
      )}
    </div>
  );
}
