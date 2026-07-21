"use client";

import { useState } from "react";
import { DIMS, HOTKEY_QUESTION, defaultScores, zoneOf } from "@/lib/dims";
import { Scores } from "@/lib/types";

/**
 * Puanlama formu: üç 0-100 slider (canlı bölge geri bildirimiyle) + Hotkey
 * Evet/Hayır sorusu. Gönderim onay kuyruğuna düşer.
 */
export default function VoteSliders({
  initialScores,
  initialHotkey,
  busy,
  submitLabel = "Puanlamayı Gönder",
  onSubmit,
}: {
  initialScores?: Scores;
  initialHotkey?: boolean;
  busy?: boolean;
  submitLabel?: string;
  onSubmit: (scores: Scores, hotkey: boolean) => void;
}) {
  const [scores, setScores] = useState<Scores>(
    initialScores ?? defaultScores()
  );
  const [hotkey, setHotkey] = useState<boolean | null>(
    initialHotkey === undefined ? null : initialHotkey
  );

  function setDim(id: keyof Scores, v: number) {
    setScores((s) => ({ ...s, [id]: v }));
  }

  const canSubmit = hotkey !== null && !busy;

  return (
    <div className="space-y-4">
      {DIMS.map((d) => {
        const v = scores[d.id];
        const zone = zoneOf(v);
        return (
          <div key={d.id}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="font-system text-sm font-semibold text-choco/85">
                {d.label}
              </span>
              <span
                className="shrink-0 rounded-lg px-2 py-0.5 font-display text-xs font-bold tabular-nums"
                style={{
                  color: zone.color,
                  background: `${zone.color}1c`,
                  border: `1px solid ${zone.color}55`,
                }}
              >
                %{v} · {zone.label}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={v}
              disabled={busy}
              onChange={(e) => setDim(d.id, Number(e.target.value))}
              className="score-slider"
              style={
                {
                  "--thumb": zone.color,
                  background: `linear-gradient(90deg, ${zone.color}cc 0%, ${zone.color} ${v}%, rgba(255,255,255,0.08) ${v}%)`,
                } as React.CSSProperties
              }
              aria-label={`${d.label} puanı`}
            />
            <div className="mt-0.5 flex justify-between font-system text-[9px] font-semibold uppercase tracking-wider text-choco/30">
              <span>Çok Kötü</span>
              <span>Orta</span>
              <span>Çok İyi</span>
            </div>
          </div>
        );
      })}

      {/* Hotkey — Evet / Hayır */}
      <div
        className="rounded-xl border p-3"
        style={{
          borderColor: "rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div className="mb-2 font-system text-sm font-semibold text-choco/85">
          {HOTKEY_QUESTION}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setHotkey(true)}
            className="rounded-xl py-2 font-system text-sm font-bold transition-all"
            style={{
              background: hotkey === true ? "rgba(229,100,107,0.24)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${hotkey === true ? "#e5646b" : "rgba(255,255,255,0.1)"}`,
              color: hotkey === true ? "#f1979c" : "#9aa6b4",
              boxShadow: hotkey === true ? "0 0 14px rgba(229,100,107,0.28)" : "none",
            }}
          >
            Evet
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setHotkey(false)}
            className="rounded-xl py-2 font-system text-sm font-bold transition-all"
            style={{
              background: hotkey === false ? "rgba(79,179,224,0.22)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${hotkey === false ? "#4fb3e0" : "rgba(255,255,255,0.1)"}`,
              color: hotkey === false ? "#8ad2f2" : "#9aa6b4",
              boxShadow: hotkey === false ? "0 0 14px rgba(79,179,224,0.25)" : "none",
            }}
          >
            Hayır
          </button>
        </div>
        {hotkey === null && (
          <p className="mt-1.5 text-center text-[11px] font-semibold text-choco/40">
            Göndermeden önce Evet ya da Hayır seçmelisin.
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => hotkey !== null && onSubmit(scores, hotkey)}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Gönderiliyor…" : submitLabel}
      </button>

      <ul className="space-y-1 rounded-xl border border-white/8 bg-white/[0.03] p-3 text-[11px] font-medium leading-relaxed text-choco/55">
        <InfoRow>Puanlar, troll oylarını engellemek için yetkililer onayladıktan sonra genel ortalamaya işlenir.</InfoRow>
        <InfoRow>Onaylanan puan bir daha değiştirilemez — düşünerek ver.</InfoRow>
        <InfoRow>Üst tier oyuncuların puanları ortalamayı biraz daha fazla etkiler.</InfoRow>
        <InfoRow>Oynayışını bilmediğin fareleri puanlama lütfen.</InfoRow>
      </ul>
    </div>
  );
}

function InfoRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-teal/70" />
      <span>{children}</span>
    </li>
  );
}
