"use client";

import { useMemo } from "react";
import { SLOTS, SLOT_MAP } from "@/lib/tiers";
import { Mouse } from "@/lib/types";
import TierRow from "./TierRow";
import SplitTierRow from "./SplitTierRow";
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
      {/* TFM Bülteni en üstte — haber bandı olduğu için tam genişlik */}
      <BreakingNews />

      {/*
        Giriş bloğu bültenle ve merdivenle AYNI genişlikte. Daha önce
        ortalanmış dar bir sütundu; içerik artık ortada küçük bir küme değil,
        genişliği eşit paylaşan bir ızgara olduğu için tam genişlikte de
        dolu duruyor. Böylece sayfadaki bütün bloklar aynı hizada.
      */}
      <div className="mb-6">
        <UstBilgi />

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Stat label="Toplam Fare" value={ready ? String(mice.length) : "…"} />
          <Stat label="Onaylı Oy" value={ready ? String(totalApproved) : "…"} />
          <Stat label="Bölge" value="Türkiye" />
          <Stat label="Mod" value="Survivor" />
        </div>
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
          : SLOTS.map((s, i) => {
              // monarch_respect kendi satırını almaz; Monarch'ın sağ yarısı
              // olarak aynı bandın içinde çizilir.
              if (s.id === "monarch_respect") return null;

              if (s.id === "monarch") {
                const sag = SLOT_MAP["monarch_respect"];
                if (sag)
                  return (
                    <SplitTierRow
                      key={s.id}
                      sol={s}
                      sag={sag}
                      solMice={grouped[s.id] ?? []}
                      sagMice={grouped["monarch_respect"] ?? []}
                    />
                  );
              }

              return (
                <TierRow
                  key={s.id}
                  tier={s}
                  mice={grouped[s.id] ?? []}
                  index={i}
                />
              );
            })}
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
    { baslik: "Kendi farene tıkla", alt: "Listede kendi adını bul" },
    { baslik: "Şifrenle giriş yap", alt: "Şifreni yetkililerden al" },
    { baslik: "Gerçekçi oy ver", alt: "Tanımadığını puanlama" },
  ];

  return (
    // Genişliği dışarıdaki giriş bloğu belirler; burada sadece kutu var.
    <div className="mb-2.5">
      <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4">
        {/* Üç EŞİT sütun — her adım kendi hücresinde, aralarında ince çizgi.
            Tek satıra dizilmiş nokta ayraçlı metinden çok daha okunur ve
            gerçekten simetrik. */}
        <div className="grid grid-cols-1 divide-y divide-white/8 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {adimlar.map((a, i) => (
            <div
              key={a.baslik}
              className="flex flex-col items-center gap-1 px-3 py-2 text-center sm:py-0"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-teal/75 font-display text-[10px] font-bold text-abyss">
                  {i + 1}
                </span>
                <span className="font-system text-[13px] font-bold text-choco/90">
                  {a.baslik}
                </span>
              </div>
              <span className="font-system text-[11px] font-medium text-choco/40">
                {a.alt}
              </span>
            </div>
          ))}
        </div>

        <div className="hairline my-3" />

        {/* Kurallar — tek renk (sarı), iki kısa satır */}
        <p className="text-center font-system text-[11px] font-semibold leading-[1.7] text-cheese-deep">
          Puanlar yetkili onayından sonra ortalamaya işlenir
          <br className="sm:hidden" />
          <span aria-hidden className="mx-2 hidden text-cheese-deep/35 sm:inline">
            ·
          </span>
          Puanlar sadece oyuncunun istatistiğini belirler
          <br />
          <span className="text-cheese-deep/70">
            Sıralama değişkendir, zamana göre genel bir değerlendirmedir
          </span>
        </p>
      </div>
    </div>
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
