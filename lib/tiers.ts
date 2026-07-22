import { SlotId, TierConfig, TierId } from "./types";

/**
 * Rank ladder. 6 main tiers + 5 "between" slots (e.g. S ile A arası).
 * `glow` (0..3) scales visual intensity — higher tiers look brighter/cooler.
 */
const MAIN: Omit<TierConfig, "kind">[] = [
  {
    id: "monarch",
    label: "MONARCH",
    subtitle: "Efsane",
    accent: "#e8b64c",
    accent2: "#b3822a",
    deep: "#f3cf7e",
    sigil: "M",
    glow: 3,
    baseline: 89,
  },
  {
    id: "s",
    label: "S-RANK",
    subtitle: "Elit",
    accent: "#a78bfa",
    accent2: "#7c5cf0",
    deep: "#c4b0fc",
    sigil: "S",
    glow: 2.4,
    baseline: 79,
  },
  {
    id: "a",
    label: "A-RANK",
    subtitle: "Usta",
    accent: "#4fb3e0",
    accent2: "#3689b3",
    deep: "#8ad2f2",
    sigil: "A",
    glow: 1.8,
    baseline: 73,
  },
  {
    id: "b",
    label: "B-RANK",
    subtitle: "Yetenekli",
    accent: "#45b6a4",
    accent2: "#338a7d",
    deep: "#7fd6c6",
    sigil: "B",
    glow: 1.2,
    baseline: 63,
  },
  {
    id: "c",
    label: "C-RANK",
    subtitle: "Azimli",
    accent: "#74b063",
    accent2: "#578a49",
    deep: "#a3d193",
    sigil: "C",
    glow: 0.7,
    baseline: 55,
  },
  {
    id: "de",
    label: "AŞK KÖŞESİ",
    subtitle: "Kalpler Burada",
    accent: "#f472b6",
    accent2: "#db2777",
    deep: "#fbcfe8",
    sigil: "",
    shape: "heart",
    glow: 1.6,
    baseline: 29,
  },
];

function between(upper: Omit<TierConfig, "kind">, lower: Omit<TierConfig, "kind">): TierConfig {
  return {
    id: `${upper.id}_${lower.id === "de" ? "de" : lower.id}` as SlotId,
    kind: "between",
    label: `${upper.label} – ${lower.label} ARASI`,
    subtitle: "Yükselişte",
    accent: upper.accent,
    accent2: lower.accent,
    deep: upper.deep,
    sigil: "◆",
    glow: (upper.glow + lower.glow) / 2,
    baseline: 84,
    upper: upper.id as TierId,
    lower: lower.id as TierId,
  };
}

/**
 * Merdiven, yukarıdan aşağıya. Tek ara bölge MONARCH ile S-RANK arasındadır;
 * diğer tier'lar arasında ara bölge yoktur.
 */
/**
 * Monarch bandının sağ yarısı. Monarch'ın BİREBİR kopyası — renk, rozet,
 * taban puan, parıltı, hepsi aynı. Tek fark plakanın altındaki yazı.
 */
const MONARCH_RESPECT_SUBTITLE = "Uzun süredir aktif olmayan efsaneler";

export const SLOTS: TierConfig[] = MAIN.flatMap((t, i) => {
  const main: TierConfig = { ...t, kind: "main" };
  if (t.id !== "monarch") return [main];

  const respect: TierConfig = {
    ...main,
    id: "monarch_respect" as SlotId,
    subtitle: MONARCH_RESPECT_SUBTITLE,
  };
  const next = MAIN[i + 1];
  return next ? [main, respect, between(t, next)] : [main, respect];
});

export const SLOT_MAP: Record<string, TierConfig> = SLOTS.reduce(
  (acc, s) => ({ ...acc, [s.id]: s }),
  {} as Record<string, TierConfig>
);

export const SLOT_IDS: SlotId[] = SLOTS.map((s) => s.id as SlotId);

/** Main tiers only (for badges etc.). */
export const TIERS: TierConfig[] = SLOTS.filter((s) => s.kind === "main");

export function tierOf(id: string): TierConfig {
  return SLOT_MAP[id] ?? SLOTS[SLOTS.length - 1];
}

/**
 * Vote weight by the VOTER's placement — higher-tier players' opinions
 * count a bit more (deliberately modest, not overwhelming).
 */
export const SLOT_WEIGHT: Record<SlotId, number> = {
  monarch: 1.8,
  // Saygı listesi — ağırlığı Monarch ile aynı, kırılmıyor.
  monarch_respect: 1.8,
  monarch_s: 1.65,
  s: 1.5,
  a: 1.3,
  b: 1.15,
  c: 1.0,
  de: 0.9,
};

export function weightOf(slot: string | undefined): number {
  return SLOT_WEIGHT[slot as SlotId] ?? 1;
}

/* ======================= puana göre tier rengi ========================== */

export interface PuanRengi {
  /** Ana renk — halka ve rakam. */
  ana: string;
  /** Varsa ikinci renk: iki renkli geçiş (M – S arası bandı). */
  ikinci?: string;
  /** Puanın hangi banda düştüğü — ipucu metninde kullanılır. */
  etiket: string;
}

/**
 * Puan halkasının rengi, puanın denk geldiği TIER'ın rengidir.
 * Böylece 90 puanlık bir fare Monarch altınıyla, 65 puanlık bir fare
 * B-Rank turkuazıyla parlar; renk tek başına sıralamayı anlatır.
 *
 * Tier renkleri (`deep` tonları) kullanılır — koyu zeminde daha okunur.
 * 55'in altı tier'lara denk gelmediği için uyarı renkleri: 30'a kadar
 * turuncu, 30'un altı kırmızı.
 */
const PUAN_BANTLARI: { esik: number; renk: PuanRengi }[] = [
  { esik: 89, renk: { ana: "#f3cf7e", etiket: "Monarch" } },
  { esik: 84, renk: { ana: "#f3cf7e", ikinci: "#c4b0fc", etiket: "M – S Arası" } },
  { esik: 79, renk: { ana: "#c4b0fc", etiket: "S-Rank" } },
  { esik: 73, renk: { ana: "#8ad2f2", etiket: "A-Rank" } },
  { esik: 63, renk: { ana: "#7fd6c6", etiket: "B-Rank" } },
  { esik: 55, renk: { ana: "#a3d193", etiket: "C-Rank" } },
  { esik: 30, renk: { ana: "#f0913c", etiket: "Gelişmeli" } },
  { esik: 0, renk: { ana: "#e5646b", etiket: "Düşük" } },
];

export function puanRengi(v: number): PuanRengi {
  const n = Math.max(0, Math.min(100, v));
  const bant = PUAN_BANTLARI.find((b) => n >= b.esik);
  return (bant ?? PUAN_BANTLARI[PUAN_BANTLARI.length - 1]).renk;
}
