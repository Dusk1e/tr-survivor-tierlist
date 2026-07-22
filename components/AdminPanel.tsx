"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  getVoteLog,
  oyYedegiBilgisi,
  purgeAllVotes,
  restoreVotes,
} from "@/lib/api";
import RosterManager from "./RosterManager";
import VoteApprovals from "./VoteApprovals";
import VoteLog from "./VoteLog";
import PermissionsPanel from "./PermissionsPanel";
import AdminAuthorities from "./AdminAuthorities";
import AdminCouples from "./AdminCouples";
import AdminTicker from "./AdminTicker";

type Toast = { id: number; text: string; kind: "ok" | "err" };
type Tab =
  | "roster"
  | "approvals"
  | "log"
  | "perms"
  | "authorities"
  | "couples"
  | "ticker";

/** Full admin dashboard (password-gated, unlisted URL). */
export default function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("roster");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const pushToast = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const refreshPending = useCallback(() => {
    getVoteLog()
      .then((all) => {
        setPendingCount(all.filter((v) => v.status === "pending").length);
        setTotalCount(all.length);
      })
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
        <TabButton active={tab === "couples"} onClick={() => setTab("couples")}>
          Aşk Köşesi
        </TabButton>
        <TabButton active={tab === "ticker"} onClick={() => setTab("ticker")}>
          TFM Bülteni
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
        <>
          <PurgeVotesBar
            toplam={totalCount}
            onDone={refreshPending}
            onToast={pushToast}
          />
          <VoteApprovals deciderName="Admin" onChanged={refreshPending} />
        </>
      )}

      {/* Silme yetkisi SADECE burada açık — yetkili paneli VoteLog'u
          canDelete geçmeden kullanır, orada "Sil" düğmesi görünmez. */}
      {tab === "log" && <VoteLog canDelete />}

      {tab === "perms" && <PermissionsPanel onToast={pushToast} />}

      {tab === "authorities" && <AdminAuthorities />}

      {tab === "couples" && <AdminCouples onToast={pushToast} />}

      {tab === "ticker" && <AdminTicker onToast={pushToast} />}
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

/**
 * Tüm oyları silme çubuğu — ÜÇ kademeli uyarı ister ve son adımda
 * onay kelimesinin yazılmasını şart koşar. Yanlışlıkla basılması imkânsız.
 */
const PURGE_WORD = "SIFIRLA";

