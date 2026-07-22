"use client";

import { useId } from "react";
import { puanRengi } from "@/lib/tiers";

/**
 * Puan halkası. Renk, puanın denk geldiği TIER'ın rengidir — 89+ Monarch
 * altını, 84+ Monarch/S geçişi, 79+ S moru… 55 altı turuncu, 30 altı kırmızı.
 * Sağ alttaki kırmızı rozet kaç ONAYLI oya dayandığını gösterir.
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

  const renk =
    value == null
      ? {
          ana: "#5b6470",
          ikinci: undefined,
          yazi: undefined,
          parilti: 0,
          etiket: "",
        }
      : puanRengi(pct);

  const yaziRengi = renk.yazi ?? renk.ana;
  // Parıltı banda göre: üst bantlar ışıldar, alt bantlar sessizdir.
  const golge =
    renk.parilti > 0
      ? `drop-shadow(0 0 ${2 + renk.parilti * 5}px ${renk.ana}${
          Math.round(90 + renk.parilti * 120)
            .toString(16)
            .padStart(2, "0")
        })`
      : "none";

  // İki renkli bantta halka için gradyan gerekiyor; id'ler örnek başına eşsiz.
  const uid = useId().replace(/[:»]/g, "");
  const gid = `sr-${uid}`;
  const cizgi = renk.ikinci ? `url(#${gid})` : renk.ana;

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
      title={renk.etiket ? `${Math.round(pct)} · ${renk.etiket}` : undefined}
    >
      <svg width={size} height={size} className="-rotate-90">
        {renk.ikinci && (
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={renk.ana} />
              <stop offset="100%" stopColor={renk.ikinci} />
            </linearGradient>
          </defs>
        )}
        {/* İz — halkanın kendi renginin çok soluk hâli. Nötr griye göre
            daha bütünlüklü duruyor, halka zemine oturmuş gibi görünüyor. */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="rgba(10,14,20,0.78)"
          stroke={`${renk.ana}26`}
          strokeWidth={stroke}
        />
        {value != null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={cizgi}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * pct) / 100}
            style={{
              transition: "stroke-dashoffset 0.6s ease",
              filter: golge,
            }}
          />
        )}
      </svg>

      {/* Rakam DÜZ renkle yazılır. İki renkli bantta gradyan metin
          deneniyordu ama bu punto (~10px) için okunaksızdı; geçiş etkisi
          zaten halkada duruyor, rakamın okunması daha önemli. */}
      <span
        className="absolute inset-0 flex items-center justify-center font-display font-bold"
        style={{ color: yaziRengi, fontSize: size * 0.3 }}
      >
        {value == null ? "–" : `${Math.round(pct)}`}
      </span>

      {/* Onaylı oy sayısı — dairenin SAĞ ALTINDA, kırmızı rozet.
          Tier taban puanı bu sayıya dahil değildir. */}
      {showCount && count != null && count > 0 && (
        <span
          className="absolute -bottom-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 font-display text-[10px] font-bold text-white"
          style={{
            background: "#d93a42",
            boxShadow: "0 2px 6px rgba(0,0,0,0.55)",
          }}
          title={`${count} onaylı oy`}
        >
          {count}
        </span>
      )}
    </div>
  );
}
