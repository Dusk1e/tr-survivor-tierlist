"use client";

import { Mouse, TierConfig } from "@/lib/types";
import MouseCard from "./MouseCard";
import TierSigil from "./TierSigil";

/**
 * Tek bir bandı ikiye bölen satır — Monarch için kullanılır.
 *
 * İki yarım BİREBİR aynıdır: aynı renk, aynı rozet, aynı boyut, aynı
 * plaka genişliği. Tek fark plakanın altındaki yazı (soldaki "Efsane",
 * sağdaki "Uzun süredir aktif olmayan efsaneler").
 *
 * Yarımlar hiçbir ekran genişliğinde alt alta inmez; dar ekranda kartlar
 * kendi içinde sarar, gerekirse satır yatay kayar.
 */
export default function SplitTierRow({
  sol,
  sag,
  solMice,
  sagMice,
}: {
  sol: TierConfig;
  sag: TierConfig;
  solMice: Mouse[];
  sagMice: Mouse[];
}) {
  const glow = sol.glow ?? 0;

  return (
    <section
      className="glass sys-window rise-in relative flex overflow-hidden"
      style={{
        borderColor: `${sol.accent}${glow >= 2.4 ? "55" : "30"}`,
        boxShadow: `0 14px 34px rgba(0,0,0,0.4)${
          glow >= 2 ? `, 0 0 ${14 + glow * 10}px ${sol.accent}2e` : ""
        }`,
      }}
    >
      {/* renkli sol kenar */}
      <span
        className="absolute inset-y-0 left-0 w-[4px]"
        style={{ background: sol.accent }}
        aria-hidden
      />

      <Yarim tier={sol} mice={solMice} />

      {/* iki yarımı ayıran dikey çizgi */}
      <span
        className="w-px shrink-0"
        style={{ background: `${sol.accent}40` }}
        aria-hidden
      />

      <Yarim tier={sag} mice={sagMice} />
    </section>
  );
}

/** Bandın bir yarısı: plaka + kadro. İki yarım da bunu aynı şekilde kullanır. */
function Yarim({ tier, mice }: { tier: TierConfig; mice: Mouse[] }) {
  const glow = tier.glow ?? 0;

  return (
    <div className="flex min-w-0 flex-1">
      {/* Plaka — dar ekranda daralır ki kartlara yer kalsın. Yarımlar yine
          yan yana durur, hiçbir genişlikte alt alta inmez. */}
      <div
        className="relative flex w-[104px] shrink-0 flex-col items-start justify-center gap-2 px-3 py-5 sm:w-[150px] sm:px-4"
        style={{
          background: `linear-gradient(180deg, ${tier.accent}${
            glow >= 2.4 ? "1f" : "12"
          }, transparent 65%)`,
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <TierSigil tier={tier} size={54} />
        <div className="min-w-0">
          <h2
            className={`font-display font-bold uppercase leading-tight tracking-tight ${
              glow >= 2.8 ? "tier-label-legend text-lg" : "text-base"
            }`}
            style={
              glow >= 2.8
                ? undefined
                : {
                    color: tier.deep,
                    textShadow:
                      glow >= 1.5 ? `0 0 ${glow * 8}px ${tier.accent}66` : "none",
                  }
            }
          >
            {tier.label}
          </h2>
          <p className="mt-0.5 text-[11px] font-semibold leading-snug text-choco/55">
            {tier.subtitle}
          </p>
          <p className="mt-1 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-choco/35 tabular-nums">
            {mice.length} Fare
          </p>
        </div>
      </div>

      {/* Kadro */}
      <div className="flex flex-1 flex-wrap content-start gap-2 p-3.5">
        {mice.length === 0 ? (
          <div className="flex w-full items-center py-4 pl-1 font-system text-sm font-semibold italic text-choco/25">
            — Henüz kimse yok —
          </div>
        ) : (
          mice.map((m) => <MouseCard key={m.id} mouse={m} />)
        )}
      </div>
    </div>
  );
}
