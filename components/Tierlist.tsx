"use client";

import { useMemo } from "react";
import { SLOTS } from "@/lib/tiers";
import { Mouse } from "@/lib/types";
import TierRow from "./TierRow";
import BreakingNews from "./BreakingNews";
import { useSession } from "./SessionProvider";

/**
 * Public ladder. Renders all 6 main tiers (always) + the 5 between-slots
 * (only when someone is placed there). Data comes from SessionProvider so
 * scores, sessions and the roster stay in sync everywhere.
 */
export default function Tierlist() {
  const { ready, mice, totalApproved } = useSession();

  const grouped = useMemo(() => {
    const map: Record<string, Mouse[]> = {};
    for (const s of SLOTS) map[s.id] = [];
    for (const m of mice) {
      if (map[m.tier]) map[m.tier].push(m);
      else map["de"].push(m); // unknown slot fallback
    }
    for (const id of Object.keys(map)) {
      map[id].sort(
        (a, b) =>
          (a.sort ?? 0) - (b.sort ?? 0) || a.nickname.localeCompare(b.nickname)
      );
    }
    return map;
  }, [mice]);

  return (
    <div className="mx-auto w-full max-w-wide px-5 py-6 sm:px-8">
      {/* Nasıl oy verilir — en üstte */}
      <NasilOyVerilir />

      {/* Son Dakika bandı — panelden açılır, kapalıysa hiç çizilmez */}
      <BreakingNews />

      {/* disclaimer */}
      <div
        className="mb-6 rounded-2xl border border-cheese/25 bg-cheese/[0.07] px-4 py-3 text-center"
        style={{ borderLeft: "3px solid #d7a441" }}
      >
        <p className="font-system text-sm font-semibold text-cheese-deep">
          Tierlist sıralaması değişkendir. Aktif oynanışa göre değil; zamana
          göre genel bir değerlendirmedir!
        </p>
        {/* Küçük ama gözden kaçmayan hatırlatma. */}
        <p className="mt-2 flex justify-center">
          <span
            className="inline-block rounded-full px-3 py-1 font-system text-xs font-bold"
            style={{
              color: "#8ad2f2",
              background: "rgba(79,179,224,0.12)",
              border: "1px solid rgba(79,179,224,0.45)",
            }}
          >
            Puanlar sadece oyuncunun istatistiğini belirler.
          </span>
        </p>
      </div>

      {/* Stats strip */}
      <div
        className="mb-6 flex flex-wrap items-center justify-center gap-4 text-center sm:justify-between"
      >
        <Stat label="Toplam Fare" value={ready ? String(mice.length) : "…"} accent="#49c0c2" />
        <Stat label="Onaylı Oy" value={ready ? String(totalApproved) : "…"} accent="#d7a441" />
        <Stat label="Bölge" value="Türkiye" accent="#e5646b" />
        <Stat label="Mod" value="Survivor" accent="#9b82f0" />
      </div>

      {/* Ladder */}
      <div className="space-y-4">
        {!ready
          ? SLOTS.map((s) => (
              <div
                key={s.id}
                className={`glass animate-pulse rounded-2xl ${
                  s.kind === "between" ? "h-20" : "h-32"
                }`}
                style={{ borderColor: `${s.accent}22` }}
              />
            ))
          : SLOTS.map((s, i) => (
              <TierRow
                key={s.id}
                tier={s}
                mice={grouped[s.id] ?? []}
                index={i}
              />
            ))}
      </div>

    </div>
  );
}

/**
 * Nasıl oy verilir — sayfanın en üstünde, üç eşit adım hâlinde.
 * Adımlar ortalanır ve aralarına ok konur; dar ekranda alt alta iner.
 */
function NasilOyVerilir() {
  const adimlar = [
    { no: 1, baslik: "Kendi farene tıkla", renk: "#49c0c2" },
    { no: 2, baslik: "Şifrenle giriş yap", renk: "#d7a441" },
    { no: 3, baslik: "Gerçekçi oy ver", renk: "#74d36a" },
  ];

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-4">
        {adimlar.map((a, i) => (
          <div key={a.no} className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold"
                style={{
                  color: "#0b0f15",
                  background: a.renk,
                  boxShadow: `0 0 14px ${a.renk}66`,
                }}
              >
                {a.no}
              </span>
              <span
                className="whitespace-nowrap font-system text-sm font-bold sm:text-[15px]"
                style={{ color: a.renk }}
              >
                {a.baslik}
              </span>
            </div>
            {i < adimlar.length - 1 && (
              <span className="hidden text-lg font-bold text-choco/25 sm:inline">
                →
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 2. adımın rengiyle bağ kurar — şifrenin nereden alınacağı. */}
      <p
        className="mt-4 text-center font-system text-[13px] font-bold"
        style={{ color: "#d7a441" }}
      >
        Şifreni yetkililerden alabilirsin.
      </p>

      <p className="mx-auto mt-1.5 max-w-2xl text-center font-system text-xs font-medium leading-relaxed text-choco/45">
        Oynayışını bilmediğin fareleri puanlama lütfen. Puanlar yetkili
        onayından sonra ortalamaya işlenir.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="glass sys-window min-w-[140px] flex-1 overflow-hidden px-4 py-3">
      <span
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${accent}, transparent 75%)`,
        }}
        aria-hidden
      />
      <div className="font-display text-2xl font-bold text-choco tabular-nums">
        {value}
      </div>
      <div className="font-system text-[10px] font-bold uppercase tracking-[0.2em] text-choco/45">
        {label}
      </div>
    </div>
  );
}
