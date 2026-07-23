"use client";

import { useCallback, useEffect, useState } from "react";
import { getSiteConfig, saveSiteConfig } from "@/lib/api";
import { SiteConfig, SITE_VARSAYILAN } from "@/lib/types";

/**
 * Site görünüm ayarları. Şimdilik tek anahtar: Monarch'ın "Uzun süredir
 * aktif olmayan efsaneler" yarısını public sayfada aç/kapat. Değişiklik
 * anında yayına girer — ayrıca "kaydet" demeye gerek yok.
 */
export default function AdminSite({
  onToast,
}: {
  onToast: (msg: string, kind?: "ok" | "err") => void;
}) {
  const [cfg, setCfg] = useState<SiteConfig>(SITE_VARSAYILAN);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setCfg(await getSiteConfig());
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Yüklenemedi");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function yaz(sonraki: SiteConfig, mesaj: string) {
    setBusy(true);
    setErr(null);
    const oncesi = cfg;
    setCfg(sonraki); // anında geri bildirim
    try {
      setCfg(await saveSiteConfig(sonraki));
      onToast(mesaj);
    } catch (e: any) {
      setCfg(oncesi); // başarısızsa geri al
      setErr(e?.message ?? "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-strong sys-window p-5 sm:p-6">
      <div className="mb-1 font-display text-base font-bold uppercase tracking-[0.12em] text-teal-deep">
        Görünüm
      </div>
      <p className="mb-5 text-xs font-medium text-choco/50">
        Sitenin bazı bölümlerini buradan aç/kapat. Değişiklikler anında yayına
        girer.
      </p>

      {err && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
          {err}
        </p>
      )}

      {/* Monarch 2 anahtarı */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-4"
        style={{
          borderColor: cfg.monarch2
            ? "rgba(232,182,76,0.4)"
            : "rgba(255,255,255,0.1)",
          background: cfg.monarch2
            ? "linear-gradient(135deg, rgba(232,182,76,0.12), transparent)"
            : "rgba(255,255,255,0.03)",
        }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-system text-sm font-bold text-choco">
            <span
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(145deg, #e8b64c, #b8862f)" }}
            >
              M
            </span>
            Monarch 2 — “Uzun süredir aktif olmayan efsaneler”
          </div>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-choco/50">
            Açıkken Monarch bandı ikiye bölünür; sağ yarıda uzun süredir aktif
            olmayan efsaneler durur. Kapatınca o yarı sayfadan kalkar, Monarch
            tek ve tam genişlikte bir bant olur.
            <br />
            <span className="text-choco/35">
              (Oradaki fareler silinmez — sadece gizlenir; “Fareler”
              sekmesinden hâlâ yönetebilirsin.)
            </span>
          </p>
        </div>

        <Anahtar
          acik={cfg.monarch2}
          disabled={busy || !loaded}
          onToggle={(v) =>
            yaz(
              { ...cfg, monarch2: v },
              v
                ? "Monarch 2 açıldı — sayfada görünüyor."
                : "Monarch 2 kapatıldı — sayfadan kalktı."
            )
          }
        />
      </div>

      <p className="mt-4 font-system text-[11px] font-medium text-choco/35">
        Durum:{" "}
        <b className={cfg.monarch2 ? "text-green-300" : "text-choco/50"}>
          {cfg.monarch2 ? "Açık (görünüyor)" : "Kapalı (gizli)"}
        </b>
      </p>
    </div>
  );
}

/** Sürgülü aç/kapa anahtarı — sade, tıklanabilir. */
function Anahtar({
  acik,
  disabled,
  onToggle,
}: {
  acik: boolean;
  disabled?: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={acik}
      disabled={disabled}
      onClick={() => onToggle(!acik)}
      className="relative inline-flex h-7 w-[52px] shrink-0 items-center rounded-full transition-colors disabled:opacity-50"
      style={{
        background: acik ? "#e8b64c" : "rgba(255,255,255,0.16)",
        boxShadow: acik ? "0 0 14px rgba(232,182,76,0.5)" : "none",
      }}
    >
      <span
        className="absolute h-5 w-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: acik ? "translateX(27px)" : "translateX(4px)" }}
      />
    </button>
  );
}
