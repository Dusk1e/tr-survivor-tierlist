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
import { cancelVote } from "@/lib/api";
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
  const { session, isMe, aggFor, myVoteFor, openLoginFor, submitVote, refresh } =
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
  const isLove = tier.shape === "heart";
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
          className="fixed inset-0 z-[65] flex items-center justify-center bg-abyss/92 p-4"
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
                {/* Ünvan — kartın en dikkat çeken satırı olmalı. Tier rengiyle
                    parlar, büyük harf ve geniş harf aralığıyla yazılır. */}
                {mouse.title && (
                  <div
                    className="mt-1 truncate font-display text-[15px] font-bold uppercase leading-tight tracking-[0.08em] sm:text-lg"
                    style={{
                      color: tier.deep,
                      textShadow: `0 0 14px ${tier.accent}88, 0 1px 2px rgba(0,0,0,0.6)`,
                    }}
                    title={mouse.title}
                  >
                    {mouse.title}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Chip color={tier.deep} bg={`${tier.accent}38`} border={`${tier.accent}aa`}>
                    {tier.label}
                  </Chip>
                  {/* Puan bölgesi etiketi (İyi/Kötü…) Aşk Köşesi'nde gösterilmez. */}
                  {overallZone && !isLove && (
                    <Chip
                      color={overallZone.color}
                      bg={`${overallZone.color}30`}
                      border={`${overallZone.color}99`}
                    >
                      {overallZone.label}
                    </Chip>
                  )}
                  {mine && (
                    <Chip color="#8ff0b8" bg="rgba(74,222,128,0.24)" border="rgba(74,222,128,0.7)">
                      Bu Sensin
                    </Chip>
                  )}
                </div>
              </div>
            </div>

            <div className="my-4 hairline" />

            {/* Aşk Köşesi puanlanmaz — istatistik ve oylama bölümü gizlenir. */}
            {isLove ? (
              <LoveNote accent={tier.accent} deep={tier.deep} />
            ) : (
            <>
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

                {/* Hotkey — yalnızca gerçek oy varsa anlamlı. Kendi paneli
                    var çünkü en çok merak edilen bilgi bu. */}
                {agg.count > 0 && (
                  <div className="mt-4">
                    <HotkeyPanel
                      yesPct={agg.hotkeyYesPct}
                      yes={agg.hotkeyYes}
                      no={agg.hotkeyNo}
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
                busy={busy}
                onCancel={async () => {
                  setBusy(true);
                  setErr(null);
                  try {
                    await cancelVote(myVote.id);
                    await refresh();
                    setEditing(true); // puanlama ekranı geri gelsin
                  } catch (e: any) {
                    setErr(e?.message ?? "İptal edilemedi");
                  } finally {
                    setBusy(false);
                  }
                }}
                onRetry={() => setEditing(true)}
              />
            ) : (
              <VoteSliders
                initialScores={myVote?.scores}
                initialHotkey={myVote?.hotkey}
                busy={busy}
                submitLabel={
                  myVote?.status === "rejected"
                    ? "Tekrar Puanla"
                    : "Puanlamayı Gönder"
                }
                onSubmit={handleSubmit}
              />
            )}
            </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Aşk Köşesi'ndeki fare için puan yerine gösterilen pembe kart. */
function LoveNote({ accent, deep }: { accent: string; deep: string }) {
  return (
    <div
      className="rounded-2xl border p-6 text-center"
      style={{
        borderColor: `${accent}55`,
        background: `linear-gradient(135deg, ${accent}18, ${accent}06)`,
      }}
    >
      <span className="heart-beat mx-auto mb-2 block w-fit">
        <svg viewBox="0 0 100 100" width={42} height={42}>
          <path
            d="M50,89 C50,89 9,61 9,36 C9,20 21,10 33,10 C41,10 47,15 50,21 C53,15 59,10 67,10 C79,10 91,20 91,36 C91,61 50,89 50,89 Z"
            fill={accent}
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="4"
          />
        </svg>
      </span>
      <div className="font-display text-lg font-bold" style={{ color: deep }}>
        Aşk Köşesi
      </div>
      <p className="mt-1 text-sm font-semibold text-choco/55">
        Burada puan yok, puanlama yok. Sadece kalp var.
      </p>
    </div>
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
      className="inline-block rounded-lg px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-[0.1em] sm:text-xs"
      style={{
        color,
        background: bg,
        border: `1.5px solid ${border}`,
        boxShadow: `0 0 12px ${border}, inset 0 1px 0 rgba(255,255,255,0.08)`,
        textShadow: `0 0 10px ${color}66`,
      }}
    >
      {children}
    </span>
  );
}

/** Evet/Hayır sonucu — yüzde dolgu çubuğu + sayılar. */
/**
 * Hotkey sonucu — detay penceresindeki en dikkat çekici kutu. Büyük yüzde,
 * kırmızı eğik H damgası ve evet/hayır dağılımı bir arada.
 */
function HotkeyPanel({
  yesPct,
  yes,
  no,
}: {
  yesPct: number;
  yes: number;
  no: number;
}) {
  const pct = Math.round(yesPct);
  const kullaniyor = pct >= 50;
  const renk = kullaniyor ? "#e5646b" : "#5ad06a";
  const toplam = yes + no;

  return (
    <div
      className="rounded-2xl border-2 p-4"
      style={{
        borderColor: `${renk}66`,
        background: `linear-gradient(135deg, ${renk}1f, ${renk}08)`,
        boxShadow: `0 0 22px ${renk}26`,
      }}
    >
      <div className="flex items-center gap-4">
        {/* Eğik H damgası — karttakinin büyüğü */}
        <span
          className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-lg border-2 font-display text-[22px] font-bold leading-none"
          style={{
            color: renk,
            borderColor: renk,
            background: kullaniyor ? "#2a1013" : "#0f2116",
            transform: "rotate(-14deg)",
            boxShadow: `0 0 16px ${renk}66`,
          }}
          aria-hidden
        >
          H
        </span>

        <div className="min-w-0 flex-1">
          <div className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-choco/45">
            Hotkey
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span
              className="font-display text-3xl font-bold tabular-nums"
              style={{ color: renk, textShadow: `0 0 18px ${renk}66` }}
            >
              %{kullaniyor ? pct : 100 - pct}
            </span>
            <span className="font-system text-sm font-bold text-choco/80">
              {kullaniyor ? "kullanıyor diyor" : "kullanmıyor diyor"}
            </span>
          </div>
          <div className="mt-0.5 font-system text-xs font-medium text-choco/45 tabular-nums">
            {toplam} oyun {yes} tanesi evet, {no} tanesi hayır
          </div>
        </div>
      </div>

      {/* Dağılım çubuğu */}
      <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #e5646b99, #e5646b)",
            transition: "width 0.5s ease",
          }}
        />
        <div
          className="h-full flex-1"
          style={{ background: "rgba(90,208,106,0.35)" }}
        />
      </div>
      <div className="mt-1 flex justify-between font-system text-[10px] font-bold uppercase tracking-wider">
        <span style={{ color: "#e5646b" }}>Evet %{pct}</span>
        <span style={{ color: "#5ad06a" }}>Hayır %{100 - pct}</span>
      </div>
    </div>
  );
}

function VoteStatusCard({
  status,
  busy,
  onCancel,
  onRetry,
}: {
  status: "pending" | "approved" | "rejected";
  busy: boolean;
  onCancel: () => void;
  onRetry: () => void;
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
          işlenecek.
        </p>
        <p className="mt-2 text-xs font-semibold text-choco/70">
          İptal etmek ister misin?
        </p>
        <button
          onClick={onCancel}
          disabled={busy}
          className="btn-ghost mt-2 text-sm disabled:opacity-50"
        >
          {busy ? "İptal ediliyor…" : "Puanı İptal Et"}
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
      <button onClick={onRetry} className="btn-ghost mt-3 text-sm">
        Tekrar Puanla
      </button>
    </div>
  );
}
