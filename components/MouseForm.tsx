"use client";

import { useState } from "react";
import { Mouse, MouseInput, SlotId } from "@/lib/types";
import { SLOTS, tierOf } from "@/lib/tiers";
import { STARTER_PASSWORD } from "@/lib/seed";
import MouseAvatar from "./MouseAvatar";

/**
 * Add / edit form. Placement supports main tiers AND between-slots
 * ("S – A ARASI"). New mice get the manual starter password; the panel
 * hands it to the player in-game and can change it later.
 */
export default function MouseForm({
  initial,
  submitLabel,
  canEditPassword = true,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Mouse>;
  submitLabel: string;
  canEditPassword?: boolean;
  onSubmit: (input: MouseInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const isEdit = !!initial?.id;
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [tier, setTier] = useState<SlotId>((initial?.tier as SlotId) ?? "de");
  const [password, setPassword] = useState(
    initial?.password ?? (isEdit ? "" : STARTER_PASSWORD)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accent = tierOf(tier).accent;

  function reset() {
    setNickname("");
    setTitle("");
    setImageUrl("");
    setPassword(STARTER_PASSWORD);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("Nick zorunludur.");
      return;
    }
    if (canEditPassword && !isEdit && !password.trim()) {
      setError("Şifre zorunludur (oyuncu bununla giriş yapacak).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload: MouseInput = {
        nickname: nickname.trim(),
        title: title.trim(),
        image_url: imageUrl.trim(),
        tier,
        sort: initial?.sort ?? 0,
        // login = nickname; stays stable after later nick edits
        username: (initial?.username ?? nickname).trim(),
        password: canEditPassword
          ? password.trim() || (initial?.password ?? "")
          : initial?.password ?? "",
        permissions: (initial?.permissions as MouseInput["permissions"]) ?? [],
        epoch: initial?.epoch ?? 0,
      };
      await onSubmit(payload);
      if (!isEdit) reset();
    } catch (e: any) {
      setError(e?.message ?? "Bir şeyler ters gitti.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[auto_1fr]">
      {/* Preview */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="h-24 w-24 overflow-hidden rounded-2xl border"
          style={{ borderColor: `${accent}77`, background: `${accent}14` }}
        >
          <MouseAvatar src={imageUrl} alt={nickname || "önizleme"} accent={accent} />
        </div>
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-choco/45">
          Önizleme
        </span>
      </div>

      {/* Fields */}
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="mf-nick">
              Nick *
            </label>
            <input
              id="mf-nick"
              className="field"
              value={nickname}
              maxLength={40}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="örn. Gracc"
            />
          </div>
          <div>
            <label className="label" htmlFor="mf-title">
              Unvan / Rol
            </label>
            <input
              id="mf-title"
              className="field"
              value={title}
              maxLength={60}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="örn. WS Kralı"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="mf-img">
            Avatar Görsel URL (PNG önerilir)
          </label>
          <input
            id="mf-img"
            className="field"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…  (boş bırak → varsayılan fare)"
          />
        </div>

        <div>
          <label className="label" htmlFor="mf-tier">
            Konum (tier veya ara bölge)
          </label>
          <select
            id="mf-tier"
            className="field"
            value={tier}
            onChange={(e) => setTier(e.target.value as SlotId)}
          >
            {SLOTS.map((s) => (
              <option key={s.id} value={s.id} className="bg-void">
                {s.kind === "between" ? `↕ ${s.label}` : `${s.label} — ${s.subtitle}`}
              </option>
            ))}
          </select>
        </div>

        {canEditPassword && (
          <div
            className="rounded-xl border p-3"
            style={{
              borderColor: "rgba(73,192,194,0.3)",
              background: "rgba(73,192,194,0.06)",
            }}
          >
            <div className="mb-2 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-teal-deep">
              Giriş Şifresi (oyuncuya oyun içinde ver)
            </div>
            <div className="flex gap-1">
              <input
                id="mf-pass"
                className="field font-mono"
                value={password}
                maxLength={40}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? "değiştirmek için yaz" : "şifre"}
              />
              <button
                type="button"
                onClick={() =>
                  setPassword(Math.random().toString(36).slice(2, 8))
                }
                title="Rastgele şifre üret"
                className="btn-ghost shrink-0 px-3 text-xs"
              >
                Üret
              </button>
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-choco/45">
              Kullanıcı adı otomatik = nick. Şifre değişince oyuncunun oturumu
              düşer, yeniden giriş yapması gerekir.
            </p>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
            {busy ? "Kaydediliyor…" : submitLabel}
          </button>
          {onCancel && (
            <button type="button" className="btn-ghost" onClick={onCancel}>
              İptal
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
