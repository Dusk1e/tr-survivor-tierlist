"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getMice, pairMice, unpairMouse } from "@/lib/api";
import { formatName } from "@/lib/format";
import { tierOf } from "@/lib/tiers";
import { Mouse } from "@/lib/types";

/**
 * Aşk Köşesi yönetimi — iki fareyi çift yapar. Bağ karşılıklıdır:
 * iki kayıt da birbirini gösterir, biri ayrılınca ikisi de serbest kalır.
 */
export default function AdminCouples({
  onToast,
}: {
  onToast: (msg: string, kind?: "ok" | "err") => void;
}) {
  const [mice, setMice] = useState<Mouse[]>([]);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  // Varsayılan KAPALI: eşleştirme kimseyi rankından çıkarmaz.
  const [tasi, setTasi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      setMice(await getMice());
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Liste yüklenemedi");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sirali = useMemo(
    () =>
      [...mice].sort((x, y) =>
        x.nickname.localeCompare(y.nickname, "tr")
      ),
    [mice]
  );

  /** Mevcut çiftler — her çift bir kez listelenir. */
  const ciftler = useMemo(() => {
    const byId = new Map(mice.map((m) => [m.id, m]));
    const alindi = new Set<string>();
    const out: { a: Mouse; b: Mouse }[] = [];
    for (const m of mice) {
      if (alindi.has(m.id) || !m.partner_id) continue;
      const es = byId.get(m.partner_id);
      if (!es || alindi.has(es.id)) continue;
      alindi.add(m.id);
      alindi.add(es.id);
      out.push({ a: m, b: es });
    }
    return out;
  }, [mice]);

  async function calistir(op: () => Promise<void>, basarili: string) {
    setBusy(true);
    setErr(null);
    try {
      await op();
      onToast(basarili);
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "İşlem başarısız");
    } finally {
      setBusy(false);
    }
  }

  function birlestir(e: React.FormEvent) {
    e.preventDefault();
    if (!a || !b) return setErr("İki fare de seçilmeli");
    if (a === b) return setErr("Bir fare kendisiyle eşleştirilemez");
    const an = mice.find((m) => m.id === a)?.nickname ?? "";
    const bn = mice.find((m) => m.id === b)?.nickname ?? "";
    calistir(() => pairMice(a, b, tasi), `${an} & ${bn} artık bir çift.`).then(
      () => {
        setA("");
        setB("");
      }
    );
  }

  return (
    <div className="glass-strong sys-window p-5 sm:p-6">
      <div className="mb-1 font-display text-base font-bold uppercase tracking-[0.12em] text-pink-300">
        Aşk Köşesi
      </div>
      <p className="mb-4 text-xs font-medium text-choco/50">
        Seçtiğin iki fare tierlist'te yan yana, aralarında bir kalple görünür.
        Bağ karşılıklıdır; biri ayrılınca ikisi de serbest kalır.
      </p>

      <form onSubmit={birlestir} className="mb-4 flex flex-wrap items-end gap-2">
        <FareSecici label="Birinci" value={a} onChange={setA} mice={sirali} disabled={busy} />
        <span className="pb-2.5 text-lg font-bold text-pink-300">&amp;</span>
        <FareSecici label="İkinci" value={b} onChange={setB} mice={sirali} disabled={busy} />
        <button
          type="submit"
          disabled={busy || !a || !b}
          className="btn-primary shrink-0 disabled:opacity-50"
        >
          {busy ? "…" : "Birleştir"}
        </button>
      </form>

      <label className="mb-4 flex cursor-pointer items-center gap-2 text-xs font-semibold text-choco/60">
        <input
          type="checkbox"
          checked={tasi}
          onChange={(e) => setTasi(e.target.checked)}
          className="h-4 w-4 accent-pink-400"
        />
        İkisini de Aşk Köşesi bandına taşı
        <span className="text-choco/35">
          (dikkat: rank&apos;larından çıkarılırlar ve puanları görünmez olur)
        </span>
      </label>

      {err && (
        <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
          {err}
        </p>
      )}

      <div className="mb-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-choco/40">
        Mevcut Çiftler
      </div>

      {!loaded ? (
        <p className="text-sm font-medium italic text-choco/35">Yükleniyor…</p>
      ) : ciftler.length === 0 ? (
        <p className="text-sm font-medium italic text-choco/35">
          Henüz çift yok.
        </p>
      ) : (
        <div className="space-y-2">
          {ciftler.map(({ a: x, b: y }) => (
            <div
              key={x.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2"
              style={{
                borderColor: "rgba(244,114,182,0.35)",
                background: "linear-gradient(135deg, rgba(244,114,182,0.12), transparent)",
              }}
            >
              <span className="font-system text-sm font-bold text-choco">
                {formatName(x.nickname)}
                <span className="mx-2 text-pink-300">&amp;</span>
                {formatName(y.nickname)}
                <span className="ml-2 font-display text-[10px] font-bold uppercase tracking-wider text-choco/35">
                  {tierOf(x.tier).label}
                </span>
              </span>
              <button
                disabled={busy}
                onClick={() =>
                  calistir(
                    () => unpairMouse(x.id),
                    `${x.nickname} & ${y.nickname} ayrıldı.`
                  )
                }
                className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
              >
                Ayır
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FareSecici({
  label,
  value,
  onChange,
  mice,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mice: Mouse[];
  disabled: boolean;
}) {
  return (
    <div className="min-w-[160px] flex-1">
      <label className="label">{label}</label>
      <select
        className="field"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Fare seç…</option>
        {mice.map((m) => (
          <option key={m.id} value={m.id}>
            {formatName(m.nickname)}
            {m.partner_id ? " (eşli)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
