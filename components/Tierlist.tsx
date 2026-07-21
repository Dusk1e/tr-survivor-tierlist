"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { SLOTS } from "@/lib/tiers";
import { Mouse } from "@/lib/types";
import TierRow from "./TierRow";
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
      {/* disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-2xl border border-cheese/25 bg-cheese/[0.07] px-4 py-3 text-center"
        style={{ borderLeft: "3px solid #d7a441" }}
      >
        <p className="font-system text-sm font-semibold text-cheese-deep">
          Tierlist sıralaması değişkendir. Aktif oynanışa göre değil; zamana
          göre genel bir değerlendirmedir!
        </p>
      </motion.div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-wrap items-center justify-center gap-4 text-center sm:justify-between"
      >
        <Stat label="Toplam Fare" value={ready ? String(mice.length) : "…"} accent="#49c0c2" />
        <Stat label="Onaylı Oy" value={ready ? String(totalApproved) : "…"} accent="#d7a441" />
        <Stat label="Bölge" value="Türkiye" accent="#e5646b" />
        <Stat label="Mod" value="Survivor" accent="#9b82f0" />
      </motion.div>

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

      {/* How-to hint */}
      <p className="mt-8 text-center font-system text-sm font-semibold leading-relaxed text-choco/60">
        <span className="text-teal-deep">Kendi farene tıkla</span> → sana
        verilen <span className="text-cheese-deep">şifre ile giriş yap</span> →
        tanıdığın farelere{" "}
        <span className="text-grass-deep">gerçekçi oy ver</span>.
        <br />
        <span className="text-xs font-medium text-choco/40">
          Oynayışını bilmediğin fareleri puanlama lütfen. Puanlar yetkili
          onayından sonra ortalamaya işlenir.
        </span>
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
