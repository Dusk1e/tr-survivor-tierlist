"use client";

import { Mouse, TierConfig } from "@/lib/types";
import MouseCard from "./MouseCard";
import TierSigil from "./TierSigil";

/**
 * Tek bir bandı ikiye bölen satır — Monarch için kullanılır.
 *
 * Diğer bantlardan farklı olarak plaka YANDA değil ÜSTTE durur: her yarım,
 * tek satırlık ince bir başlık şeridi + altında kadro şeklindedir. Böylece
 * kartlar yarımın tüm genişliğini kullanır ve bant daha az yer kaplar.
 *
 * İki yarım BİREBİR aynıdır (renk, rozet, boyut); tek fark başlıktaki alt
 * yazı. Hiçbir ekran genişliğinde alt alta inmezler.
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
      <span
        className="absolute inset-y-0 left-0 w-[4px]"
        style={{ background: sol.accent }}
        aria-hidden
      />

      <Yarim tier={sol} mice={solMice} />

      <span
        className="w-px shrink-0"
        style={{ background: `${sol.accent}40` }}
        aria-hidden
      />

      <Yarim tier={sag} mice={sagMice} />
    </section>
  );
}

/** Bandın bir yarısı: üstte tek satırlık başlık, altında kadro. */
function Yarim({ tier, mice }: { tier: TierConfig; mice: Mouse[] }) {
  const glow = tier.glow ?? 0;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Başlık şeridi — sigil, ad, alt yazı ve sayaç tek satırda */}
      <div
        className="flex items-center gap-2 px-3 py-1.5"
        style={{
          background: `linear-gradient(180deg, ${tier.accent}${
            glow >= 2.4 ? "22" : "14"
          }, transparent)`,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <TierSigil tier={tier} size={30} />

        <h2
          className={`shrink-0 font-display text-sm font-bold uppercase leading-none tracking-tight ${
            glow >= 2.8 ? "tier-label-legend" : ""
          }`}
          style={
            glow >= 2.8
              ? undefined
              : { color: tier.deep, textShadow: `0 0 ${glow * 6}px ${tier.accent}55` }
          }
        >
          {tier.label}
        </h2>

        <span aria-hidden className="shrink-0 text-choco/20">
          ·
        </span>

        <p className="min-w-0 truncate font-system text-[11px] font-medium text-choco/45">
          {tier.subtitle}
        </p>

        <span className="ml-auto shrink-0 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-choco/35 tabular-nums">
          {mice.length} Fare
        </span>
      </div>

      {/* Kadro — yarımın tüm genişliğini kullanır */}
      <div className="flex flex-1 flex-wrap content-start gap-1.5 p-2.5">
        {mice.length === 0 ? (
          <div className="flex w-full items-center py-3 pl-1 font-system text-sm font-semibold italic text-choco/25">
            — Henüz kimse yok —
          </div>
        ) : (
          mice.map((m) => <MouseCard key={m.id} mouse={m} />)
        )}
      </div>
    </div>
  );
}
