"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getMice, pairMice, unpairMouse } from "@/lib/api";
import { formatName } from "@/lib/format";
import { tierOf } from "@/lib/tiers";
import { Mouse } from "@/lib/types";
import MouseAvatar from "./MouseAvatar";

const PEMBE = "#f472b6";

/**
 * Aşk Köşesi yönetimi. Asıl kullanım SÜRÜKLE-BIRAK: bir fareyi tutup
 * diğerinin üstüne bırakınca çift olurlar. Bağ karşılıklıdır — iki kayıt
 * da birbirini gösterir, biri ayrılınca ikisi de serbest kalır.
 */
export default function AdminCouples({
  onToast,
}: {
  onToast: (msg: string, kind?: "ok" | "err") => void;
}) {
  const [mice, setMice] = useState<Mouse[]>([]);
  const [q, setQ] = useState("");
  // Varsayılan KAPALI: eşleştirme kimseyi rankından çıkarmaz.
  const [tasi, setTasi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  /** Sürüklenen farenin id'si ve üstünde durulan hedef. */
  const [suruklenen, setSuruklenen] = useState<string | null>(null);
  const [hedef, setHedef] = useState<string | null>(null);

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

  const byId = useMemo(() => new Map(mice.map((m) => [m.id, m])), [mice]);

  const listelenecek = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr");
    return [...mice]
      .filter((m) =>
        needle ? m.nickname.toLocaleLowerCase("tr").includes(needle) : true
      )
      .sort((x, y) => x.nickname.localeCompare(y.nickname, "tr"));
  }, [mice, q]);

  /** Mevcut çiftler — her çift bir kez listelenir. */
  const ciftler = useMemo(() => {
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
  }, [mice, byId]);

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

  function birlestir(kaynakId: string, hedefId: string) {
    if (!kaynakId || !hedefId || kaynakId === hedefId) return;
    const an = byId.get(kaynakId)?.nickname ?? "";
    const bn = byId.get(hedefId)?.nickname ?? "";
    calistir(
      () => pairMice(kaynakId, hedefId, tasi),
      `${an} & ${bn} artık bir çift.`
    );
  }

  return (
    <div className="glass-strong sys-window p-5 sm:p-6">
      <div className="mb-1 font-display text-base font-bold uppercase tracking-[0.12em] text-pink-300">
        Aşk Köşesi
      </div>
      <p className="mb-4 text-xs font-medium text-choco/50">
        Bir fareyi tutup <b className="text-pink-300">diğerinin üstüne bırak</b>
        {" "}— ikisi çift olur ve tierlist&apos;te aralarında bir kalple yan yana
        görünürler. Bağ karşılıklıdır; biri ayrılınca ikisi de serbest kalır.
      </p>

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

      {/* ---------------------------- çiftler ---------------------------- */}
      <div className="mb-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-choco/40">
        Mevcut Çiftler
      </div>

      {!loaded ? (
        <p className="mb-5 text-sm font-medium italic text-choco/35">
          Yükleniyor…
        </p>
      ) : ciftler.length === 0 ? (
        <p className="mb-5 text-sm font-medium italic text-choco/35">
          Henüz çift yok — aşağıdan bir fareyi diğerinin üstüne sürükle.
        </p>
      ) : (
        <div className="mb-5 space-y-2">
          {ciftler.map(({ a: x, b: y }) => (
            <div
              key={x.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2"
              style={{
                borderColor: `${PEMBE}59`,
                background: `linear-gradient(135deg, ${PEMBE}1f, transparent)`,
              }}
            >
              <span className="flex items-center gap-2 font-system text-sm font-bold text-choco">
                {formatName(x.nickname)}
                <Kalp size={15} />
                {formatName(y.nickname)}
                <span className="ml-1 font-display text-[10px] font-bold uppercase tracking-wider text-choco/35">
                  {tierOf(x.tier).label} · {tierOf(y.tier).label}
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

      {/* ------------------------ sürüklenebilir kadro ------------------- */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-choco/40">
          Fareler — sürükleyip birleştir
        </span>
        <input
          className="field !w-44 py-1.5 text-sm"
          placeholder="Nick ara"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {listelenecek.map((m) => {
          const esli = Boolean(m.partner_id);
          const es = m.partner_id ? byId.get(m.partner_id) : undefined;
          const suruklenenBu = suruklenen === m.id;
          const hedefBu = hedef === m.id && suruklenen !== null && !suruklenenBu;

          return (
            <div
              key={m.id}
              draggable={!busy}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", m.id);
                e.dataTransfer.effectAllowed = "link";
                setSuruklenen(m.id);
              }}
              onDragEnd={() => {
                setSuruklenen(null);
                setHedef(null);
              }}
              onDragOver={(e) => {
                if (suruklenen && suruklenen !== m.id) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "link";
                }
              }}
              onDragEnter={() => {
                if (suruklenen && suruklenen !== m.id) setHedef(m.id);
              }}
              onDragLeave={() =>
                setHedef((h) => (h === m.id ? null : h))
              }
              onDrop={(e) => {
                e.preventDefault();
                const kaynak = e.dataTransfer.getData("text/plain") || suruklenen;
                setHedef(null);
                setSuruklenen(null);
                if (kaynak) birlestir(kaynak, m.id);
              }}
              title={
                esli && es
                  ? `${formatName(m.nickname)} — eşi: ${formatName(es.nickname)}`
                  : `${formatName(m.nickname)} — birleştirmek için başka bir farenin üstüne sürükle`
              }
              className="relative flex w-[96px] cursor-grab flex-col items-center gap-1 rounded-xl border p-2 transition-all active:cursor-grabbing"
              style={{
                borderColor: hedefBu
                  ? PEMBE
                  : esli
                  ? `${PEMBE}66`
                  : "rgba(255,255,255,0.1)",
                background: hedefBu
                  ? `${PEMBE}2e`
                  : esli
                  ? `${PEMBE}14`
                  : "rgba(255,255,255,0.04)",
                boxShadow: hedefBu ? `0 0 0 2px ${PEMBE}, 0 0 18px ${PEMBE}66` : "none",
                opacity: suruklenenBu ? 0.4 : 1,
              }}
            >
              <div
                className="h-[52px] w-[52px] overflow-hidden rounded-lg border"
                style={{ borderColor: esli ? `${PEMBE}88` : "rgba(255,255,255,0.12)" }}
              >
                <MouseAvatar
                  src={m.image_url}
                  alt={m.nickname}
                  accent={esli ? PEMBE : "#8b95a3"}
                />
              </div>

              <span className="max-w-full truncate font-system text-[11px] font-bold text-choco">
                {formatName(m.nickname)}
              </span>

              {esli && es ? (
                <span className="flex max-w-full items-center gap-1 truncate font-system text-[9px] font-bold text-pink-300">
                  <Kalp size={9} />
                  {formatName(es.nickname)}
                </span>
              ) : (
                <span className="font-display text-[9px] font-bold uppercase tracking-wider text-choco/30">
                  {/* Aşk Köşesi'nin harf rozeti yok — orada boş bırakılır. */}
                  {tierOf(m.tier).sigil || "—"}
                </span>
              )}

              {hedefBu && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl">
                  <Kalp size={30} />
                </span>
              )}
            </div>
          );
        })}
      </div>

      {listelenecek.length === 0 && loaded && (
        <p className="text-sm font-medium italic text-choco/35">
          Aramaya uyan fare yok.
        </p>
      )}
    </div>
  );
}

function Kalp({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="shrink-0">
      <path
        d="M50,89 C50,89 9,61 9,36 C9,20 21,10 33,10 C41,10 47,15 50,21 C53,15 59,10 67,10 C79,10 91,20 91,36 C91,61 50,89 50,89 Z"
        fill={PEMBE}
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="4"
      />
    </svg>
  );
}
