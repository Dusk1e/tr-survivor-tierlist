"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import TurkishFlag from "./TurkishFlag";

/**
 * Solo Leveling "System Authentication" gate. Posts the password to the
 * server, which sets a signed httpOnly session cookie on success.
 */
export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? "Login failed");
      }
      onSuccess();
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="sys-window sys-bracket scanlines glass-strong relative w-full max-w-sm p-7"
        style={{ ["--sys-accent" as any]: "#38bdf8" }}
      >
        <div className="mb-5 flex flex-col items-center gap-3 text-center">
          <TurkishFlag size={48} />
          <div>
            <div className="font-display text-[10px] font-extrabold uppercase tracking-[0.3em] text-teal-deep">
              Yönetici Girişi
            </div>
            <h1 className="mt-1 font-display text-2xl font-extrabold uppercase text-choco neon">
              Admin Paneli
            </h1>
            <p className="mt-1 text-xs font-semibold text-choco/60">
              Sıralamayı yalnızca yönetici düzenleyebilir.
            </p>
          </div>
        </div>

        <label className="label" htmlFor="pw">
          Yönetici Şifresi
        </label>
        <input
          id="pw"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field font-mono tracking-widest"
          placeholder="••••••••"
        />

        {error && (
          <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Doğrulanıyor…" : "Panele Gir"}
        </button>

        <p className="mt-4 text-center text-[11px] font-semibold text-choco/45">
          Ziyaretçiler sadece görüntüler — giriş gerekmez.
        </p>
      </motion.form>
    </div>
  );
}
