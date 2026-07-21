"use client";

import { useEffect, useMemo, useState } from "react";
import { getMice, savePermissions } from "@/lib/api";
import { PERMS } from "@/lib/perms";
import { formatName } from "@/lib/format";
import { tierOf } from "@/lib/tiers";
import { Mouse, PermId } from "@/lib/types";
import MouseAvatar from "./MouseAvatar";

/**
 * Admin-only permission manager. Pick a mouse, toggle its powers, save.
 * Saving bumps the mouse's epoch → its sessions die → forced re-login.
 */
export default function PermissionsPanel({
  onToast,
}: {
  onToast: (msg: string, kind?: "ok" | "err") => void;
}) {
  const [mice, setMice] = useState<Mouse[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState<PermId[]>([]);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    getMice().then(setMice).catch(() => {});
  }, []);

  const selected = mice.find((m) => m.id === selectedId) ?? null;

  useEffect(() => {
    setDraft(selected?.permissions ?? []);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const staff = useMemo(
    () => mice.filter((m) => (m.permissions?.length ?? 0) > 0),
    [mice]
  );

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle
      ? mice.filter((m) => m.nickname.toLowerCase().includes(needle))
      : mice;
  }, [mice, q]);

  function toggle(p: PermId) {
    setDraft((d) => (d.includes(p) ? d.filter((x) => x !== p) : [...d, p]));
  }

  async function save() {
    if (!selected) return;
    setBusy(true);
    try {
      await savePermissions(selected.id, draft);
      const fresh = await getMice();
      setMice(fresh);
      onToast(
        `${formatName(selected.nickname)} yetkileri güncellendi — oturumu düşürüldü, tekrar giriş yapması gerekiyor.`
      );
    } catch (e: any) {
      onToast(e?.message ?? "Kaydedilemedi", "err");
    } finally {
      setBusy(false);
    }
  }

  const dirty =
    selected &&
    JSON.stringify([...(selected.permissions ?? [])].sort()) !==
      JSON.stringify([...draft].sort());

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      {/* Left: pick a mouse */}
      <div className="glass-strong sys-window p-4">
        <div className="mb-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-teal-deep">
          Oyuncu Seç
        </div>
        <input
          className="field mb-3 py-1.5 text-sm"
          placeholder="Nick ara…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
          {list.map((m) => {
            const t = tierOf(m.tier);
            const active = m.id === selectedId;
            const isStaff = (m.permissions?.length ?? 0) > 0;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all"
                style={{
                  background: active ? `${t.accent}1f` : "transparent",
                  border: `1px solid ${active ? `${t.accent}66` : "transparent"}`,
                }}
              >
                <div
                  className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border"
                  style={{ borderColor: `${t.accent}55` }}
                >
                  <MouseAvatar src={m.image_url} alt={m.nickname} accent={t.accent} />
                </div>
                <span className="min-w-0 flex-1 truncate font-system text-sm font-bold text-choco">
                  {formatName(m.nickname)}
                </span>
                {isStaff && (
                  <span className="shrink-0 rounded-full bg-teal/15 px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-wide text-teal-deep ring-1 ring-teal/40 tabular-nums">
                    {m.permissions.length} yetki
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: grant/revoke */}
      <div className="space-y-5">
        {!selected ? (
          <div className="glass rounded-2xl p-10 text-center font-system font-semibold text-choco/40">
            Soldan bir oyuncu seç → yetkilerini buradan yönet.
          </div>
        ) : (
          <div className="glass-strong sys-window p-5">
            <div className="mb-4 flex items-center gap-3">
              <div
                className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border"
                style={{ borderColor: `${tierOf(selected.tier).accent}66` }}
              >
                <MouseAvatar
                  src={selected.image_url}
                  alt={selected.nickname}
                  accent={tierOf(selected.tier).accent}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-lg font-bold text-choco">
                  {formatName(selected.nickname)}
                </div>
                <div className="font-system text-[11px] font-semibold uppercase tracking-wider text-choco/40">
                  {tierOf(selected.tier).label} · {draft.length} yetki seçili
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {PERMS.map((p) => {
                const on = draft.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    className="flex items-start gap-3 rounded-xl border p-3 text-left transition-all"
                    style={{
                      borderColor: on ? "#49c0c2" : "rgba(255,255,255,0.1)",
                      background: on
                        ? "rgba(73,192,194,0.12)"
                        : "rgba(255,255,255,0.03)",
                      boxShadow: on ? "0 0 14px rgba(73,192,194,0.18)" : "none",
                    }}
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border font-display text-[11px] font-bold"
                      style={{
                        borderColor: on ? "#49c0c2" : "rgba(255,255,255,0.25)",
                        background: on ? "#49c0c2" : "transparent",
                        color: on ? "#052b2c" : "transparent",
                      }}
                    >
                      ✓
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block font-system text-sm font-bold"
                        style={{ color: on ? "#74d3d5" : "#cdd6e0" }}
                      >
                        {p.label}
                      </span>
                      <span className="block text-[11px] font-medium leading-snug text-choco/45">
                        {p.desc}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium leading-snug text-choco/45">
                Kaydedince bu oyuncunun oturumu anında düşer ve yeni
                yetkileriyle <b>tekrar giriş yapması gerekir</b>.
              </p>
              <button
                onClick={save}
                disabled={!dirty || busy}
                className="btn-primary shrink-0 disabled:opacity-40"
              >
                {busy ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          </div>
        )}

        {/* current staff overview */}
        <div className="glass sys-window p-5">
          <div className="mb-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-teal-deep">
            Aktif Yetkililer
          </div>
          {staff.length === 0 ? (
            <p className="text-sm font-medium italic text-choco/35">
              Henüz kimseye panel yetkisi verilmemiş.
            </p>
          ) : (
            <div className="space-y-2">
              {staff.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2"
                >
                  <span className="font-system text-sm font-bold text-choco">
                    {formatName(m.nickname)}
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {m.permissions.map((pid) => {
                      const p = PERMS.find((x) => x.id === pid);
                      return (
                        <span
                          key={pid}
                          className="rounded-md bg-teal/10 px-1.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-wide text-teal-deep ring-1 ring-teal/30"
                        >
                          {p?.label}
                        </span>
                      );
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
