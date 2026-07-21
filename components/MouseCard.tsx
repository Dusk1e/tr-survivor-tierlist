"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Mouse } from "@/lib/types";
import { tierOf } from "@/lib/tiers";
import { formatName } from "@/lib/format";
import MouseAvatar from "./MouseAvatar";
import SystemWindow from "./SystemWindow";
import ScoreRing from "./ScoreRing";
import { useSession } from "./SessionProvider";

/**
 * Tier bandındaki oyuncu kartı. Performans için animasyon kütüphanesi
 * kullanılmaz — hover/tap efektleri saf CSS transform'dur (compositor'da
 * çalışır, 32+ kartta bile kasmaz).
 *  - Hover: hızlı istatistik balonu (body'ye portal edilir)
 *  - Tıklama: detay + puanlama penceresi
 */
export default function MouseCard({ mouse }: { mouse: Mouse }) {
  const tier = tierOf(mouse.tier);
  const isLove = tier.shape === "heart";
  const { isMe, aggFor, openDetail } = useSession();
  const mine = isMe(mouse.id);
  const agg = aggFor(mouse.id);

  const [peek, setPeek] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number; below: boolean } | null>(
    null
  );
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  function place() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const half = 138;
    const x = Math.min(
      Math.max(r.left + r.width / 2, half + 8),
      window.innerWidth - half - 8
    );
    setPos({ x, y: r.top < 340 ? r.bottom : r.top, below: r.top < 340 });
  }
  const show = () => {
    place();
    setPeek(true);
  };
  const hide = () => setPeek(false);

  useEffect(() => {
    if (!peek) return;
    const close = () => setPeek(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [peek]);

  const cardBg =
    tier.kind === "between"
      ? `linear-gradient(135deg, ${tier.accent}1f 0%, ${tier.accent2}1f 100%)`
      : `linear-gradient(180deg, ${tier.accent}1c, ${tier.accent}08)`;

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => openDetail(mouse)}
        onFocus={show}
        onBlur={hide}
        className="card-hover group relative flex w-[108px] flex-col items-center gap-1.5 rounded-xl border p-2.5 pb-3 outline-none focus-visible:ring-2 sm:w-[118px]"
        style={{
          ["--tw-ring-color" as any]: tier.accent,
          background: cardBg,
          borderColor: mine ? "#4ade8055" : `${tier.accent}2e`,
        }}
        aria-label={`${formatName(mouse.nickname)} — ${tier.label}`}
      >
        <div className="relative">
          <div
            className="h-[70px] w-[70px] overflow-hidden rounded-lg border sm:h-[76px] sm:w-[76px]"
            style={{
              borderColor: mine ? "#4ade8099" : `${tier.accent}66`,
              background: `${tier.accent}12`,
            }}
          >
            <MouseAvatar
              src={mouse.image_url}
              alt={mouse.nickname}
              accent={tier.accent}
            />
            {mine && (
              <span className="absolute left-1 top-1 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-[#151b24]" />
            )}
          </div>
          {/* Aşk Köşesi'nde puan yoktur — puanın yerini kalp alır. */}
          <div className="absolute -bottom-2 -right-3">
            {isLove ? (
              <HeartBadge accent={tier.accent} />
            ) : (
              <ScoreRing
                value={agg ? agg.overall : null}
                count={agg?.count}
                size={38}
                stroke={4}
              />
            )}
          </div>
        </div>

        <span className="mt-1 max-w-full truncate font-system text-[13px] font-bold text-choco">
          {formatName(mouse.nickname)}
        </span>

        {mine && (
          <span className="rounded-full bg-green-500/12 px-2 py-0.5 font-display text-[8px] font-bold uppercase tracking-[0.1em] text-green-300">
            Giriş Yapıldı
          </span>
        )}
      </button>

      {mounted &&
        peek &&
        pos &&
        createPortal(
          <div
            className="rise-in pointer-events-none fixed z-[60]"
            style={{
              left: pos.x,
              top: pos.y,
              transform: pos.below
                ? "translate(-50%, 12px)"
                : "translate(-50%, calc(-100% - 12px))",
            }}
          >
            <SystemWindow mouse={mouse} agg={agg} />
          </div>,
          document.body
        )}
    </div>
  );
}

/** Aşk Köşesi rozeti — puan halkasının yerine geçen pembe kalp. */
function HeartBadge({ accent }: { accent: string }) {
  return (
    <span
      className="flex h-[38px] w-[38px] items-center justify-center rounded-full border-2"
      style={{
        borderColor: `${accent}88`,
        background: "#151b24",
        boxShadow: `0 0 12px ${accent}55`,
      }}
      aria-label="Aşk Köşesi"
    >
      <svg viewBox="0 0 100 100" width={19} height={19}>
        <path
          d="M50,89 C50,89 9,61 9,36 C9,20 21,10 33,10 C41,10 47,15 50,21 C53,15 59,10 67,10 C79,10 91,20 91,36 C91,61 50,89 50,89 Z"
          fill={accent}
        />
      </svg>
    </span>
  );
}
