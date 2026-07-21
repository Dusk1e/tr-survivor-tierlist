"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mouse } from "@/lib/types";
import { tierOf } from "@/lib/tiers";
import { zoneOf } from "@/lib/dims";
import { formatName } from "@/lib/format";
import MouseAvatar from "./MouseAvatar";
import ScoreRing from "./ScoreRing";
import ScoreBars from "./ScoreBars";
import VoteSliders from "./VoteSliders";
import { useSession } from "./SessionProvider";

/**
 * Oyuncu kartı: kimlik, toplam istatistikler (genel halka, kategori
 * ortalamaları, Hotkey/Hot yüzdeleri, oy sayısı) ve onay durumlu puanlama
 * akışı (bekliyor / onaylandı-kilitli / reddedildi).
 */
export default function MouseDetailModal({
  mouse,
  onClose,
}: {
  mouse: Mouse | null;
  onClose: () => void;
}) {
  const { session, isMe, aggFor, myVoteFor, openLoginFor, submitVote } =
    useSession();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setErr(null);
    setEditing(false);
  }, [mouse?.id]);

  if (!mouse) return null;
  const tier = tierOf(mouse.tier);
  const agg = aggFor(mouse.id);
  const mine = isMe(mouse.id);
  const myVote = myVoteFor(mouse.id);
  const overallZone = agg ? zoneOf(agg.overall) : null;

  async function handleSubmit(scores: any, hotkey: boolean) {
    if (!mouse) return;
    setBusy(true);
    setErr(null);
    try {
      await submitVote(mouse, scores, hotkey);
      setEditing(false);
    } catch (e: any) {
      setErr(e?.message ?? "Gönderilemedi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {mouse && (
        <motion.div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-abyss/85 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 10 }}
            className="glass-strong sys-window max-h-[92vh] w-full max-w-lg overflow-y-auto p-6"
            style={{
              boxShadow: `0 0 0 1px ${tier.accent}44, 0 24px 64px rgba(0,0,0,0.65)`,
            }}
          >
            <button
              onClick={onClose}
              aria-label="Kapat"
              className="absolute right-4 top-4 z-10 text-choco/45 hover:text-choco"
            >
              ×
            </button>

            {/* Kimlik */}
            <div className="flex items-center gap-4">
              <div
                className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2"
                style={{
                  borderColor: tier.accent,
                  background: `${tier.accent}14`,
                  boxShadow: `0 8px 22px ${tier.accent}33`,
                }}
              >
                <MouseAvatar
                  src={mouse.image_url}
                  alt={mouse.nickname}
                  accent={tier.accent}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-2xl font-bold tracking-tight text-choco">
                  {formatName(mouse.nickname)}
                </div>
                {mouse.title && (
                  <div className="truncate text-sm font-semibold text-choco/60">
                    {mouse.title}
                  </div>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Chip color={tier.deep} bg={`${tier.accent}22`} border={`${tier.accent}66`}>
                    {tier.label}
                  </Chip>
                  {overallZone && (
                    <Chip
                      color={overallZone.color}
                      bg={`${overallZone.color}1c`}
                      border={`${overallZone.color}55`}
                    >
                      {overallZone.label}
                    </Chip>
                  )}
                  {mine && (
                    <Chip color="#6ee7a0" bg="rgba(74,222,128,0.12)" border="rgba(74,222,128,0.4)">
                      Bu Sensin
                    </Chip>
                  )}
                </div>
              </div>
            </div>

            <div className="my-4 hairline" />

            {/* İstatistikler */}
            <div className="mb-2 flex items-center justify-between">
              <SectionTitle>Topluluk Puanı</SectionTitle>
              <span className="font-system text-[11px] font-bold uppercase tracking-wider text-choco/45 tabular-nums">
                {agg && agg.count > 0 ? `${agg.count} onaylı oy` : "başlangıç puanı"}
              </span>
            </div>

            {agg ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="mb-4 flex items-center gap-4">
                  <ScoreRing
                    value={agg.overall}
                    count={agg.count}
                    size={76}
                    stroke={7}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-lg font-bold text-choco">
                      Genel Ortalama{" "}
                      <span style={{ color: overallZone?.color }} className="tabular-nums">
                        %{Math.round(agg.overall)}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-choco/50">
                      {agg.count > 0
                        ? "3 kategorinin ağırlıklı ortalaması · üst tier oyları daha etkili"
                        : "Henüz topluluk oyu yok — gösterilen puan tier başlangıç değeridir."}
                    </div>
                  </div>
                </div>

                <ScoreBars scores={agg.avg} />

                {/* Hotkey yüzdesi — yalnızca gerçek oy varsa anlamlı */}
                {agg.count > 0 && (
                  <div className="mt-4">
                    <BinaryStat
                      label="Hotkey kullandığını düşünenler"
                      yesPct={agg.hotkeyYesPct}
                      yes={agg.hotkeyYes}
                      no={agg.hotkeyNo}
                      yesColor="#e5646b"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center font-system text-sm font-semibold text-choco/40">
                Henüz onaylı oy yok. İlk puanı sen ver.
              </div>
            )}

            <div className="my-4 hairline" />

            {/* Puanlama */}
            <div className="mb-2">
              <SectionTitle>Puanla</SectionTitle>
            </div>

            {err && (
              <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
                {err}
              </p>
            )}

            {!session ? (
              <div className="rounded-2xl border border-teal/20 bg-teal/5 p-4 text-center">
                <p className="mb-3 text-sm font-semibold text-choco/75">
                  Bu senin faren mi? Şifrenle giriş yap, sonra tanıdığın
                  fareleri puanla.
                </p>
                <button
                  onClick={() => openLoginFor(mouse)}
                  className="btn-primary w-full"
                >
                  {formatName(mouse.nickname)} olarak giriş yap
                </button>
                <p className="mt-2 text-[11px] font-medium text-choco/45">
                  Şifreni site yetkililerinden alabilirsin. Sadece kendi
                  farenden giriş yapabilirsin.
                </p>
              </div>
            ) : mine ? (
              <div className="rounded-2xl border border-green-500/25 bg-green-500/5 p-4 text-center font-system text-sm font-semibold text-green-200/80">
                Giriş yapıldı — bu senin kartın. Kendine puan veremezsin;
                diğer farelere tıklayıp onları puanla.
              </div>
            ) : myVote && !editing ? (
              <VoteStatusCard
                status={myVote.status}
                onEdit={() => setEditing(true)}
              />
            ) : (
              <VoteSliders
                initialScores={myVote?.scores}
                initialHotkey={myVote?.hotkey}
                busy={busy}
                submitLabel={
                  myVote?.status === "rejected"
                    ? "Tekrar Puanla"
                    : myVote?.status === "pending"
                    ? "Puanı Güncelle"
                    : "Puanlamayı Gönder"
                }
                onSubmit={handleSubmit}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------ parçalar -------------------------------- */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em] text-teal-deep">
      <span className="h-[2px] w-4 rounded-full bg-teal/70" />
      {children}
    </span>
  );
}

function Chip({
  children,
  color,
  bg,
  border,
}: {
  children: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <span
      className="inline-block rounded-lg px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider"
      style={{ color, background: bg, border: `1px solid ${border}` }}
    >
      {children}
    </span>
  );
}

/** Evet/Hayır sonucu — yüzde dolgu çubuğu + sayılar. */
function BinaryStat({
  label,
  yesPct,
  yes,
  no,
  yesColor,
}: {
  label: string;
  yesPct: number;
  yes: number;
  no: number;
  yesColor: string;
}) {
  const verdictYes = yesPct >= 50;
  const pct = Math.round(yesPct);
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-system text-[12px] font-semibold text-choco/75">
          {label}
        </span>
        <span
          className="rounded-md px-1.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-wide tabular-nums"
          style={{
            color: verdictYes ? yesColor : "#9aa6b4",
            background: verdictYes ? `${yesColor}1c` : "rgba(255,255,255,0.06)",
            border: `1px solid ${verdictYes ? `${yesColor}55` : "rgba(255,255,255,0.12)"}`,
          }}
        >
          {verdictYes ? "Evet" : "Hayır"} %{verdictYes ? pct : 100 - pct}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${yesColor}99, ${yesColor})`,
            transition: "width 0.5s ease",
          }}
        />
      </div>
      <div className="mt-1 flex justify-between font-system text-[10px] font-semibold text-choco/40 tabular-nums">
        <span>Evet %{pct} ({yes})</span>
        <span>Hayır %{100 - pct} ({no})</span>
      </div>
    </div>
  );
}

function VoteStatusCard({
  status,
  onEdit,
}: {
  status: "pending" | "approved" | "rejected";
  onEdit: () => void;
}) {
  if (status === "approved") {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/8 p-4 text-center">
        <div className="font-display text-sm font-bold uppercase tracking-wide text-green-300">
          Puanın Onaylandı
        </div>
        <p className="mt-1 text-xs font-semibold text-choco/55">
          Puanın genel ortalamaya işlendi. Onaylanan puan bir daha
          değiştirilemez.
        </p>
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/8 p-4 text-center">
        <div className="font-display text-sm font-bold uppercase tracking-wide text-amber-300">
          Yetkili Onayı Bekleniyor
        </div>
        <p className="mt-1 text-xs font-semibold text-choco/55">
          Puanın gönderildi. Bir yetkili onayladığında genel ortalamaya
          işlenecek. Onaylanana kadar güncelleyebilirsin.
        </p>
        <button onClick={onEdit} className="btn-ghost mt-3 text-sm">
          Puanı Güncelle
        </button>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/8 p-4 text-center">
      <div className="font-display text-sm font-bold uppercase tracking-wide text-red-300">
        Puanın Reddedildi
      </div>
      <p className="mt-1 text-xs font-semibold text-choco/55">
        Yetkililer bu puanı genel ortalamaya işlemedi. İstersen daha gerçekçi
        bir puanla tekrar gönderebilirsin.
      </p>
      <button onClick={onEdit} className="btn-ghost mt-3 text-sm">
        Tekrar Puanla
      </button>
    </div>
  );
}
