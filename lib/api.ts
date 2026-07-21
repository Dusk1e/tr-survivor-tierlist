"use client";

import { CLOUD_ENABLED } from "./config";
import { SEED_MICE, SEED_VOTES } from "./seed";
import { aggregateVotes } from "./aggregate";
import { sanitizeScores } from "./dims";
import { sanitizePerms } from "./perms";
import {
  Mouse,
  MouseInput,
  MyVote,
  PermId,
  Scores,
  Session,
  Vote,
  VoteAgg,
  VoteStatus,
} from "./types";

/**
 * Unified client data layer. Cloud mode (Supabase env present) talks to the
 * API routes so EVERYONE sees the same data; Local mode keeps everything in
 * this browser's localStorage (demo).
 */

const LS_MICE = "tst_mice_v5";
const LS_VOTES = "tst_votes_v7";
const LS_SESSION = "tst_session_v3";
const LS_AUTH = "tst_authorities_v2";

const DEFAULT_AUTHORITIES = ["Alwesh", "Blacklean"];

export const isCloud = CLOUD_ENABLED;

export const DATA_EVENT = "tst-data-changed";

export function pingDataChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(DATA_EVENT));
}

/**
 * Önbelleğe takılmayan GET. URL'e benzersiz bir damga eklenir ve tarayıcıya
 * no-store denir; böylece hiçbir katman (tarayıcı, CDN, Vercel) eski yanıtı
 * geri veremez. Onaylanan oyların/yetkili değişikliklerinin anında görünmesi
 * için şart.
 */
