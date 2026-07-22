"use client";

import { Mouse, TierConfig } from "@/lib/types";
import { tierOf } from "@/lib/tiers";
import MouseCard from "./MouseCard";
import TierSigil from "./TierSigil";

/**
 * Merdivenin bir bandı. Ana tier'lar rütbe arttıkça parlayan plakalar alır
 * (Monarch altın parıltılı). Ara bölgeler ("M × S") iki komşu tier'ın
 * renklerini harmanlayan özel bir bantla çizilir.
 */
export default function TierRow({
  tier,
  mice,
  index,
}: {
  tier: TierConfig;
  mice: Mouse[];
  index: number;
}) {
  const isBetween = tier.kind === "between";
  const isLove = tier.shape === "heart";
  const glow = tier.glow ?? 0;
  const upper = isBetween && tier.upper ? tierOf(tier.upper) : null;
  const lower = isBetween && tier.lower ? tierOf(tier.lower) : null;

  const rowBg = isBetween
    ? `linear-gradient(105deg, ${upper!.accent}1f 0%, transparent 42%, transparent 58%, ${lower!.accent}1f 100%)`
    : `linear-gradient(180deg, ${tier.accent}${glow >= 2.4 ? "1f" : "12"}, transparent 65%)`;

  const edge = isBetween
    ? `linear-gradient(180deg, ${upper!.accent}, ${lower!.accent})`
    : tier.accent;

  const ciftSayisi = isLove
    ? groupCouples(mice).filter((u) => u.kind === "couple").length
    : 0;

  return (
    <section
      className="glass sys-window rise-in relative flex flex-col overflow-hidden"
      style={{
        borderColor: isBetween
          ? "rgba(255,255,255,0.1)"
          : `${tier.accent}${glow >= 2.4 ? "55" : "30"}`,
        boxShadow: `0 14px 34px rgba(0,0,0,0.4)${
          glow >= 2 && !isBetween ? `, 0 0 ${14 + glow * 10}px ${tier.accent}2e` : ""
        }`,
      }}
    >
      {/* renkli sol kenar (ara bölgede iki rengin geçişi) */}
      <span
        className="absolute inset-y-0 left-0 z-10 w-[4px]"
        style={{ background: edge }}
        aria-hidden
      />

      {/*
        Başlık şeridi — ÜSTTE, içerik ortalanmış, sayaç sağ uçta mutlak
        konumda (ortalamayı kaydırmasın diye). Eskiden plaka yandaydı ve
        196px genişlik yiyordu; artık kartlar bandın tamamını kullanıyor.
      */}
      <div
        className="relative flex items-center justify-center gap-2.5 px-3 py-1.5"
        style={{
          // Parıltı ORTADA en güçlü, iki kenara doğru eriyor. Eskiden
          // soldan başlayıp sağa sönüyordu ve renk hep sola yığılmış
          // görünüyordu. Ara bölgede iki tier rengi ortada buluşur.
          background: isBetween
            ? `linear-gradient(90deg, transparent 0%, ${upper!.accent}30 38%, ${lower!.accent}30 62%, transparent 100%)`
            : `linear-gradient(90deg, transparent 0%, ${tier.accent}${
                glow >= 2.4 ? "33" : "24"
              } 50%, transparent 100%)`,
          borderBottom: `1px solid ${tier.accent}22`,
        }}
      >
        {isBetween && upper && lower ? (
          <>
            <DualSigil upper={upper} lower={lower} />
            <h2 className="font-display text-sm font-bold uppercase leading-none tracking-tight sm:text-base">
              <span style={{ color: upper.deep }}>{upper.sigil}</span>
              <span className="mx-1 text-choco/35">×</span>
              <span style={{ color: lower.deep }}>{lower.sigil}</span>
              <span
                className="ml-1.5 bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${upper.deep}, ${lower.deep})`,
                }}
              >
                ARASI
              </span>
            </h2>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.14em]"
              style={{
                color: "#e8edf4",
                background: `linear-gradient(90deg, ${upper.accent}38, ${lower.accent}38)`,
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              Ara Bölge
            </span>
          </>
        ) : (
          <>
            <TierSigil tier={tier} size={30} />
            <h2
              className={`shrink-0 font-display text-sm font-bold uppercase leading-none tracking-tight sm:text-base ${
                glow >= 2.8 ? "tier-label-legend" : ""
              }`}
              style={
                glow >= 2.8
                  ? undefined
                  : {
                      color: tier.deep,
                      textShadow: `0 0 ${glow * 7}px ${tier.accent}66`,
                    }
              }
            >
              {tier.label}
            </h2>
            <span aria-hidden className="shrink-0 text-choco/25">
              ·
            </span>
            <p
              className="min-w-0 truncate font-system text-[13px] font-bold"
              style={{ color: tier.deep, opacity: 0.8 }}
            >
              {tier.subtitle}
            </p>
          </>
        )}

        <span className="absolute right-3 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-choco/35 tabular-nums">
          {isLove ? `${ciftSayisi} Çift · ${mice.length} Fare` : `${mice.length} Fare`}
        </span>
      </div>

      {/* Kadro — bandın tüm genişliğini kullanır */}
      <div className="flex flex-wrap content-start gap-1.5 p-2.5 pl-3">
        {mice.length === 0 ? (
          <div className="flex w-full items-center py-2 pl-1 font-system text-sm font-semibold italic text-choco/25">
            {isLove ? "— Henüz çift yok —" : "— Henüz kimse yok —"}
          </div>
        ) : isLove ? (
          groupCouples(mice).map((u) =>
            u.kind === "couple" ? (
              <CoupleCard key={u.a.id} a={u.a} b={u.b} accent={tier.accent} />
            ) : (
              <MouseCard key={u.m.id} mouse={u.m} />
            )
          )
        ) : (
          mice.map((m) => <MouseCard key={m.id} mouse={m} />)
        )}
      </div>
    </section>
  );
}

