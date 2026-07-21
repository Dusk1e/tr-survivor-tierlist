import { DimId, Scores } from "./types";

/** Puanlanan üç kategori (0..100 slider). */
export const DIMS: { id: DimId; label: string; short: string }[] = [
  { id: "fare_play", label: "Fare Oynayışı", short: "Fare" },
  { id: "saman_play", label: "Şaman Oynayışı", short: "Şaman" },
  {
    id: "ws_guven",
    label: "WS Taşıyıcılığı & Yaşarken Verdiği Güven",
    short: "WS & Güven",
  },
];

export const DIM_IDS: DimId[] = DIMS.map((d) => d.id);

export const HOTKEY_QUESTION = "Hotkey kullandığını düşünüyor musun?";

export function defaultScores(): Scores {
  return { fare_play: 50, saman_play: 50, ws_guven: 50 };
}

/** % → bölge (etiket + renk). Puan gösterilen her yerde kullanılır. */
export function zoneOf(v: number): { label: string; color: string } {
  if (v >= 80) return { label: "Çok İyi", color: "#5ad06a" };
  if (v >= 60) return { label: "İyi", color: "#4fb3e0" };
  if (v >= 40) return { label: "Orta", color: "#e8b64c" };
  if (v >= 20) return { label: "Kötü", color: "#e08a3c" };
  return { label: "Çok Kötü", color: "#e5646b" };
}

export function scoreColor(v: number): string {
  return zoneOf(v).color;
}

export function clampScore(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function sanitizeScores(raw: any): Scores | null {
  if (!raw || typeof raw !== "object") return null;
  const out = {} as Scores;
  for (const id of DIM_IDS) {
    const n = Number((raw as any)[id]);
    if (!Number.isFinite(n)) return null;
    out[id] = clampScore(n);
  }
  return out;
}
