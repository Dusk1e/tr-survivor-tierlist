"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Mouse } from "@/lib/types";
import { tierOf } from "@/lib/tiers";
import { formatName } from "@/lib/format";
import MouseAvatar from "./MouseAvatar";
import SystemWindow from "./SystemWindow";
import ScoreRing from "./ScoreRing";
import { useSession } from "./SessionProvider";

/**
 * A player card inside a tier band.
 *  - Background is tinted by the slot's color (between-slots blend the two).
 *  - The colored ring shows the overall % (red corner badge = voter count).
 *  - Hover: quick stats peek. Click: full detail + voting modal.
 */
export default function MouseCard({ mouse }: { mouse: Mouse }) {
  const tier = tierOf(mouse.tier);
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
    const below = r.top < 340;
    setPos({ x, y: below ? r.bottom : r.top, below });
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
      ? `linear-gradient(135deg, ${tier.accent}26 0%, ${tier.accent2}26 100%)`
      : `linear-gradient(180deg, ${tier.accent}24, ${tier.accent}0a)`;

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <motion.button
        ref={btnRef}
        type="button"
        onClick={() => openDetail(mouse)}
        onFocus={show}
        onBlur={hide}
        whileHover={{ y: -5, scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="group relative flex w-[112px] flex-col items-center gap-1.5 overflow-visible rounded-2xl border p-2.5 pb-3 outline-none focus-visible:ring-2 sm:w-[124px]"
        style={{
          ["--tw-ring-color" as any]: tier.accent,
          background: cardBg,
          borderColor: mine ? "#4ade8077" : `${tier.accent}38`,
          boxShadow: mine
            ? "0 0 0 1px #4ade8055, 0 10px 24px rgba(0,0,0,0.4)"
            : "0 10px 24px rgba(0,0,0,0.35)",
        }}
        aria-label={`${formatName(mouse.nickname)} — ${tier.label}`}
      >
        <div className="relative">
          <div
            className="relative h-[72px] w-[72px] overflow-hidden rounded-xl border transition-all duration-300 sm:h-[80px] sm:w-[80px]"
            style={{
              borderColor: mine ? "#4ade80aa" : `${tier.accent}77`,
              background: `${tier.accent}14`,
            }}
          >
            <MouseAvatar
              src={mouse.image_url}
              alt={mouse.nickname}
              accent={tier.accent}
            />
            {mine && (
              <span className="absolute left-1 top-1 h-2.5 w-2.5 animate-pulse-glow rounded-full bg-green-500 ring-2 ring-white" />
            )}
          </div>
          {/* overall score ring overlapping the avatar corner */}
          <div className="absolute -bottom-2 -right-3">
            <ScoreRing
              value={agg ? agg.overall : null}
              count={agg?.count}
              size={40}
              stroke={4}
            />
          </div>
        </div>

        <span className="mt-1 max-w-full truncate font-system text-[13px] font-bold text-choco">
          {formatName(mouse.nickname)}
        </span>

        {mine ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 font-display text-[8px] font-bold uppercase tracking-[0.12em] text-green-300 ring-1 ring-green-500/40">
            <span className="h-1 w-1 rounded-full bg-green-400" />
            Giriş Yapıldı
          </span>
        ) : agg ? null : (
          <span className="font-display text-[8px] font-bold uppercase tracking-[0.14em] text-choco/30">
            Henüz Oy Yok
          </span>
        )}
      </motion.button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {peek && pos && (
              <div
                className="pointer-events-none fixed z-[60]"
                style={{
                  left: pos.x,
                  top: pos.y,
                  transform: pos.below
                    ? "translate(-50%, 12px)"
                    : "translate(-50%, calc(-100% - 12px))",
                }}
              >
                <SystemWindow mouse={mouse} agg={agg} />
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
