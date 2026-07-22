"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Tierlerin başlangıç puanları — lib/tiers.ts içindeki baseline değerleri. */
const BASLANGIC = [
  { ad: "Monarch", puan: 89, renk: "#f3cf7e" },
  { ad: "M – S Arası", puan: 84, renk: "#d9c4fb" },
  { ad: "S-Rank", puan: 79, renk: "#c4b0fc" },
  { ad: "A-Rank", puan: 73, renk: "#8ad2f2" },
  { ad: "B-Rank", puan: 63, renk: "#7fd6c6" },
  { ad: "C-Rank", puan: 55, renk: "#a3d193" },
];

/**
 * Başlıktaki "Alwesh'ten Not" düğmesi ve açtığı pencere. Sıralamanın nasıl
 * oluştuğu konusunda topluluğa tek seferlik bir açıklama sunar.
 */
export default function AlweshNote() {
  const [acik, setAcik] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Pencere açıkken Esc kapatsın, arka plan kaymasın.
  useEffect(() => {
    if (!acik) return;
    const kapat = (e: KeyboardEvent) => e.key === "Escape" && setAcik(false);
    window.addEventListener("keydown", kapat);
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", kapat);
      document.body.style.overflow = eski;
    };
  }, [acik]);

  return (
    <>
      <button
        onClick={() => setAcik(true)}
        className="not-dugme inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-display text-sm font-bold"
        title="Topluluğa not — okumanız rica olunur"
      >
        <span className="not-nokta h-2 w-2 rounded-full bg-amber-900/70" />
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-70">
          Okuyun
        </span>
        <span className="text-base font-bold uppercase tracking-[0.06em]">
          Not
        </span>
      </button>

      {mounted &&
        acik &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-abyss/92 p-4 py-10"
            onClick={() => setAcik(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="glass-strong sys-window rise-in w-full max-w-2xl p-6 sm:p-8"
              style={{ boxShadow: "0 0 0 1px rgba(232,182,76,0.35), 0 24px 60px rgba(0,0,0,0.65)" }}
              role="dialog"
              aria-modal="true"
              aria-label="Alwesh'ten not"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="font-display text-[11px] font-bold uppercase tracking-[0.24em] text-choco/40">
                    Topluluğa Not
                  </div>
                  <h2
                    className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl"
                    style={{
                      color: "#f3cf7e",
                      textShadow: "0 0 18px rgba(232,182,76,0.45)",
                    }}
                  >
                    Alwesh&apos;ten
                  </h2>
                </div>
                <button
                  onClick={() => setAcik(false)}
                  className="shrink-0 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-lg leading-none text-choco/60 transition hover:bg-white/10 hover:text-choco"
                  aria-label="Kapat"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3.5 font-system text-[15px] leading-relaxed text-choco/80">
                <p className="font-bold text-choco">Arkadaşlar,</p>

                <p>
                  Puanlamayı ben yapmıyorum. Sitedeki ilk tier listesini,
                  tasarım aşamasında ortada boş bir sayfa durmasın diye bir
                  dakikada kendi aklıma göre hızlıca dizdim. O sıralama bir
                  taslaktan ibaretti.
                </p>

                <p>
                  Listeyi asıl şekillendirecek olan{" "}
                  <b className="text-choco">sizsiniz</b>. Puanları veren de
                  sizsiniz. Bu yüzden bana kırgın ya da sitemli gelmenize gerek
                  yok.
                </p>

                <p>
                  Bir oyun ve bir liste yüzünden kimsenin kalbini kırmayalım.
                  Kendini hak ettiğinden daha aşağıda görüyorsan ve diğer
                  oyuncular da böyle düşünüyorsa zaten yükseleceksin. Yine de
                  memnun değilsen, yetkililere bildirerek Aşk Köşesi&apos;ne
                  geçebilirsin — orada puanlama yoktur.
                </p>

                <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                  <b className="text-choco">Yetkililer:</b> Blacklean, Gracc,
                  Kaanexe, Alp ve bunların ileride yetkilendireceği isimler.
                </p>

                <p>
                  Siteye eklenecek daha çok isim var; sıralama henüz oturmuş
                  değil, zamanla yerine oturacak. Herkesi aynı anda memnun etmek
                  mümkün değil — zaten amaç da bu değil.
                </p>

                <p
                  className="rounded-xl border px-4 py-3 font-semibold"
                  style={{
                    borderColor: "rgba(232,182,76,0.35)",
                    background: "rgba(232,182,76,0.08)",
                    color: "#f3cf7e",
                  }}
                >
                  Bu site, geriye güzel bir anı kalsın diye yapıldı. Amacı da
                  bundan ibaret.
                </p>
              </div>

              {/* Puanlama nasıl işliyor */}
              <div className="mt-6 border-t border-white/8 pt-5">
                <div className="mb-3 font-display text-sm font-bold uppercase tracking-[0.14em] text-teal-deep">
                  Puanlama Nasıl İşliyor?
                </div>

                <ul className="space-y-2 font-system text-sm leading-relaxed text-choco/75">
                  <li className="flex gap-2">
                    <span className="text-teal-deep">•</span>
                    <span>
                      Oy verirken üç başlık puanlanır:{" "}
                      <b className="text-choco">Fare Oynayışı</b>,{" "}
                      <b className="text-choco">Şaman Oynayışı</b> ve{" "}
                      <b className="text-choco">WS &amp; Güven</b>. Ayrıca
                      hotkey kullanıp kullanmadığı sorulur.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-teal-deep">•</span>
                    <span>
                      Her fare, bulunduğu tier&apos;ın{" "}
                      <b className="text-choco">başlangıç puanıyla</b> listeye
                      girer. Gerçek oylar geldikçe bu puanın etkisi azalır ve
                      yerini topluluk ortalamasına bırakır.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-teal-deep">•</span>
                    <span>
                      Üst tier&apos;daki oyuncuların oyu biraz daha ağır basar
                      (Monarch 1.8 kat, C 1.0 kat).
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-teal-deep">•</span>
                    <span>
                      Oylar <b className="text-choco">yetkili onayından sonra</b>{" "}
                      ortalamaya işlenir. Onaylanan puan bir daha
                      değiştirilemez.
                    </span>
                  </li>
                </ul>

                <div className="mb-2 mt-5 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-choco/40">
                  Tierlerin Başlangıç Puanları
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {BASLANGIC.map((t) => (
                    <div
                      key={t.ad}
                      className="flex items-center justify-between rounded-lg border px-2.5 py-1.5"
                      style={{
                        borderColor: `${t.renk}44`,
                        background: `${t.renk}12`,
                      }}
                    >
                      <span
                        className="truncate font-display text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: t.renk }}
                      >
                        {t.ad}
                      </span>
                      <span className="ml-2 font-display text-sm font-bold text-choco tabular-nums">
                        {t.puan}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 font-system text-xs font-medium text-choco/45">
                  Aşk Köşesi&apos;nde puanlama yoktur; orada puan yerine kalp
                  gösterilir.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
                <span className="font-display text-sm font-bold text-choco/50">
                  — Alwesh
                </span>
                <button onClick={() => setAcik(false)} className="btn-primary text-sm">
                  Anladım
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
