"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mouse } from "@/lib/types";
import { tierOf } from "@/lib/tiers";
import { formatName } from "@/lib/format";
import MouseAvatar from "./MouseAvatar";

/**
 * Mouse login — opened from the player's OWN card. The identity is locked
 * (cannot be changed); only the password is entered. Passwords are handed
 * out by the site staff in-game.
 */
export default function MouseLoginModal({
  mouse,
  error,
  onClose,
  onSubmit,
}: {
  mouse: Mouse | null;
  error: string | null;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  useEffect(() => {
    if (mouse) {
      setPassword("");
      setLocalErr(null);
    }
  }, [mouse]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLocalErr(null);
    try {
      await onSubmit(password);
    } catch (e: any) {
      setLocalErr(e?.message ?? "Giriş başarısız");
    } finally {
      setBusy(false);
    }
  }

  const tier = mouse ? tierOf(mouse.tier) : null;

  return (
    <AnimatePresence>
      {mouse && tier && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-abyss/92 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 8 }}
            className="glass-strong sys-window w-full max-w-sm p-7"
          >
            <div className="mb-5 text-center">
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-choco">
                Fare Girişi
              </h2>
              <p className="mt-1 text-xs font-semibold text-choco/55">
                Kimlik kilitli — sadece şifreni gir.
              </p>
            </div>

            {/* Locked identity */}
            <div
              className="mb-4 flex items-center gap-3 rounded-2xl border p-3"
              style={{
                borderColor: `${tier.accent}44`,
                background: `linear-gradient(135deg, ${tier.accent}14, transparent)`,
              }}
            >
              <div
                className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border"
                style={{ borderColor: `${tier.accent}66` }}
              >
                <MouseAvatar
                  src={mouse.image_url}
                  alt={mouse.nickname}
                  accent={tier.accent}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-lg font-bold text-choco">
                  {formatName(mouse.nickname)}
                </div>
                <div className="font-system text-[11px] font-semibold uppercase tracking-wider text-choco/45">
                  {tier.label}
                </div>
              </div>
              <span
                className="rounded-md border border-white/12 bg-white/[0.05] px-1.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-wider text-choco/50"
                title="Kimlik kilitli"
              >
                Kilitli
              </span>
            </div>

            <label className="label" htmlFor="ml-pass">
              Şifre
            </label>
            <input
              id="ml-pass"
              type="password"
              autoFocus
              className="field font-mono tracking-widest"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {(localErr || error) && (
              <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
                {localErr || error}
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                disabled={busy || !password}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {busy ? "Giriş yapılıyor…" : "Giriş Yap"}
              </button>
              <button type="button" className="btn-ghost" onClick={onClose}>
                Kapat
              </button>
            </div>

            <p className="mt-4 text-center text-[11px] font-medium text-choco/40">
              Şifreni site yetkililerinden oyun içinde alabilirsin.
            </p>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
