"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { getSession } from "@/lib/api";
import { hasPerm } from "@/lib/perms";
import { formatName } from "@/lib/format";
import { Session } from "@/lib/types";
import Header from "@/components/Header";
import RosterManager from "@/components/RosterManager";
import VoteApprovals from "@/components/VoteApprovals";
import VoteLog from "@/components/VoteLog";

type Toast = { id: number; text: string; kind: "ok" | "err" };
type Tab = "roster" | "approvals" | "log";

/**
 * Staff panel — for MICE that the admin granted permissions to.
 * Available tabs depend on the granted permissions. Sessions die instantly
 * when permissions change (epoch bump), forcing a fresh login.
 */
export default function StaffPanelPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);
  const [tab, setTab] = useState<Tab | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const check = useCallback(async () => {
    const s = await getSession();
    setSession(s);
    setChecked(true);
  }, []);

  useEffect(() => {
    check();
    window.addEventListener("focus", check);
    const t = window.setInterval(check, 20_000);
    return () => {
      window.removeEventListener("focus", check);
      window.clearInterval(t);
    };
  }, [check]);

  const canRoster =
    hasPerm(session, "tier_edit") ||
    hasPerm(session, "mouse_add") ||
    hasPerm(session, "pw_view") ||
    hasPerm(session, "pw_edit");
  const canApprove = hasPerm(session, "vote_approve");
  const canLog = hasPerm(session, "vote_log") || canApprove;

  // pick the first available tab
  useEffect(() => {
    if (!checked) return;
    if (tab) return;
    if (canRoster) setTab("roster");
    else if (canApprove) setTab("approvals");
    else if (canLog) setTab("log");
  }, [checked, canRoster, canApprove, canLog, tab]);

  return (
    <main className="relative min-h-screen">
      <Header
        subtitle="Yetkili Paneli"
        right={
          <Link href="/" className="btn-ghost text-sm">
            ← Tierlist'e Dön
          </Link>
        }
      />

      {/* Toasts */}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="glass-strong sys-window px-4 py-3 text-sm font-semibold text-choco"
              style={{
                borderLeft: `4px solid ${t.kind === "ok" ? "#49c0c2" : "#e5646b"}`,
              }}
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mx-auto w-full max-w-wide px-5 py-8 sm:px-8">
        {!checked ? (
          <div className="glass h-40 animate-pulse rounded-2xl" />
        ) : !session ? (
          <Locked text="Bu panel için giriş yapmalısın. Ana sayfada kendi farene tıklayıp şifrenle gir." />
        ) : !(canRoster || canApprove || canLog) ? (
          <Locked
            text={`${formatName(
              session.nickname
            )}, hesabında panel yetkisi yok. Yetki verildiyse çıkıp tekrar giriş yapman gerekir.`}
          />
        ) : (
          <>
            <div className="mb-2 font-system text-sm font-semibold text-choco/60">
              Hoş geldin,{" "}
              <span className="font-bold text-teal-deep">
                {formatName(session.nickname)}
              </span>{" "}
              — yetkilerin: {session.permissions.length}
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {canRoster && (
                <TabButton active={tab === "roster"} onClick={() => setTab("roster")}>
                  Fareler
                </TabButton>
              )}
              {canApprove && (
                <TabButton
                  active={tab === "approvals"}
                  onClick={() => setTab("approvals")}
                >
                  Onaylar
                </TabButton>
              )}
              {canLog && (
                <TabButton active={tab === "log"} onClick={() => setTab("log")}>
                  Kayıt Defteri
                </TabButton>
              )}
            </div>

            {tab === "roster" && canRoster && (
              <RosterManager
                caps={{
                  canAdd: hasPerm(session, "mouse_add"),
                  canTierEdit: hasPerm(session, "tier_edit"),
                  canPwView: hasPerm(session, "pw_view"),
                  canPwEdit: hasPerm(session, "pw_edit"),
                  canDelete: false, // silme sadece adminde
                }}
                onToast={pushToast}
              />
            )}

            {tab === "approvals" && canApprove && (
              <VoteApprovals
                deciderName={session.nickname}
                onChanged={() => {}}
              />
            )}

            {tab === "log" && canLog && <VoteLog />}
          </>
        )}
      </div>
    </main>
  );
}

function Locked({ text }: { text: string }) {
  return (
    <div className="glass-strong sys-window mx-auto max-w-md p-8 text-center">
      <div className="mb-3 inline-block rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-choco/50">
        Erişim Kilitli
      </div>
      <p className="font-system text-sm font-semibold text-choco/70">{text}</p>
      <Link href="/" className="btn-primary mt-4 inline-flex">
        ← Ana Sayfa
      </Link>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-4 py-2 font-display text-xs font-bold uppercase tracking-wider transition-all"
      style={{
        background: active
          ? "linear-gradient(180deg, #56cfd1, #3fb2b4)"
          : "rgba(255,255,255,0.04)",
        color: active ? "#052b2c" : "#9aa6b4",
        border: `1px solid ${active ? "transparent" : "rgba(255,255,255,0.1)"}`,
      }}
    >
      {children}
    </button>
  );
}
