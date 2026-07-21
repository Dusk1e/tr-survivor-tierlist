"use client";

import { isCloud } from "@/lib/api";

/**
 * Little "System Online" / "Local Mode" indicator so it's clear whether the
 * app is talking to a shared cloud database or the local browser store.
 */
export default function ModeBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 font-display text-[9px] font-extrabold uppercase tracking-[0.15em]"
      style={{
        borderColor: isCloud ? "rgba(73,192,194,0.4)" : "rgba(215,164,65,0.4)",
        color: isCloud ? "#74d3d5" : "#ecc673",
        background: isCloud ? "rgba(73,192,194,0.12)" : "rgba(215,164,65,0.12)",
      }}
      title={
        isCloud
          ? "Ortak Supabase veritabanına bağlı"
          : "Veriler bu tarayıcıda saklanıyor (Local Mode)"
      }
    >
      <span
        className="h-1.5 w-1.5 animate-pulse-glow rounded-full"
        style={{ background: isCloud ? "#35b7c6" : "#f5c542" }}
      />
      {isCloud ? "System Online" : "Local Mode"}
    </span>
  );
}