type Unit =
  | { kind: "couple"; a: Mouse; b: Mouse }
  | { kind: "single"; m: Mouse };

/**
 * Aşk Köşesi'ndeki fareleri çiftlere ayırır. Eşi bu bantta olmayan
 * (ya da eşi olmayan) fareler tek başına çizilir.
 */
function groupCouples(mice: Mouse[]): Unit[] {
  const byId = new Map(mice.map((m) => [m.id, m]));
  const alindi = new Set<string>();
  const out: Unit[] = [];

  for (const m of mice) {
    if (alindi.has(m.id)) continue;
    const es = m.partner_id ? byId.get(m.partner_id) : undefined;
    if (es && !alindi.has(es.id)) {
      alindi.add(m.id);
      alindi.add(es.id);
      out.push({ kind: "couple", a: m, b: es });
    } else {
      alindi.add(m.id);
      out.push({ kind: "single", m });
    }
  }
  return out;
}

/** İki fare + aralarında atan bir kalp. */
function CoupleCard({
  a,
  b,
  accent,
}: {
  a: Mouse;
  b: Mouse;
  accent: string;
}) {
  return (
    <div
      className="flex items-center gap-1 rounded-2xl border px-2 py-1.5"
      style={{
        borderColor: `${accent}55`,
        background: `linear-gradient(135deg, ${accent}18, ${accent}08)`,
        boxShadow: `0 0 18px ${accent}22`,
      }}
    >
      <MouseCard mouse={a} />
      <span
        className="heart-beat shrink-0 px-0.5"
        aria-label="çift"
        title={`${a.nickname} & ${b.nickname}`}
      >
        <svg viewBox="0 0 100 100" width={22} height={22}>
          <path
            d="M50,89 C50,89 9,61 9,36 C9,20 21,10 33,10 C41,10 47,15 50,21 C53,15 59,10 67,10 C79,10 91,20 91,36 C91,61 50,89 50,89 Z"
            fill={accent}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="4"
          />
        </svg>
      </span>
      <MouseCard mouse={b} />
    </div>
  );
}

/**
 * Ara bölge rozeti — üst yarısı üstteki tier'ın, alt yarısı alttaki tier'ın
 * renginde bölünmüş altıgen; iki harf de üstünde.
 */
function DualSigil({ upper, lower }: { upper: TierConfig; lower: TierConfig }) {
  const gid = `dual-${upper.id}-${lower.id}`;
  return (
    <div
      className="relative shrink-0"
      style={{
        width: 30,
        height: 30,
        filter: `drop-shadow(0 6px 12px ${upper.accent}33) drop-shadow(0 -2px 10px ${lower.accent}26)`,
      }}
    >
      <svg viewBox="0 0 100 100" width={30} height={30}>
        <defs>
          <linearGradient id={`${gid}-u`} x1="0" y1="0" x2="1" y2="0.4">
            <stop offset="0%" stopColor={upper.accent} />
            <stop offset="100%" stopColor={upper.accent2} />
          </linearGradient>
          <linearGradient id={`${gid}-l`} x1="0" y1="0.6" x2="1" y2="1">
            <stop offset="0%" stopColor={lower.accent2} />
            <stop offset="100%" stopColor={lower.accent} />
          </linearGradient>
          <clipPath id={`${gid}-top`}>
            <rect x="0" y="0" width="100" height="49" />
          </clipPath>
          <clipPath id={`${gid}-bot`}>
            <rect x="0" y="51" width="100" height="49" />
          </clipPath>
        </defs>

        {/* üst yarı */}
        <polygon
          points="50,4 92,27 92,73 50,96 8,73 8,27"
          fill={`url(#${gid}-u)`}
          clipPath={`url(#${gid}-top)`}
        />
        {/* alt yarı */}
        <polygon
          points="50,4 92,27 92,73 50,96 8,73 8,27"
          fill={`url(#${gid}-l)`}
          clipPath={`url(#${gid}-bot)`}
        />
        {/* dış çizgi + orta dikiş */}
        <polygon
          points="50,4 92,27 92,73 50,96 8,73 8,27"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="2"
        />
        <line
          x1="10"
          y1="50"
          x2="90"
          y2="50"
          stroke="rgba(10,14,20,0.5)"
          strokeWidth="2.5"
        />
        <line
          x1="10"
          y1="50"
          x2="90"
          y2="50"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1"
        />

        {/* harfler */}
        <text
          x="50"
          y="40"
          textAnchor="middle"
          fontFamily="var(--font-display), sans-serif"
          fontWeight="700"
          fontSize="26"
          fill="#ffffff"
        >
          {upper.sigil}
        </text>
        <text
          x="50"
          y="86"
          textAnchor="middle"
          fontFamily="var(--font-display), sans-serif"
          fontWeight="700"
          fontSize="26"
          fill="#ffffff"
        >
          {lower.sigil}
        </text>
      </svg>
    </div>
  );
}
