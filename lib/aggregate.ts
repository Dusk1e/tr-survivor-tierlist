import { DIM_IDS } from "./dims";
import { weightOf } from "./tiers";
import { Mouse, Scores, TargetAgg, Vote, VoteAgg } from "./types";

/**
 * Hem tarayıcı (local mode) hem sunucu (cloud mode) tarafından kullanılan
 * saf toplama — herkes her zaman aynı sayıları görür.
 *
 * Sadece ONAYLI oylar sayılır. Her oy, oyu verenin GÜNCEL konumuna göre
 * ağırlıklanır (M-tier görüşü C-tier görüşünden biraz daha etkilidir).
 */
export function aggregateVotes(votes: Vote[], mice: Mouse[]): VoteAgg {
  const slotById: Record<string, string> = {};
  for (const m of mice) slotById[m.id] = m.tier;

  const acc: Record<
    string,
    {
      w: number;
      sums: Scores;
      count: number;
      hotkeyYesW: number;
      hotkeyYes: number;
      hotkeyNo: number;
    }
  > = {};

  for (const v of votes) {
    if (v.status !== "approved") continue;
    const w = weightOf(slotById[v.voter_id]);
    if (!acc[v.target_id]) {
      acc[v.target_id] = {
        w: 0,
        sums: { fare_play: 0, saman_play: 0, ws_guven: 0 },
        count: 0,
        hotkeyYesW: 0,
        hotkeyYes: 0,
        hotkeyNo: 0,
      };
    }
    const a = acc[v.target_id];
    a.w += w;
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
      count: a.count,
      avg,
      overall,
      hotkeyYesPct: a.w > 0 ? (a.hotkeyYesW / a.w) * 100 : 0,
      hotkeyYes: a.hotkeyYes,
      hotkeyNo: a.hotkeyNo,
    };
    out[id] = t;
  }
  return out;
}
