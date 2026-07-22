"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * TFM Bülteni bandının görsel kısmı. Hem sitede hem panel önizlemesinde
 * aynı bileşen kullanılır ki ikisi asla ayrışmasın.
 *
 * Kayan şerit iki eş kopyadan oluşur ve kendi genişliğinin yarısı kadar
 * kayar; ikinci kopya birincinin yerine oturduğu için dönüş dikişsizdir.
 *
 * ÖNEMLİ: Notlar kısa olduğunda tek bir dizi bandı dolduramıyor, yazı
 * ortadan başlıyormuş gibi görünüyor ve arada boşluk kalıyordu. Bu yüzden
 * dizi, bandı taşıracak kadar TEKRARLANIR — yazı kesintisiz akar.
 */
export default function TickerBar({
  notlar,
  hiz,
}: {
  notlar: string[];
  /** 100 karakterlik yazı kaç saniyede geçsin. */
  hiz: number;
}) {
  const kapRef = useRef<HTMLDivElement>(null);
  const diziRef = useRef<HTMLSpanElement>(null);
  const [tekrar, setTekrar] = useState(2);

  const anahtar = notlar.join("|");

  const olc = useCallback(() => {
    const kap = kapRef.current?.offsetWidth ?? 0;
    const dizi = diziRef.current?.offsetWidth ?? 0;
    if (kap > 0 && dizi > 0) {
      // Bandı taşıracak kadar tekrar + 1 yedek: hiçbir anda boşluk kalmasın.
      setTekrar(Math.max(1, Math.ceil(kap / dizi) + 1));
    }
  }, []);

  useLayoutEffect(() => {
    olc();
  }, [olc, anahtar, tekrar]);

  useEffect(() => {
    window.addEventListener("resize", olc);
    return () => window.removeEventListener("resize", olc);
  }, [olc]);

  if (notlar.length === 0) return null;

  // Süre tekrar sayısıyla birlikte uzar; böylece kayma HIZI sabit kalır.
  const harf = notlar.join("").length * tekrar;
  const sure = Math.max(12, Math.round((harf / 100) * hiz));

  const kopya = (kopyaNo: number) => (
    <span key={kopyaNo} className="flex shrink-0 items-center">
      {Array.from({ length: tekrar }).map((_, i) => (
        <span
          key={i}
          ref={kopyaNo === 0 && i === 0 ? diziRef : undefined}
          className="flex shrink-0 items-center"
        >
          {notlar.map((not, j) => (
            <span key={j} className="flex shrink-0 items-center">
              <span className="px-6">{not}</span>
              <span aria-hidden className="text-white/40">
                ◆
              </span>
            </span>
          ))}
        </span>
      ))}
    </span>
  );

  return (
    <div className="sd-yuzey flex items-stretch overflow-hidden rounded-xl border border-red-300/25">
      {/* Sol plaka */}
      <div className="flex shrink-0 items-center py-2 pl-2.5 pr-3 sm:pl-3">
        <span className="sd-etiket flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-[0.14em] sm:text-xs">
          <span className="sd-nokta h-2 w-2 rounded-full bg-red-700" />
          TFM Bülteni
        </span>
      </div>

      {/* Kayan yazı */}
      <div ref={kapRef} className="sd-maske relative flex-1 overflow-hidden">
        <div
          className="sd-kay sd-metin py-2.5 font-system text-sm font-bold text-white sm:text-[15px]"
          style={{ animationDuration: `${sure}s` }}
        >
          {kopya(0)}
          {kopya(1)}
        </div>
      </div>
    </div>
  );
}
