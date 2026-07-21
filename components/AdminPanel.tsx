"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getVoteLog } from "@/lib/api";
import RosterManager from "./RosterManager";
import VoteApprovals from "./VoteApprovals";
import VoteLog from "./VoteLog";
import PermissionsPanel from "./PermissionsPanel";
import AdminAuthorities from "./AdminAuthorities";

type Toast = { id: number; text: string; kind: "ok" | "err" };
type Tab = "roster" | "approvals" | "log" | "perms" | "authorities";

/** Full admin dashboard (password-gated, unlisted URL). */
export default function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("roster");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const pushToast = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const refreshPending = useCallback(() => {
    getVoteLog()
      .then((all) =>
        setPendingCount(all.filter((v) => v.status === "pending").length)
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshPending();
    const t = window.setInterval(refreshPending, 30_000);
    return () => window.clearInterval(t);
  }, [refreshPending]);

  return (
    <div className="mx-auto w-full max-w-wide px-5 py-8 sm:px-8">
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
              <span
                className="font-display text-[10px] font-bold uppercase tracking-widest"
                style={{ color: t.kind === "ok" ? "#74d3d5" : "#f1979c" }}
              >
                Sistem
              </span>
              <div>{t.text}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <TabButton active={tab === "roster"} onClick={() => setTab("roster")}>
          Fareler
        </TabButton>
        <TabButton
          active={tab === "approvals"}
          onClick={() => {
            setTab("approvals");
            refreshPending();
          }}
        >
          Onaylar
          {pendingCount > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-400/20 px-2 py-0.5 font-display text-[10px] font-bold text-amber-300 tabular-nums">
              {pendingCount}
            </span>
          )}
        </TabButton>
        <TabButton active={tab === "log"} onClick={() => setTab("log")}>
          Kayıt Defteri
        </TabButton>
        <TabButton active={tab === "perms"} onClick={() => setTab("perms")}>
          Yetkiler
        </TabButton>
        <TabButton
          active={tab === "authorities"}
          onClick={() => setTab("authorities")}
        >
          Yetkili Listesi
        </TabButton>
      </div>

      {tab === "roster" && (
        <RosterManager
          caps={{
            canAdd: true,
            canTierEdit: true,
            canPwView: true,
            canPwEdit: true,
            canDelete: true,
          }}
          onToast={pushToast}
        />
      )}

      {tab === "approvals" && (
        <VoteApprovals deciderName="Admin" onChanged={refreshPending} />
      )}

      {tab === "log" && <VoteLog />}

      {tab === "perms" && <PermissionsPanel onToast={pushToast} />}

      {tab === "authorities" && <AdminAuthorities />}
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
      className="inline-flex items-center rounded-full px-4 py-2 font-display text-xs font-bold uppercase tracking-wider transition-all"
      style={{
        background: active
          ? "linear-gradient(180deg, #56cfd1, #3fb2b4)"
          : "rgba(255,255,255,0.04)",
        color: active ? "#052b2c" : "#9aa6b4",
        border: `1px solid ${active ? "transparent" : "rgba(255,255,255,0.1)"}`,
        boxShadow: active ? "0 6px 18px rgba(73,192,194,0.28)" : "none",
      }}
    >
      {children}
    </button>
  );
}
