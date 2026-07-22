"use client";

import { useCallback, useEffect, useState } from "react";
import { getTicker, saveTicker } from "@/lib/api";
import { TickerConfig, TICKER_VARSAYILAN } from "@/lib/types";

/**
 * TFM Bülteni bandı yönetimi. Notlar tek tek eklenir, bantta sırayla geçer
 * ve sonuncudan sonra başa döner. Silinen not döngüden çıkar.
 */
export default function AdminTicker({
  onToast,
}: {
  onToast: (msg: string, kind?: "ok" | "err") => void;
}) {
  const [cfg, setCfg] = useState<TickerConfig>(TICKER_VARSAYILAN);
  const [yeni, setYeni] = useState("");
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

  /** Her değişiklik anında kaydedilir — ayrıca "kaydet" demeye gerek yok. */
  async function yaz(sonraki: TickerConfig, mesaj: string) {
    setBusy(true);
    setErr(null);
    const oncesi = cfg;
    setCfg(sonraki); // anında geri bildirim
    try {
      setCfg(await saveTicker(sonraki));
      onToast(mesaj);
    } catch (e: any) {
      setCfg(oncesi); // başarısızsa geri al
      setErr(e?.message ?? "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  function ekle(e: React.FormEvent) {
    e.preventDefault();
    const n = yeni.trim();
    if (!n) return;
    if (cfg.notlar.length >= 20) {
      setErr("En fazla 20 not eklenebilir.");
      return;
    }
    if (
      cfg.notlar.some(
        (x) => x.trim().toLocaleLowerCase("tr") === n.toLocaleLowerCase("tr")
      )
    ) {
      setErr("Bu not zaten listede.");
      return;
    }
    setYeni("");
    yaz({ ...cfg, notlar: [...cfg.notlar, n] }, "Not eklendi, bantta dönüyor.");
  }

  function sil(i: number) {
    const n = cfg.notlar[i];
    yaz(
      { ...cfg, notlar: cfg.notlar.filter((_, j) => j !== i) },
      `"${n.slice(0, 24)}${n.length > 24 ? "…" : ""}" bandan kaldırıldı.`
    );
  }

  function tasi(i: number, yon: -1 | 1) {
    const j = i + yon;
    if (j < 0 || j >= cfg.notlar.length) return;
    const liste = [...cfg.notlar];
    [liste[i], liste[j]] = [liste[j], liste[i]];
    yaz({ ...cfg, notlar: liste }, "Sıra değişti.");
  }

  const notlar = cfg.notlar.filter((n) => n.trim());
  const toplamUzunluk = notlar.join("").length;
  const sure = Math.max(12, Math.round((toplamUzunluk / 100) * cfg.hiz));

  return (
    <div className="glass-strong sys-window p-5 sm:p-6">
      <div className="mb-1 font-display text-base font-bold uppercase tracking-[0.12em] text-teal-deep">
        TFM Bülteni
      </div>
      <p className="mb-4 text-xs font-medium text-choco/50">
        Eklediğin notlar bantta <b>sırayla</b> geçer, sonuncudan sonra başa
        döner. Sildiğin not döngüden çıkar. Değişiklikler anında yayına girer.
      </p>

      {err && (
        <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
          {err}
        </p>
      )}

      <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm font-bold text-choco">
        <input
          type="checkbox"
          checked={cfg.aktif}
          disabled={busy || !loaded}
          onChange={(e) =>
            yaz(
              { ...cfg, aktif: e.target.checked },
              e.target.checked ? "Bant yayında." : "Bant kapatıldı."
            )
          }
          className="h-4 w-4 accent-cyan-400"
        />
        Bandı yayına al
      </label>

      {/* Not ekleme */}
      <form onSubmit={ekle} className="mb-4 flex gap-2">
        <input
          className="field"
          maxLength={300}
          disabled={busy || !loaded}
          value={yeni}
          onChange={(e) => {
            setYeni(e.target.value);
            setErr(null);
          }}
          placeholder="Yeni not yaz… (örn: 3. sezon kayıtları açıldı)"
        />
        <button
          type="submit"
          disabled={busy || !loaded || !yeni.trim()}
          className="btn-primary shrink-0 disabled:opacity-50"
        >
          {busy ? "…" : "Ekle"}
        </button>
      </form>

      {/* Not listesi */}
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-choco/40">
          Bandaki Notlar
        </span>
        <span className="font-system text-[11px] font-medium text-choco/35 tabular-nums">
          {notlar.length} / 20 · bir tur {sure} sn
        </span>
      </div>

      {!loaded ? (
        <p className="mb-5 text-sm font-medium italic text-choco/35">
          Yükleniyor…
        </p>
      ) : notlar.length === 0 ? (
        <p className="mb-5 text-sm font-medium italic text-choco/35">
          Henüz not yok — yukarıdan ekle.
        </p>
      ) : (
        <div className="mb-5 space-y-2">
          {cfg.notlar.map((not, i) => (
            <div
              key={`${i}-${not}`}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal/20 font-display text-[11px] font-bold text-teal-deep tabular-nums">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-system text-sm font-semibold text-choco/85">
                {not}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => tasi(i, -1)}
                  disabled={busy || i === 0}
                  title="Yukarı"
                  className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-xs text-choco/60 transition hover:bg-white/10 disabled:opacity-25"
                >
                  ↑
                </button>
                <button
                  onClick={() => tasi(i, 1)}
                  disabled={busy || i === cfg.notlar.length - 1}
                  title="Aşağı"
                  className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-xs text-choco/60 transition hover:bg-white/10 disabled:opacity-25"
                >
                  ↓
                </button>
                <button
                  onClick={() => sil(i)}
                  disabled={busy}
                  title="Sil"
                  className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 font-display text-[10px] font-bold uppercase text-choco/55 transition hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-300 disabled:opacity-40"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hız */}
      <label className="label" htmlFor="sd-hiz">
        Kayma hızı — 100 karakter {cfg.hiz} saniyede geçer
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
        onMouseUp={() => yaz(cfg, "Hız güncellendi.")}
        onTouchEnd={() => yaz(cfg, "Hız güncellendi.")}
        className="w-full accent-cyan-400"
      />
      <div className="mb-4 flex justify-between font-system text-[11px] font-medium text-choco/35">
        <span>Hızlı</span>
        <span>Yavaş</span>
      </div>

      {/* Önizleme */}
      <div className="label">Önizleme</div>
      {notlar.length > 0 ? (
        <div className="sd-sahne mt-1">
          <div className="sd-yuzey flex items-stretch overflow-hidden rounded-xl border border-teal/25">
            <div className="flex shrink-0 items-center py-2 pl-2.5 pr-3">
              <span className="sd-etiket flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-[0.14em]">
                <span className="sd-nokta h-2 w-2 rounded-full bg-teal-950" />
                TFM Bülteni
              </span>
            </div>
            <div className="sd-maske relative flex-1 overflow-hidden">
              <div className="sd-kay py-2.5" style={{ animationDuration: `${sure}s` }}>
                {[0, 1].map((k) => (
                  <span
                    key={k}
                    className="sd-metin flex shrink-0 items-center font-system text-sm font-bold text-white"
                  >
                    {notlar.map((not, i) => (
                      <span key={i} className="flex shrink-0 items-center">
                        <span className="px-6">{not}</span>
                        <span className="text-white/40">◆</span>
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-sm font-medium italic text-choco/35">
          Not ekleyince önizleme burada görünür.
        </p>
      )}
    </div>
  );
}
