"use client";

import { useCallback, useEffect, useState } from "react";
import { DATA_EVENT, getTicker } from "@/lib/api";
import { TickerConfig } from "@/lib/types";
import TickerBar from "./TickerBar";

/**
 * "TFM Bülteni" haber bandı. İçerik panelden yönetilir; kapalıysa ya da
 * hiç not yoksa çizilmez. Fare üzerine gelince akış durmaz.
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
    // Panel ayrı bir sekmede olabilir; orada yapılan değişikliği bu sayfa
    // duymaz. Bu yüzden sekmeye dönünce ve periyodik olarak yeniden okuruz —
    // roster/oy verisiyle aynı davranış.
    const onVisible = () => {
      if (document.visibilityState === "visible") oku();
    };
    window.addEventListener(DATA_EVENT, oku);
    window.addEventListener("storage", oku);
    window.addEventListener("focus", oku);
    document.addEventListener("visibilitychange", onVisible);
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") oku();
    }, 12_000);
    return () => {
      window.removeEventListener(DATA_EVENT, oku);
      window.removeEventListener("storage", oku);
      window.removeEventListener("focus", oku);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(t);
    };
  }, [oku]);

  const notlar = (cfg?.notlar ?? []).map((n) => n.trim()).filter(Boolean);
  if (!cfg?.aktif || notlar.length === 0) return null;

  return (
    <div className="sd-sahne mb-6" role="status" aria-live="polite">
      <TickerBar notlar={notlar} hiz={cfg.hiz} />
    </div>
  );
}
