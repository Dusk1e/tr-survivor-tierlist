"use client";

import { useCallback, useEffect, useState } from "react";
import { getTicker, saveTicker } from "@/lib/api";
import { TickerConfig, TICKER_VARSAYILAN } from "@/lib/types";

/**
 * Son Dakika bandı yönetimi — yazıyı, açık/kapalı durumunu ve kayma hızını
 * belirler. Kaydedilen içerik anında siteye yansır.
 */
export default function AdminTicker({
  onToast,
}: {
  onToast: (msg: string, kind?: "ok" | "err") => void;
}) {
  const [cfg, setCfg] = useState<TickerConfig>(TICKER_VARSAYILAN);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      setCfg(await getTicker());
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

  async function kaydet() {
    setBusy(true);
    setErr(null);
    try {
      setCfg(await saveTicker(cfg));
      onToast(
        cfg.aktif && cfg.metin.trim()
          ? "Son Dakika bandı yayında."
          : "Son Dakika bandı kapatıldı."
      );
    } catch (e: any) {
      setErr(e?.message ?? "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  const metinVar = cfg.metin.trim().length > 0;

  return (
    <div className="glass-strong sys-window p-5 sm:p-6">
      <div className="mb-1 font-display text-base font-bold uppercase tracking-[0.12em] text-red-300">
        Son Dakika Bandı
      </div>
      <p className="mb-4 text-xs font-medium text-choco/50">
        Sitenin en üstünde, kayan kırmızı haber şeridi. Yazıyı boş bırakırsan
        ya da anahtarı kapatırsan bant hiç görünmez.
      </p>

      {err && (
        <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
          {err}
        </p>
      )}

      <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm font-bold text-choco">
        <input
          type="checkbox"
          checked={cfg.aktif}
          disabled={busy || !loaded}
          onChange={(e) => setCfg({ ...cfg, aktif: e.target.checked })}
          className="h-4 w-4 accent-red-500"
        />
        Bandı yayına al
      </label>

      <label className="label" htmlFor="sd-metin">
        Haber yazısı
      </label>
      <textarea
        id="sd-metin"
        className="field min-h-[80px] resize-y"
        maxLength={500}
        disabled={busy || !loaded}
        value={cfg.metin}
        onChange={(e) => setCfg({ ...cfg, metin: e.target.value })}
        placeholder="Örn: 3. sezon kayıtları açıldı — katılmak için yetkililere yazın!"
      />
      <div className="mb-4 mt-1 text-right font-system text-[11px] font-medium text-choco/35">
        {cfg.metin.length} / 500
      </div>

      <label className="label" htmlFor="sd-hiz">
        Kayma hızı — bir tur {cfg.hiz} saniye
      </label>
      <input
        id="sd-hiz"
        type="range"
        min={10}
        max={120}
        step={5}
        disabled={busy || !loaded}
        value={cfg.hiz}
        onChange={(e) => setCfg({ ...cfg, hiz: Number(e.target.value) })}
        className="w-full accent-red-500"
      />
      <div className="mb-4 flex justify-between font-system text-[11px] font-medium text-choco/35">
        <span>Hızlı (10 sn)</span>
        <span>Yavaş (120 sn)</span>
      </div>

      {/* Önizleme — sitedeki bandın birebir aynısı */}
      <div className="label">Önizleme</div>
      {metinVar ? (
        <div className="sd-sahne mb-4 mt-1">
          <div className="sd-yuzey flex items-stretch overflow-hidden rounded-xl border border-red-300/25">
            <div className="flex shrink-0 items-center py-2 pl-2.5 pr-3">
              <span className="sd-etiket flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-[0.14em]">
                <span className="sd-nokta h-2 w-2 rounded-full bg-red-700" />
                Son Dakika
              </span>
            </div>
            <div className="sd-maske relative flex-1 overflow-hidden">
              <div
                className="sd-kay py-2.5"
                style={{ animationDuration: `${cfg.hiz}s` }}
              >
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className="sd-metin flex shrink-0 items-center font-system text-sm font-bold text-white"
                  >
                    <span className="px-6">{cfg.metin.trim()}</span>
                    <span className="text-white/45">•</span>
                    <span className="px-6">{cfg.metin.trim()}</span>
                    <span className="text-white/45">•</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="mb-4 mt-1 text-sm font-medium italic text-choco/35">
          Yazı girince önizleme burada görünür.
        </p>
      )}

      <button
        onClick={kaydet}
        disabled={busy || !loaded}
        className="btn-primary disabled:opacity-50"
      >
        {busy ? "Kaydediliyor…" : "Kaydet ve Yayınla"}
      </button>
    </div>
  );
}
