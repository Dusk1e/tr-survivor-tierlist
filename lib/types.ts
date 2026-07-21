export type TierId = "monarch" | "s" | "a" | "b" | "c" | "de";

/**
 * A mouse's placement. Either a main tier or the single "between" slot
 * ("monarch_s" = MONARCH ile S-RANK arası).
 */
export type SlotId = TierId | "monarch_s";

/**
 * Puanlanan beceriler (0..100). WS taşıyıcılığı + yaşıyorken güven TEK
 * kategoride birleşik. "Hotkey" ve "Hot" ayrı evet/hayır soruları.
 */
export type DimId = "fare_play" | "saman_play" | "ws_guven";
export type Scores = Record<DimId, number>;

/** Staff permissions grantable to a mouse account. */
export type PermId =
  | "tier_edit"
  | "pw_view"
  | "pw_edit"
  | "mouse_add"
  | "vote_approve"
  | "vote_log";

export interface Mouse {
  id: string;
  nickname: string;
  image_url: string;
  title: string;
  tier: SlotId;
  sort: number;
  username: string;
  password: string;
  /** staff permissions granted by the admin */
  permissions: PermId[];
  /** bumped when perms/password change -> forces re-login */
  epoch: number;
  created_at?: string;
}

export type MouseInput = Omit<Mouse, "id" | "created_at">;

export type VoteStatus = "pending" | "approved" | "rejected";

export interface Vote {
  id: string;
  voter_id: string;
  voter_nick: string;
  target_id: string;
  target_nick: string;
  scores: Scores; // 0..100 per dimension
  hotkey: boolean; // "Hotkey kullandığını düşünüyor musun?"
  status: VoteStatus;
  created_at: string;
  decided_at?: string;
  decided_by?: string;
}

export interface MyVote {
  status: VoteStatus;
  scores: Scores;
  hotkey: boolean;
}

/** Aggregated (approved-only, tier-weighted) result for one mouse. */
export interface TargetAgg {
  count: number; // approved vote count
  avg: Scores; // weighted average % per dimension
  overall: number; // mean of dimension averages
  hotkeyYesPct: number; // weighted % "Evet" (hotkey)
  hotkeyYes: number;
  hotkeyNo: number;
}

export type VoteAgg = Record<string, TargetAgg>;

export interface Session {
  mouseId: string;
  nickname: string;
  epoch: number;
  permissions: PermId[];
}

export interface TierConfig {
  id: SlotId;
  kind: "main" | "between";
  label: string;
  subtitle: string;
  accent: string;
  accent2: string;
  deep: string;
  sigil: string;
  /** 0..3 — visual intensity, higher tiers glow more */
  glow: number;
  /** for between slots */
  upper?: TierId;
  lower?: TierId;
}
