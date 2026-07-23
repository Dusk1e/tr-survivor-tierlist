export type TierId = "monarch" | "s" | "a" | "b" | "c" | "de";

/**
 * A mouse's placement. Either a main tier or the single "between" slot
 * ("monarch_s" = MONARCH ile S-RANK arası).
 */
/**
 * "monarch_respect": Monarch bandının sağ yarısı — uzun süredir aktif
 * olmayan efsaneler. Monarch ile BİREBİR aynı görünür (renk, boyut, rozet,
 * taban puan, oy ağırlığı); tek fark plakanın altındaki yazı.
 */
export type SlotId = TierId | "monarch_s" | "s_a" | "monarch_respect";

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
  /** Aşk Köşesi: eşinin id'si. Karşılıklıdır — iki kayıt da birbirini gösterir. */
  partner_id?: string | null;
  created_at?: string;
}

export type MouseInput = Omit<Mouse, "id" | "created_at">;

/** Sitenin en üstündeki "Son Dakika" kayan haber bandı. */
export interface TickerConfig {
  aktif: boolean;
  /** Notlar sırayla geçer, sonuncudan sonra başa döner. */
  notlar: string[];
  /**
   * Kayma hızı: 100 karakterlik yazının geçmesi kaç saniye sürsün.
   * Not eklendikçe toplam süre uzar, hız sabit kalır.
   */
  hiz: number;
  /** Eski tek metinli kayıtlar için — okurken notlar'a çevrilir. */
  metin?: string;
}

export const TICKER_VARSAYILAN: TickerConfig = {
  aktif: false,
  notlar: [],
  hiz: 40,
};

/** Site geneli görünürlük ayarları — admin panelinden yönetilir. */
export interface SiteConfig {
  /**
   * Monarch'ın sağ yarısı ("Uzun süredir aktif olmayan efsaneler").
   * Kapatılınca o yarı public sayfada hiç görünmez, Monarch tam genişlikte
   * tek bir bant olur. Varsayılan AÇIK — hiçbir şey kaybolmasın.
   */
  monarch2: boolean;
}

export const SITE_VARSAYILAN: SiteConfig = {
  monarch2: true,
};

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
  /**
   * Oy verildiği anda HEDEFİN tier taban puanı. Oy bu değere göre "artı"
   * ya da "eksi" sayılır ve bu yorum sonradan değişmez. Böylece hedef tier
   * değiştirdiğinde eski oylar yeniden yorumlanmaz; puan sadece yeni
   * çıpaya (yeni tabana) kayar, kazanılan fark korunur.
   * Eski kayıtlarda yoktur; o durumda hedefin güncel tabanı kullanılır.
   */
  target_baseline?: number | null;
  created_at: string;
  decided_at?: string;
  decided_by?: string;
}

export interface MyVote {
  id: string;
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
  /** Rozet şekli — varsayılan altıgen; Aşk Köşesi kalp çizer. */
  shape?: "hex" | "heart";
  /** 0..3 — visual intensity, higher tiers glow more */
  glow: number;
  /** Bu tier'ın başlangıç puanı (oy yokken gösterilen, oy geldikçe yumuşayan) */
  baseline: number;
  /** for between slots */
  upper?: TierId;
  lower?: TierId;
}
