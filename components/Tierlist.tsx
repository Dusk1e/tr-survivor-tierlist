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
      {/* Nasıl oy verilir + uyarılar — hepsi tek panelde */}
      <UstBilgi />

      {/* TFM Bülteni — panelden açılır, kapalıysa hiç çizilmez */}
      <BreakingNews />

      {/* Sayaçlar */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Toplam Fare" value={ready ? String(mice.length) : "…"} />
        <Stat label="Onaylı Oy" value={ready ? String(totalApproved) : "…"} />
        <Stat label="Bölge" value="Türkiye" />
        <Stat label="Mod" value="Survivor" />
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
 * Sayfa başındaki tek bilgi paneli: adımlar + notlar + uyarı.
 *
 * Eskiden bunlar iki ayrı kutuydu ve her satır farklı renkteydi; üst taraf
 * hem kalabalık hem alacalı duruyordu. Tek kutuda topladım, renk sayısını
 * ikiye indirdim (nötr + sarı uyarı) ve parıltıları kaldırdım.
 */
function UstBilgi() {
  const adimlar = [
    "Kendi farene tıkla",
    "Şifrenle giriş yap",
    "Gerçekçi oy ver",
  ];

  return (
    <div className="mb-5 rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-4 sm:px-6">
      {/* Adımlar — tek renk, parıltısız */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
        {adimlar.map((baslik, i) => (
          <div key={baslik} className="flex items-center gap-2">
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-teal/80 font-display text-[11px] font-bold text-abyss">
              {i + 1}
            </span>
            <span className="whitespace-nowrap font-system text-sm font-bold text-choco/90">
              {baslik}
            </span>
            {i < adimlar.length - 1 && (
              <span className="mx-1 hidden text-choco/20 sm:inline">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Notlar — tek satır, sönük */}
      <p className="mx-auto mt-2.5 max-w-3xl text-center font-system text-[11px] font-medium leading-relaxed text-choco/40">
        Şifreni yetkililerden alabilirsin
        <Ayrac />
        Oynayışını bilmediğin fareleri puanlama
        <Ayrac />
        Puanlar yetkili onayından sonra ortalamaya işlenir
      </p>

      <div className="hairline my-3" />

      {/* Uyarı — tek renk (sarı) */}
      <p className="text-center font-system text-xs font-semibold text-cheese-deep">
        Tierlist sıralaması değişkendir, zamana göre genel bir değerlendirmedir
        <Ayrac />
        Puanlar sadece oyuncunun istatistiğini belirler
      </p>
    </div>
  );
}

/** Satır içi ayraç — noktalarla ayrılan kısa notlar için. */
function Ayrac() {
  return (
    <span aria-hidden className="mx-2 text-choco/20">
      ·
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2.5 text-center">
      <div className="font-display text-xl font-bold text-choco tabular-nums">
        {value}
      </div>
      <div className="font-system text-[9px] font-bold uppercase tracking-[0.18em] text-choco/35">
        {label}
      </div>
    </div>
  );
}
