"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DATA_EVENT,
  getMice,
  getSession,
  getVoteState,
  mouseLogin,
  mouseLogout,
  submitVote as apiSubmitVote,
} from "@/lib/api";
import {
  Mouse,
  MyVote,
  Scores,
  Session,
  TargetAgg,
} from "@/lib/types";
import MouseLoginModal from "./MouseLoginModal";
import MouseDetailModal from "./MouseDetailModal";

interface Ctx {
  ready: boolean;
  session: Session | null;
  mice: Mouse[];
  totalApproved: number;
  isMe: (id: string) => boolean;
  aggFor: (id: string) => TargetAgg | null;
  myVoteFor: (id: string) => MyVote | undefined;
  openDetail: (m: Mouse) => void;
  openLoginFor: (m: Mouse) => void;
  logout: () => void;
  submitVote: (
    target: Mouse,
    scores: Scores,
    hotkey: boolean
  ) => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionCtx = createContext<Ctx | null>(null);

export function useSession(): Ctx {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [mice, setMice] = useState<Mouse[]>([]);
  const [agg, setAgg] = useState<Record<string, TargetAgg>>({});
  const [mine, setMine] = useState<Record<string, MyVote>>({});
  const [totalApproved, setTotalApproved] = useState(0);
  const [detail, setDetail] = useState<Mouse | null>(null);
  const [loginFor, setLoginFor] = useState<Mouse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hadSession = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [miceData, sess] = await Promise.all([getMice(), getSession()]);
      // Session died (epoch bump / deletion) while we thought we were in.
      if (!sess && hadSession.current) {
        hadSession.current = false;
        await mouseLogout();
      }
      hadSession.current = !!sess;
      const votes = await getVoteState(sess);
      setMice(miceData);
      setSession(sess);
      setAgg(votes.agg);
      setMine(votes.mine);
      setTotalApproved(votes.totalApproved);
    } catch {
      /* keep last good state */
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    // Sekmeye dönüldüğünde anında tazele — bekleme olmasın.
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener(DATA_EVENT, onChange);
    window.addEventListener("storage", onChange);
    window.addEventListener("focus", onChange);
    document.addEventListener("visibilitychange", onVisible);
    // Yalnızca sekme görünürken yokla (arka planda boşuna istek atma).
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 12_000);
    return () => {
      window.removeEventListener(DATA_EVENT, onChange);
      window.removeEventListener("storage", onChange);
      window.removeEventListener("focus", onChange);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(t);
    };
  }, [refresh]);

  const isMe = useCallback(
    (id: string) => session?.mouseId === id,
    [session]
  );
  const aggFor = useCallback((id: string) => agg[id] ?? null, [agg]);
  const myVoteFor = useCallback((id: string) => mine[id], [mine]);

  const openDetail = useCallback((m: Mouse) => setDetail(m), []);
  const openLoginFor = useCallback((m: Mouse) => {
    setError(null);
    setLoginFor(m);
  }, []);

  const logout = useCallback(async () => {
    await mouseLogout();
    hadSession.current = false;
    setSession(null);
    await refresh();
  }, [refresh]);

  const doLogin = useCallback(
    async (password: string) => {
      if (!loginFor) return;
      setError(null);
      const s = await mouseLogin(loginFor.username || loginFor.nickname, password);
      hadSession.current = true;
      setSession(s);
      setLoginFor(null);
      await refresh();
    },
    [loginFor, refresh]
  );

  const submitVote = useCallback(
    async (target: Mouse, scores: Scores, hotkey: boolean) => {
      if (!session) throw new Error("Giriş gerekli");
      await apiSubmitVote(session, target, scores, hotkey);
      await refresh();
    },
    [session, refresh]
  );

  const value: Ctx = useMemo(
    () => ({
      ready,
      session,
      mice,
      totalApproved,
      isMe,
      aggFor,
      myVoteFor,
      openDetail,
      openLoginFor,
      logout,
      submitVote,
      refresh,
    }),
    [
      ready,
      session,
      mice,
      totalApproved,
      isMe,
      aggFor,
      myVoteFor,
      openDetail,
      openLoginFor,
      logout,
      submitVote,
      refresh,
    ]
  );

  return (
    <SessionCtx.Provider value={value}>
      {children}

      <MouseLoginModal
        mouse={loginFor}
        error={error}
        onClose={() => setLoginFor(null)}
        onSubmit={doLogin}
      />

      <MouseDetailModal
        mouse={detail}
        onClose={() => setDetail(null)}
      />
    </SessionCtx.Provider>
  );
}
