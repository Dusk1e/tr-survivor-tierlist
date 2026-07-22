"use client";

import { useCallback, useEffect, useState } from "react";
import { DATA_EVENT, getTicker } from "@/lib/api";
import { TickerConfig } from "@/lib/types";

/**
 * "Son Dakika" haber bandı — 3B yatık kırmızı yüzey üzerinde yavaşça kayan
 * yazı. İçerik panelden yönetilir; kapalıysa ya da yazı boşsa hiç çizilmez.
 * Üzerine gelince kayma durur (okumak isteyen durdurabilsin).
 */
export default function BreakingNews() {
  const [cfg, setCfg] = useState<TickerConfig | null>(null);

  const oku = useCallback(() => {
    getTicker()
      .then(setCfg)
      .catch(() => setCfg(null));
  }, []);

  useEffect(() => {
    oku();
    window.addEventListener(DATA_EVENT, oku);
    window.addEventListener("storage", oku);
    return () => {
      window.removeEventListener(DATA_EVENT, oku);
      window.removeEventListener("storage", oku);
    };
  }, [oku]);

  const notlar = (cfg?.notlar ?? []).map((n) => n.trim()).filter(Boolean);
  if (!cfg?.aktif || notlar.length === 0) return null;

  // Süre içerik uzunluğuna göre hesaplanır: not eklendikçe bant uzar ama
  // kayma hızı sabit kalır. Yoksa çok not girilince yazı uçup gidiyordu.
  const toplamUzunluk = notlar.join("").length;
  const sure = Math.max(12, Math.round((toplamUzunluk / 100) * cfg.hiz));

  return (
    <div className="sd-sahne mb-6" role="status" aria-live="polite">
      <div className="sd-yuzey flex items-stretch overflow-hidden rounded-xl border border-red-300/25">
        {/* Sol plaka */}
        <div className="flex shrink-0 items-center py-2 pl-2.5 pr-3 sm:pl-3">
          <span className="sd-etiket flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-[0.14em] sm:text-xs">
            <span className="sd-nokta h-2 w-2 rounded-full bg-red-700" />
            Son Dakika
          </span>
        </div>

        {/* Kayan yazı */}
        <div className="sd-maske relative flex-1 overflow-hidden">
          <div className="sd-kay py-2.5" style={{ animationDuration: `${sure}s` }}>
            <Parca notlar={notlar} />
            <Parca notlar={notlar} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Şeridin bir kopyası — bütün notlar sırayla, aralarında ayraçla dizilir.
 * İki kopya yan yana durur; şerit kendi genişliğinin yarısı kadar
 * kaydığında ikinci kopya birincinin yerine oturur, yani son nottan sonra
 * ilk nota dönüş dikişsiz olur.
 */
function Parca({ notlar }: { notlar: string[] }) {
  return (
    <span className="sd-metin flex shrink-0 items-center font-system text-sm font-bold text-white sm:text-[15px]">
      {notlar.map((not, i) => (
        <span key={i} className="flex shrink-0 items-center">
          <span className="px-6">{not}</span>
          <span aria-hidden className="text-white/40">
            ◆
          </span>
        </span>
      ))}
    </span>
  );
}
