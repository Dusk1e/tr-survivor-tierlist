"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import AdminLogin from "@/components/AdminLogin";
import AdminPanel from "@/components/AdminPanel";
import FlagBanner from "@/components/FlagBanner";

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAuthed(Boolean(d?.authed)))
      .catch(() => setAuthed(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthed(false);
  }

  return (
    <main className="relative min-h-screen">
      <FlagBanner />
      <Header
        subtitle="Yönetim Paneli · Site Yöneticisi"
        right={
          <div className="flex items-center gap-2">
            <Link href="/" className="btn-ghost text-sm">
              ← Tierlist'e Dön
            </Link>
            {authed && (
              <button onClick={logout} className="btn-danger text-sm">
                Çıkış
              </button>
            )}
          </div>
        }
      />

      {authed === null ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="animate-pulse-glow font-display text-sm uppercase tracking-[0.35em] text-teal-deep">
            Sisteme bağlanılıyor…
          </div>
        </div>
      ) : authed ? (
        <AdminPanel onLogout={logout} />
      ) : (
        <AdminLogin onSuccess={() => setAuthed(true)} />
      )}
    </main>
  );
}
