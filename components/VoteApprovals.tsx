"use client";

import { useCallback, useEffect, useState } from "react";
import { decideVote, getVoteLog } from "@/lib/api";
import { DIMS, zoneOf } from "@/lib/dims";
import { formatName } from "@/lib/format";
import { Vote } from "@/lib/types";

/**
 * Bekleyen puanlama onay kuyruğu. Onayla → ortalamaya işlenir ve kilitlenir;
 * Reddet → hiç sayılmaz (oyuncu yeniden gönderebilir).
 */
export default function VoteApprovals({
  deciderName,
  onChanged,
}: {
  deciderName: string;
  onChanged?: () => void;
}) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    getVoteLog()
      .then((all) => setVotes(all.filter((v) => v.status === "pending")))
      .catch((e) => setErr(e?.message ?? "Yüklenemedi"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(v: Vote, action: "approve" | "reject") {
    setBusyId(v.id);
    setErr(null);
    try {
      await decideVote(v.id, action, deciderName);
      setVotes((list) => list.filter((x) => x.id !== v.id));
      onChanged?.();
    } catch (e: any) {
      setErr(e?.message ?? "İşlem başarısız");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold uppercase tracking-tight text-choco">
          Onay Bekleyen Puanlamalar
          <span className="ml-2 rounded-full bg-amber-400/15 px-2.5 py-0.5 font-display text-sm font-bold text-amber-300 tabular-nums">
            {votes.length}
          </span>
        </h3>
        <button onClick={load} className="btn-ghost px-3 py-1.5 text-xs">
          Yenile
        </button>
      </div>

      {err && (
        <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
          {err}
        </p>
      )}

      {votes.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center font-system font-semibold text-choco/40">
          Bekleyen puanlama yok.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {votes.map((v) => (
            <div key={v.id} className="glass sys-window p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 font-system text-sm font-bold text-choco">
                  <span className="truncate">{formatName(v.voter_nick)}</span>
                  <span className="text-choco/35">→</span>
                  <span className="truncate text-teal-deep">
                    {formatName(v.target_nick)}
                  </span>
                </div>
                <span className="shrink-0 font-system text-[10px] font-semibold text-choco/35 tabular-nums">
                  {formatDate(v.created_at)}
                </span>
              </div>

              <div className="mb-3 space-y-2">
                {DIMS.map((d) => {
                  const val = v.scores[d.id] ?? 0;
                  const zone = zoneOf(val);
                  return (
                    <div key={d.id}>
                      <div className="mb-0.5 flex items-center justify-between">
                        <span className="font-system text-[11px] font-semibold text-choco/60">
                          {d.label}
                        </span>
                        <span
                          className="font-display text-[11px] font-bold tabular-nums"
                          style={{ color: zone.color }}
                        >
                          %{val}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${val}%`, background: zone.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <AnswerChip label="Hotkey" yes={v.hotkey} yesColor="#e5646b" />
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={busyId === v.id}
                    onClick={() => decide(v, "reject")}
                    className="btn-danger px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    Reddet
                  </button>
                  <button
                    disabled={busyId === v.id}
                    onClick={() => decide(v, "approve")}
                    className="btn-success px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    Onayla
                  </button>
                </div>
              </div>

              <p className="text-[10px] font-medium leading-snug text-choco/35">
                Onaylarsan ortalamaya işlenir ve oyuncu bir daha değiştiremez;
                reddedersen sayılmaz (oyuncu tekrar gönderebilir).
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnswerChip({
  label,
  yes,
  yesColor,
}: {
  label: string;
  yes: boolean;
  yesColor: string;
}) {
  return (
    <span
      className="rounded-md px-2 py-0.5 font-system text-[11px] font-bold"
      style={{
        color: yes ? yesColor : "#9aa6b4",
        background: yes ? `${yesColor}18` : "rgba(255,255,255,0.05)",
        border: `1px solid ${yes ? `${yesColor}55` : "rgba(255,255,255,0.12)"}`,
      }}
    >
      {label}: {yes ? "Evet" : "Hayır"}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
