"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuthorities, pingDataChanged, saveAuthorities } from "@/lib/api";
import { formatName } from "@/lib/format";

/** Site altındaki "Yetkililer" isim listesinin yönetimi. */
export default function AdminAuthorities() {
  const [list, setList] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      setList(await getAuthorities());
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

  /** Kaydet → sunucudan taze listeyi çek → gerçekten işlendiğini doğrula. */
  async function persist(next: string[]) {
    setBusy(true);
    setErr(null);
    const previous = list;
    setList(next); // anında geri bildirim
    try {
      await saveAuthorities(next);
      const fresh = await getAuthorities();
      setList(fresh);
      pingDataChanged(); // footer anında güncellensin
    } catch (e: any) {
      setList(previous); // başarısızsa geri al
      setErr(e?.message ?? "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const dup = list.find(
      (x) => x.trim().toLocaleLowerCase("tr") === n.toLocaleLowerCase("tr")
    );
    if (dup) {
      setErr(`"${dup}" zaten listede — aynı isim iki kez eklenemez.`);
      return; // input'u TEMIZLEME, kullanici ne yazdigini gorsun
    }
    persist([...list, n]);
    setName("");
  }

  /** Silme — bosluk/buyuk-kucuk harf farkina takilmadan dogru satiri atar. */
  function remove(target: string) {
    const key = target.trim().toLocaleLowerCase("tr");
    persist(list.filter((x) => x.trim().toLocaleLowerCase("tr") !== key));
  }

  return (
    <div className="glass-strong sys-window p-5 sm:p-6">
      <div className="mb-3 font-display text-base font-bold uppercase tracking-[0.12em] text-teal-deep">
        Yetkililer (Site Altı Liste)
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-choco/50">
          Bu isimler sitenin en altında görünür. Panel yetkileri buradan değil,
          "Yetkiler" sekmesinden verilir.
        </p>
        <button
          type="button"
          onClick={load}
          disabled={busy}
          className="btn-ghost shrink-0 px-3 py-1.5 text-xs disabled:opacity-40"
          title="Sunucudaki gerçek listeyi tekrar oku"
        >
          Sunucudan Yenile
        </button>
      </div>

      <form onSubmit={add} className="mb-4 flex gap-2">
        <input
          className="field"
          value={name}
          maxLength={30}
          disabled={busy}
          onChange={(e) => setName(e.target.value)}
          placeholder="İsim ekle…"
        />
        <button type="submit" disabled={busy || !name.trim()} className="btn-primary shrink-0 disabled:opacity-50">
          {busy ? "…" : "Ekle"}
        </button>
      </form>

      {err && (
        <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
          {err}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {!loaded ? (
          <span className="text-sm font-medium italic text-choco/35">
            Yükleniyor…
          </span>
        ) : list.length === 0 ? (
          <span className="text-sm font-medium italic text-choco/35">
            Henüz yetkili eklenmemiş.
          </span>
        ) : (
          list.map((n) => (
            <span
              key={n}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] py-1 pl-3 pr-1.5 font-system text-sm font-semibold text-choco/85"
            >
              {formatName(n)}
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(n)}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-choco/70 transition hover:bg-red-500/70 hover:text-white disabled:opacity-40"
                aria-label={`${n} kaldır`}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
