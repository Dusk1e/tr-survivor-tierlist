import { DIM_IDS } from "./dims";
import { tierOf, weightOf } from "./tiers";
import { Mouse, Scores, TargetAgg, Vote, VoteAgg } from "./types";

/**
 * Taban puanın ağırlığı. Her fare, bulunduğu tier'ın başlangıç puanıyla
 * işe başlar; gerçek oylar geldikçe bu taban yumuşayıp yerini topluluk
 * görüşüne bırakır (~3-4 onaylı oydan sonra topluluk baskın gelir).
 */
export const BASELINE_WEIGHT = 2;

/**
 * Hem tarayıcı (local mode) hem sunucu (cloud mode) tarafından kullanılan
 * saf toplama — herkes her zaman aynı sayıları görür.
 *
 * Sadece ONAYLI oylar sayılır. Her oy, oyu verenin GÜNCEL konumuna göre
 * ağırlıklanır. Taban puan sayıya (oy adedine) İŞLENMEZ.
 */
export function aggregateVotes(votes: Vote[], mice: Mouse[]): VoteAgg {
  const slotById: Record<string, string> = {};
  for (const m of mice) slotById[m.id] = m.tier;

  const acc: Record<
    string,
    {
      w: number; // taban dahil toplam ağırlık
      realW: number; // sadece gerçek oyların ağırlığı
      sums: Scores;
      count: number;
      hotkeyYesW: number;
      hotkeyYes: number;
      hotkeyNo: number;
    }
  > = {};

  // 1) Her fareyi tier'ının taban puanıyla başlat
  for (const m of mice) {
    const base = tierOf(m.tier).baseline;
    acc[m.id] = {
      w: BASELINE_WEIGHT,
      realW: 0,
      sums: {
        fare_play: base * BASELINE_WEIGHT,
        saman_play: base * BASELINE_WEIGHT,
        ws_guven: base * BASELINE_WEIGHT,
      },
      count: 0,
      hotkeyYesW: 0,
      hotkeyYes: 0,
      hotkeyNo: 0,
    };
  }

  // 2) Onaylı oyları ağırlıklı olarak ekle
  for (const v of votes) {
    if (v.status !== "approved") continue;
    const a = acc[v.target_id];
    if (!a) continue; // silinmiş fare
    const w = weightOf(slotById[v.voter_id]);
    a.w += w;
    a.realW += w;
    a.count += 1;
    for (const d of DIM_IDS) a.sums[d] += (v.scores?.[d] ?? 0) * w;
    if (v.hotkey) {
      a.hotkeyYesW += w;
      a.hotkeyYes += 1;
    } else {
      a.hotkeyNo += 1;
    }
  }

  const out: VoteAgg = {};
  for (const [id, a] of Object.entries(acc)) {
    const avg = {} as Scores;
    for (const d of DIM_IDS) avg[d] = a.w > 0 ? a.sums[d] / a.w : 0;
    const overall = DIM_IDS.reduce((n, d) => n + avg[d], 0) / DIM_IDS.length;
    const t: TargetAgg = {
      count: a.count, // yalnızca gerçek onaylı oylar
      avg,
      overall,
      // Hotkey yüzdesi sadece gerçek oylardan hesaplanır
      hotkeyYesPct: a.realW > 0 ? (a.hotkeyYesW / a.realW) * 100 : 0,
      hotkeyYes: a.hotkeyYes,
      hotkeyNo: a.hotkeyNo,
    };
    out[id] = t;
  }
  return out;
}
