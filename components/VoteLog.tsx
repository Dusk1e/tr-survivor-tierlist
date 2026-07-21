"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getVoteLog } from "@/lib/api";
import { DIMS, zoneOf } from "@/lib/dims";
import { formatName } from "@/lib/format";
import { Vote, VoteStatus } from "@/lib/types";

type Filter = "all" | VoteStatus;

const STATUS_META: Record<VoteStatus, { label: string; color: string }> = {
  pending: { label: "Bekliyor", color: "#eab308" },
  approved: { label: "Onaylandı", color: "#5ad06a" },
  rejected: { label: "Reddedildi", color: "#e5646b" },
};

/**
 * Puanlama kayıt defteri: kim kime ne verdi, kategori kategori; durum,
 * tarih ve karar veren. Durum filtresi + nick arama.
 */
export default function VoteLog() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    getVoteLog()
      .then(setVotes)
      .catch((e) => setErr(e?.message ?? "Yüklenemedi"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return votes.filter((v) => {
      if (filter !== "all" && v.status !== filter) return false;
      if (
        needle &&
        !v.voter_nick.toLowerCase().includes(needle) &&
        !v.target_nick.toLowerCase().includes(needle)
      )
        return false;
      return true;
    });
  }, [votes, filter, q]);

  const counts = useMemo(
    () => ({
      all: votes.length,
      pending: votes.filter((v) => v.status === "pending").length,
      approved: votes.filter((v) => v.status === "approved").length,
      rejected: votes.filter((v) => v.status === "rejected").length,
    }),
    [votes]
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold uppercase tracking-tight text-choco">
          Puanlama Kayıt Defteri
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="field !w-44 py-1.5 text-sm"
            placeholder="Nick ara"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button onClick={load} className="btn-ghost px-3 py-1.5 text-xs">
            Yenile
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={`Tümü (${counts.all})`}
          color="#9aa6b4"
        />
        {(Object.keys(STATUS_META) as VoteStatus[]).map((s) => (
          <FilterChip
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
            label={`${STATUS_META[s].label} (${counts[s]})`}
            color={STATUS_META[s].color}
          />
        ))}
      </div>

      {err && (
        <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
          {err}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center font-system font-semibold text-choco/40">
          Kayıt bulunamadı.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((v) => {
            const meta = STATUS_META[v.status];
            return (
              <div
                key={v.id}
                className="glass flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-4 py-3"
                style={{ borderLeft: `3px solid ${meta.color}` }}
              >
                <span className="w-24 shrink-0 font-system text-[11px] font-semibold text-choco/40 tabular-nums">
                  {formatDate(v.created_at)}
                </span>

                <span className="flex min-w-[180px] items-center gap-1.5 font-system text-sm font-bold">
                  <span className="truncate text-choco">
                    {formatName(v.voter_nick)}
                  </span>
                  <span className="text-choco/30">→</span>
                  <span className="truncate text-teal-deep">
                    {formatName(v.target_nick)}
                  </span>
                </span>

                <span className="flex flex-1 flex-wrap items-center gap-1.5">
                  {DIMS.map((d) => {
                    const val = v.scores[d.id] ?? 0;
                    const zone = zoneOf(val);
                    return (
                      <span
                        key={d.id}
                        title={d.label}
                        className="rounded-md px-1.5 py-0.5 font-display text-[10px] font-bold tabular-nums"
                        style={{
                          color: zone.color,
                          background: `${zone.color}16`,
                          border: `1px solid ${zone.color}44`,
                        }}
                      >
                        {d.short} %{val}
                      </span>
                    );
                  })}
                  <MiniAnswer label="Hotkey" yes={v.hotkey} yesColor="#e5646b" />
                </span>

                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  <span
                    className="rounded-full px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      color: meta.color,
                      background: `${meta.color}18`,
                      border: `1px solid ${meta.color}55`,
                    }}
                  >
                    {meta.label}
                  </span>
                  {v.decided_by && (
                    <span className="font-system text-[10px] font-medium text-choco/35">
                      {formatName(v.decided_by)} ·{" "}
                      {v.decided_at ? formatDate(v.decided_at) : ""}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MiniAnswer({
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
      className="rounded-md px-1.5 py-0.5 font-display text-[10px] font-bold"
      style={{
        color: yes ? yesColor : "#8b95a3",
        background: yes ? `${yesColor}16` : "rgba(255,255,255,0.05)",
        border: `1px solid ${yes ? `${yesColor}44` : "rgba(255,255,255,0.1)"}`,
      }}
    >
      {label}: {yes ? "E" : "H"}
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3 py-1.5 font-system text-xs font-bold transition-all"
      style={{
        color: active ? "#0b0f15" : color,
        background: active ? color : `${color}14`,
        border: `1px solid ${active ? color : `${color}44`}`,
      }}
    >
      {label}
    </button>
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
