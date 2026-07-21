"use client";

import Link from "next/link";
import { formatName } from "@/lib/format";
import { hasAnyPerm } from "@/lib/perms";
import { useSession } from "./SessionProvider";

/**
 * Genel sayfa başlığının sağ tarafı. Fare girişi kart üzerinden yapılır;
 * burada oturum bilgisi, yetkili paneli kısayolu ve Admin girişi bulunur.
 */
export default function HeaderAuthControls() {
  const { ready, session, logout } = useSession();

  return (
    <div className="flex items-center gap-2">
      {ready && session && (
        <>
          <span
            className="hidden items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 font-system text-sm font-bold text-emerald-300 sm:inline-flex"
            title="Giriş yapıldı"
          >
            <span className="h-2 w-2 animate-pulse-glow rounded-full bg-emerald-400" />
            {formatName(session.nickname)}
          </span>

          {hasAnyPerm(session) && (
            <Link href="/panel" className="btn-ghost text-sm">
              Yetkili Paneli
            </Link>
          )}

          <button onClick={logout} className="btn-ghost text-sm">
            Çıkış
          </button>
        </>
      )}

      <Link href="/admin" className="btn-admin text-sm">
        Admin Girişi
      </Link>
    </div>
  );
}
