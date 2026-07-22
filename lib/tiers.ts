import { SlotId, TierConfig, TierId } from "./types";

/**
 * Rank ladder: 6 ana tier + 2 ara bölge (M – S, S – A) + Monarch'ın
 * saygı yarısı.
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
    baseline: 67,
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
    baseline: 60,
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
    baseline: 52,
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

function between(
  upper: Omit<TierConfig, "kind">,
  lower: Omit<TierConfig, "kind">,
  baseline: number
): TierConfig {
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
    baseline,
    upper: upper.id as TierId,
    lower: lower.id as TierId,
  };
}

/**
 * Merdiven, yukarıdan aşağıya. İki ara bölge vardır: MONARCH – S ve S – A.
 * Diğer tier'lar arasında ara bölge yoktur.
 */
/**
 * Monarch bandının sağ yarısı. Monarch'ın BİREBİR kopyası — renk, rozet,
 * taban puan, parıltı, hepsi aynı. Tek fark plakanın altındaki yazı.
 */
const MONARCH_RESPECT_SUBTITLE = "Uzun süredir aktif olmayan efsaneler";

/**
 * Ara bölgelerin taban puanları — üstündeki ve altındaki tier'ın tam ortası
 * değil, elle seçilmiş değerler. Merdiven yukarıdan aşağıya:
 *   89 · 84 · 79 · 73 · 67 · 60 · 52 · 29
 * Aralıklar aşağı indikçe genişler (5, 5, 6, 6, 7, 8, 23): üst basamaklar
 * birbirine yakın, alt basamaklar daha geniş — üstte fark etmek zor, altta
 * kolay olmalı.
 */
const ARA_TABAN: Record<string, number> = {
  monarch_s: 84,
  s_a: 73,
};

export const SLOTS: TierConfig[] = MAIN.flatMap((t, i) => {
  const main: TierConfig = { ...t, kind: "main" };
  const next = MAIN[i + 1];

  if (t.id === "monarch") {
    const respect: TierConfig = {
      ...main,
      id: "monarch_respect" as SlotId,
      subtitle: MONARCH_RESPECT_SUBTITLE,
    };
    return next
      ? [main, respect, between(t, next, ARA_TABAN.monarch_s)]
      : [main, respect];
  }

  if (t.id === "s" && next) {
    return [main, between(t, next, ARA_TABAN.s_a)];
  }

  return [main];
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
  s_a: 1.4,
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
  /** Halkanın ana rengi. */
  ana: string;
  /** Varsa ikinci renk: iki renkli geçiş (M – S arası bandı). */
  ikinci?: string;
  /**
   * Rakamın rengi. Sönük bantlarda halka rengi koyu zeminde zor okunuyor,
   * o yüzden rakam bir tık açık bir tonla yazılır. Yoksa `ana` kullanılır.
   */
  yazi?: string;
  /**
   * Parıltı gücü 0..1. Puan düştükçe azalır: renk "hangi tier" bilgisini,
   * parıltı da "ne kadar iyi" bilgisini taşır. İki sinyal aynı yöne bakar.
   */
  parilti: number;
  /** Puanın hangi banda düştüğü — ipucu metninde kullanılır. */
  etiket: string;
}

/**
 * Puan halkasının rengi, puanın denk geldiği SLOT'un rengidir. Eşikler
 * slot'ların taban puanlarıyla birebir aynıdır — yani 73 puan alan bir fare
 * "S – A arası" rengini alır, çünkü 73 o bölgenin taban puanıdır.
 *
 * İki ara bölge iki renklidir: M – S altından mora, S – A mordan maviye.
 * Taban puanların altına düşenler için uyarı renkleri: 30'a kadar turuncu,
 * 30'un altı kırmızı.
 *
 * Parıltı yukarıdan aşağıya söner; renk "hangi seviye", parıltı "ne kadar
 * iyi" bilgisini taşır.
 */
const PUAN_BANTLARI: { esik: number; renk: PuanRengi }[] = [
  { esik: 89, renk: { ana: "#ffd166", parilti: 1, etiket: "Monarch" } },
  {
    esik: 84,
    renk: {
      ana: "#ffd166",
      ikinci: "#b79bff",
      yazi: "#e3c5c9",
      parilti: 0.75,
      etiket: "M – S Arası",
    },
  },
  { esik: 79, renk: { ana: "#b79bff", parilti: 0.6, etiket: "S-Rank" } },
  {
    esik: 73,
    renk: {
      ana: "#b79bff",
      ikinci: "#5fb8ec",
      yazi: "#8eaaf4",
      parilti: 0.45,
      etiket: "S – A Arası",
    },
  },
  { esik: 67, renk: { ana: "#5fb8ec", parilti: 0.32, etiket: "A-Rank" } },
  { esik: 60, renk: { ana: "#3fbfa6", parilti: 0.16, etiket: "B-Rank" } },
  // Buradan aşağısı sönük: başarısızlık, başarıdan daha çok bağırmasın.
  { esik: 52, renk: { ana: "#77a458", yazi: "#93bf70", parilti: 0, etiket: "C-Rank" } },
  { esik: 30, renk: { ana: "#cf7628", yazi: "#e08b3d", parilti: 0, etiket: "Gelişmeli" } },
  { esik: 0, renk: { ana: "#b8474e", yazi: "#d05a61", parilti: 0, etiket: "Düşük" } },
];

export function puanRengi(v: number): PuanRengi {
  const n = Math.max(0, Math.min(100, v));
  const bant = PUAN_BANTLARI.find((b) => n >= b.esik);
  return (bant ?? PUAN_BANTLARI[PUAN_BANTLARI.length - 1]).renk;
}