async function getFresh(path: string): Promise<Response> {
  const sep = path.includes("?") ? "&" : "?";
  return fetch(`${path}${sep}_=${Date.now()}`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
}

/* ============================ localStorage io =========================== */

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function lsLoadMice(): Mouse[] {
  if (typeof window === "undefined") return SEED_MICE;
  const raw = window.localStorage.getItem(LS_MICE);
  if (raw === null) {
    lsSet(LS_MICE, SEED_MICE);
    return [...SEED_MICE];
  }
  try {
    const parsed = JSON.parse(raw) as Mouse[];
    return Array.isArray(parsed) ? parsed : [...SEED_MICE];
  } catch {
    return [...SEED_MICE];
  }
}

function lsLoadVotes(): Vote[] {
  if (typeof window === "undefined") return SEED_VOTES;
  const raw = window.localStorage.getItem(LS_VOTES);
  if (raw === null) {
    lsSet(LS_VOTES, SEED_VOTES);
    return [...SEED_VOTES];
  }
  try {
    const parsed = JSON.parse(raw) as Vote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `m_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function nextSort(mice: Mouse[], tier: string): number {
  const inTier = mice.filter((m) => m.tier === tier);
  return inTier.length ? Math.max(...inTier.map((m) => m.sort ?? 0)) + 1 : 0;
}

function loginName(m: Mouse): string {
  return (m.username || m.nickname || "").trim().toLowerCase();
}

/* ================================ mice ================================== */

/** Public roster (passwords stripped in cloud mode unless authorized). */
export async function getMice(withPasswords = false): Promise<Mouse[]> {
  if (isCloud) {
    const url = withPasswords ? "/api/mice?full=1" : "/api/mice";
    const res = await getFresh(url);
    if (!res.ok) throw new Error("Liste yüklenemedi");
    return (await res.json()) as Mouse[];
  }
  return lsLoadMice();
}

export async function addMouse(input: MouseInput): Promise<Mouse> {
  if (isCloud) {
    const res = await fetch("/api/mice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error((await safeMsg(res)) || "Ekleme başarısız");
    return (await res.json()) as Mouse;
  }
  const mice = lsLoadMice();
  const uname = (input.username || input.nickname).trim().toLowerCase();
  if (uname && mice.some((x) => loginName(x) === uname)) {
    throw new Error("Bu kullanıcı adı zaten kullanımda.");
  }
  const mouse: Mouse = {
    id: newId(),
    ...input,
    username: (input.username || input.nickname).trim(),
    permissions: sanitizePerms(input.permissions),
    epoch: 0,
    sort: input.sort ?? nextSort(mice, input.tier),
    created_at: new Date().toISOString(),
  };
  lsSet(LS_MICE, [...mice, mouse]);
  pingDataChanged();
  return mouse;
}

export async function editMouse(
  id: string,
  patch: Partial<MouseInput>
): Promise<Mouse> {
  if (isCloud) {
    const res = await fetch(`/api/mice/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error((await safeMsg(res)) || "Güncelleme başarısız");
    return (await res.json()) as Mouse;
  }
  const mice = lsLoadMice();
  const idx = mice.findIndex((m) => m.id === id);
  if (idx === -1) throw new Error("Fare bulunamadı");

  if (patch.username !== undefined || patch.nickname !== undefined) {
    const uname = (
      patch.username ??
      mice[idx].username ??
      patch.nickname ??
      mice[idx].nickname
    )
      .trim()
      .toLowerCase();
    if (uname && mice.some((x) => x.id !== id && loginName(x) === uname)) {
      throw new Error("Bu kullanıcı adı zaten kullanımda.");
    }
  }

  // Security-relevant changes invalidate the mouse's sessions.
  const bump =
    patch.password !== undefined || patch.permissions !== undefined;
  const updated: Mouse = {
    ...mice[idx],
    ...patch,
    permissions:
      patch.permissions !== undefined
        ? sanitizePerms(patch.permissions)
        : mice[idx].permissions ?? [],
    epoch: (mice[idx].epoch ?? 0) + (bump ? 1 : 0),
  };
  mice[idx] = updated;
  lsSet(LS_MICE, mice);
  pingDataChanged();
  return updated;
}

export async function removeMouse(id: string): Promise<void> {
  if (isCloud) {
    const res = await fetch(`/api/mice/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error((await safeMsg(res)) || "Silme başarısız");
    return;
  }
  lsSet(LS_MICE, lsLoadMice().filter((m) => m.id !== id));
  lsSet(
    LS_VOTES,
    lsLoadVotes().filter((v) => v.voter_id !== id && v.target_id !== id)
  );
  const s = lsGet<Session | null>(LS_SESSION, null);
  if (s?.mouseId === id && typeof window !== "undefined") {
    window.localStorage.removeItem(LS_SESSION);
  }
  pingDataChanged();
}

/** Admin: grant/revoke staff permissions (bumps epoch → forces re-login). */
export async function savePermissions(
  mouseId: string,
  permissions: PermId[]
): Promise<void> {
  await editMouse(mouseId, { permissions } as Partial<MouseInput>);
}

/* =============================== session ================================ */

/**
 * Current mouse session. Validates the epoch against the roster —
 * if permissions/password changed since login, the session dies.
 */
export async function getSession(): Promise<Session | null> {
  if (isCloud) {
    try {
      const res = await getFresh("/api/mouse/me");
      if (!res.ok) return null;
      const j = await res.json();
      return (j?.session as Session) ?? null;
    } catch {
      return null;
    }
  }
  const s = lsGet<Session | null>(LS_SESSION, null);
  if (!s) return null;
  const m = lsLoadMice().find((x) => x.id === s.mouseId);
  if (!m || (m.epoch ?? 0) !== (s.epoch ?? 0)) {
    if (typeof window !== "undefined")
      window.localStorage.removeItem(LS_SESSION);
    return null;
  }
  // permissions always fresh from the roster
  return { ...s, permissions: m.permissions ?? [] };
}

export async function mouseLogin(
  username: string,
  password: string
): Promise<Session> {
  if (isCloud) {
    const res = await fetch("/api/mouse/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error((await safeMsg(res)) || "Giriş başarısız");
    return (await res.json()) as Session;
  }
  const uname = username.trim().toLowerCase();
  const mice = lsLoadMice();
  const found = mice.find(
    (m) => loginName(m) === uname && (m.password ?? "") === password
  );
  if (!found) throw new Error("Şifre hatalı.");
  const session: Session = {
    mouseId: found.id,
    nickname: found.nickname,
    epoch: found.epoch ?? 0,
    permissions: found.permissions ?? [],
  };
  lsSet(LS_SESSION, session);
  return session;
}

export async function mouseLogout(): Promise<void> {
  if (isCloud) {
    try {
      await fetch("/api/mouse/logout", { method: "POST" });
    } catch {}
    return;
  }
  if (typeof window !== "undefined") window.localStorage.removeItem(LS_SESSION);
}

/* ================================ votes ================================= */

export interface VoteState {
  agg: VoteAgg;
  mine: Record<string, MyVote>;
  totalApproved: number;
}

/** Public aggregates (approved-only, weighted) + the session's own votes. */
export async function getVoteState(
  session: Session | null
): Promise<VoteState> {
  if (isCloud) {
    try {
      const res = await getFresh("/api/votes");
      if (!res.ok) return { agg: {}, mine: {}, totalApproved: 0 };
      return (await res.json()) as VoteState;
    } catch {
      return { agg: {}, mine: {}, totalApproved: 0 };
    }
  }
  const votes = lsLoadVotes();
  const mice = lsLoadMice();
  const agg = aggregateVotes(votes, mice);
  const mine: Record<string, MyVote> = {};
  if (session) {
    for (const v of votes) {
      if (v.voter_id === session.mouseId) {
        mine[v.target_id] = {
          status: v.status,
          scores: v.scores,
          hotkey: v.hotkey,
        };
      }
    }
  }
  const totalApproved = votes.filter((v) => v.status === "approved").length;
  return { agg, mine, totalApproved };
}

/**
 * Submit (or re-submit) a vote. Rules:
 *  - no self votes
 *  - an APPROVED vote is locked forever
 *  - pending votes can be updated until decided
 *  - a rejected vote can be re-submitted (goes back to pending)
 */
export async function submitVote(
  voter: Session,
  target: Mouse,
  scores: Scores,
  hotkey: boolean
): Promise<void> {
  if (voter.mouseId === target.id) throw new Error("Kendine puan veremezsin.");
  const clean = sanitizeScores(scores);
  if (!clean) throw new Error("Geçersiz puan.");

  if (isCloud) {
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: target.id, scores: clean, hotkey }),
    });
    if (!res.ok) throw new Error((await safeMsg(res)) || "Puan gönderilemedi");
    return;
  }

  const votes = lsLoadVotes();
  const idx = votes.findIndex(
    (v) => v.voter_id === voter.mouseId && v.target_id === target.id
  );
  if (idx >= 0 && votes[idx].status === "approved") {
    throw new Error("Onaylanmış puanın artık değiştirilemez.");
  }
  const record: Vote = {
    id: idx >= 0 ? votes[idx].id : newId(),
    voter_id: voter.mouseId,
    voter_nick: voter.nickname,
    target_id: target.id,
    target_nick: target.nickname,
    scores: clean,
    hotkey,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  if (idx >= 0) votes[idx] = record;
  else votes.push(record);
  lsSet(LS_VOTES, votes);
  pingDataChanged();
}

/** Full vote log — admin panel & staff with vote_log/vote_approve. */
export async function getVoteLog(): Promise<Vote[]> {
  if (isCloud) {
    const res = await getFresh("/api/admin/votes");
    if (!res.ok) throw new Error((await safeMsg(res)) || "Yetkisiz");
    return (await res.json()) as Vote[];
  }
  return lsLoadVotes().sort((a, b) =>
    (b.created_at ?? "").localeCompare(a.created_at ?? "")
  );
}

/** Approve / reject a pending vote. */
export async function decideVote(
  voteId: string,
  action: "approve" | "reject",
  decidedBy: string
): Promise<void> {
  if (isCloud) {
    const res = await fetch(`/api/votes/${voteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error((await safeMsg(res)) || "İşlem başarısız");
    return;
  }
  const votes = lsLoadVotes();
  const idx = votes.findIndex((v) => v.id === voteId);
  if (idx === -1) throw new Error("Kayıt bulunamadı");
  const status: VoteStatus = action === "approve" ? "approved" : "rejected";
  votes[idx] = {
    ...votes[idx],
    status,
    decided_at: new Date().toISOString(),
    decided_by: decidedBy,
  };
  lsSet(LS_VOTES, votes);
  pingDataChanged();
}

/* ============================= authorities ============================= */

export async function getAuthorities(): Promise<string[]> {
  if (isCloud) {
    try {
      const res = await getFresh("/api/authorities");
      if (res.ok) return (await res.json()) as string[];
    } catch {}
    return [];
  }
  const list = lsGet<string[]>(LS_AUTH, DEFAULT_AUTHORITIES);
  return Array.isArray(list) ? list : DEFAULT_AUTHORITIES;
}

export async function saveAuthorities(list: string[]): Promise<void> {
  if (isCloud) {
    const res = await fetch("/api/authorities", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ list }),
    });
    if (!res.ok) throw new Error((await safeMsg(res)) || "Yetkililer kaydedilemedi");
    return;
  }
  lsSet(LS_AUTH, list);
  pingDataChanged();
}

/* ================================ util ================================== */

async function safeMsg(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j?.error ?? "";
  } catch {
    return "";
  }
}