function PurgeVotesBar({
  toplam,
  onDone,
  onToast,
}: {
  toplam: number;
  onDone: () => void;
  onToast: (msg: string, kind?: "ok" | "err") => void;
}) {
  const [adim, setAdim] = useState(0); // 0 = kapalı, 1-2 = uyarı, 3 = yazarak onay
  const [kelime, setKelime] = useState("");
  const [busy, setBusy] = useState(false);
  /** Son sıfırlamanın geri alınabilir yedeği (varsa). */
  const [yedek, setYedek] = useState<{ adet: number; zaman: string } | null>(
    null
  );

  const yedegiOku = useCallback(() => {
    oyYedegiBilgisi()
      .then(setYedek)
      .catch(() => setYedek(null));
  }, []);

  // Yedek başka bir oturumda alınmış olabilir; açılışta sunucudan sorulur.
  useEffect(() => {
    yedegiOku();
  }, [yedegiOku]);

  function iptal() {
    setAdim(0);
    setKelime("");
  }

  async function purge() {
    setBusy(true);
    try {
      const n = await purgeAllVotes();
      onToast(`${n} oy silindi. Yanlışlıkla olduysa hemen geri alabilirsin.`);
      iptal();
      yedegiOku();
      onDone();
    } catch (e: any) {
      onToast(e?.message ?? "Silinemedi", "err");
    } finally {
      setBusy(false);
    }
  }

  async function geriAl() {
    setBusy(true);
    try {
      const r = await restoreVotes();
      onToast(
        r.atlanan > 0
          ? `${r.geriYuklenen} oy geri yüklendi. ${r.atlanan} tanesi atlandı (fare silinmiş ya da yerine yeni oy verilmiş).`
          : `${r.geriYuklenen} oy geri yüklendi.`
      );
      setYedek(null);
      onDone();
    } catch (e: any) {
      onToast(e?.message ?? "Geri alınamadı", "err");
    } finally {
      setBusy(false);
    }
  }

  const yedekZamani = (() => {
    if (!yedek?.zaman) return "";
    try {
      return new Date(yedek.zaman).toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  })();

  return (
    <div className="glass mb-4 rounded-xl px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-system text-sm font-bold text-choco">
            Tüm oyları sil
          </div>
          <div className="text-xs font-medium text-choco/45">
            Bekleyen ve onaylanmış bütün puanlamaları kaldırır. Silmeden önce
            yedeklenir, yanlışlıkla olursa tek tıkla geri alınır.
          </div>
        </div>

        {adim === 0 && (
          <button
            onClick={() => setAdim(1)}
            className="btn-danger px-3 py-1.5 text-xs"
          >
            Oyları Sıfırla
          </button>
        )}

        {adim > 0 && (
          <button onClick={iptal} className="btn-ghost px-3 py-1.5 text-xs">
            Vazgeç
          </button>
        )}
      </div>

      {/* Geri alma — yedek varken görünür. Sıfırlamayı biri yanlışlıkla ya da
          kasten yaptıysa tek tıkla eski hâline döner. */}
      {yedek && yedek.adet > 0 && adim === 0 && (
        <div
          className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
          style={{
            borderColor: "rgba(90,208,106,0.4)",
            background: "rgba(90,208,106,0.08)",
          }}
        >
          <div>
            <div className="font-system text-sm font-bold text-green-300">
              Geri alınabilir sıfırlama var
            </div>
            <div className="text-xs font-medium text-choco/50">
              {yedek.adet} oy yedekte
              {yedekZamani ? ` · ${yedekZamani}` : ""} — geri alınca eski
              puanlar aynen döner.
            </div>
          </div>
          <button
            onClick={geriAl}
            disabled={busy}
            className="btn-primary shrink-0 px-4 py-1.5 text-xs disabled:opacity-50"
          >
            {busy ? "Geri alınıyor…" : "Sıfırlamayı Geri Al"}
          </button>
        </div>
      )}

      {adim > 0 && (
        <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3">
          {/* 1. uyarı */}
          {adim === 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-red-200">
                Uyarı 1/3 — Sitedeki <b>{toplam}</b> puanlamanın tamamı
                silinecek. Devam edilsin mi?
              </p>
              <button
                onClick={() => setAdim(2)}
                className="btn-danger shrink-0 px-3 py-1.5 text-xs"
              >
                Devam
              </button>
            </div>
          )}

          {/* 2. uyarı */}
          {adim === 2 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-red-200">
                Uyarı 2/3 — Herkesin puanı tier başlangıç değerine döner, oy
                geçmişi sıfırlanır. Yedek alınır ve <b>tek seferliğine</b>{" "}
                buradan geri alınabilir — ikinci bir sıfırlama eski yedeğin
                üstüne yazar.
              </p>
              <button
                onClick={() => setAdim(3)}
                className="btn-danger shrink-0 px-3 py-1.5 text-xs"
              >
                Anladım, devam
              </button>
            </div>
          )}

          {/* 3. uyarı — yazarak onay */}
          {adim === 3 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-red-200">
                Uyarı 3/3 — Son adım. Onaylamak için aşağıya{" "}
                <b>{PURGE_WORD}</b> yaz.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  autoFocus
                  className="field !w-48 py-1.5 text-sm font-mono tracking-widest"
                  value={kelime}
                  onChange={(e) => setKelime(e.target.value)}
                  placeholder={PURGE_WORD}
                />
                <button
                  onClick={purge}
                  disabled={busy || kelime.trim().toLocaleUpperCase("tr") !== PURGE_WORD}
                  className="btn-danger px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  {busy ? "Siliniyor…" : `${toplam} oyu kalıcı olarak sil`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
