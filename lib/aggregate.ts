import { DIM_IDS } from "./dims";
import { tierOf, weightOf } from "./tiers";
import { Mouse, Scores, TargetAgg, Vote, VoteAgg } from "./types";

/**
 * Oyların taban puana göre ne kadar etkili olduğunu belirleyen sönümleme.
 * Büyük olursa ilk oylar puanı az oynatır, küçük olursa çok oynatır.
 */
export const BASELINE_WEIGHT = 2;

/**
 * PUANLAMA MODELİ — "çıpa + fark"
 *
 *   Puan = bulunduğu tier'ın taban puanı + oyların kazandırdığı fark
 *
 * Taban puan bir ÇIPADIR. Her oy, verildiği andaki tabana göre "artı" ya da
 * "eksi" sayılır ve bu yorum sonradan DEĞİŞMEZ:
 *
 *   fark = Σ ağırlık × (oy − oyun verildiği andaki taban)
 *          ────────────────────────────────────────────
 *                 sönümleme + Σ ağırlık
 *
 * Böylece aynı sayı farklı tier'da farklı anlama gelir: Monarch'a (taban 89)
 * verilen 88 bir eksidir, M–S arasına (taban 84) verilen 88 bir artıdır.
 *
 * Hedef tier değiştirdiğinde eski oylar YENİDEN YORUMLANMAZ; sadece çıpa
 * kayar ve kazanılan fark aynen taşınır. Örnek: Monarch'ta 89 + 1.3 = 90.3
 * olan bir fare M–S arasına inince 84 + 1.3 = 85.3 olur — tam iki tabanın
 * farkı kadar düşer, hak ettiği +1.3'ü kaybetmez.
 *
 * Oy ağırlığı OYU VERENİN güncel konumundan gelir (üst tier daha ağır basar).
 * Taban puan, oy adedine (count) işlenmez.
 *
 * Bu fonksiyon hem tarayıcı (local mode) hem sunucu (cloud mode) tarafından
 * kullanılır — herkes her zaman aynı sayıyı görür.
 */
export function aggregateVotes(votes: Vote[], mice: Mouse[]): VoteAgg {
  const slotById: Record<string, string> = {};
  const tabanById: Record<string, number> = {};
  for (const m of mice) {
    slotById[m.id] = m.tier;
    tabanById[m.id] = tierOf(m.tier).baseline;
  }

  const acc: Record<
    string,
    {
      /** Σ ağırlık × (oy − o günkü taban), boyut başına */
      farkSums: Scores;
      /** sönümleme + Σ ağırlık */
      bolen: number;
      realW: number;
      count: number;
      hotkeyYesW: number;
      hotkeyYes: number;
      hotkeyNo: number;
    }
  > = {};

  for (const m of mice) {
    acc[m.id] = {
      farkSums: { fare_play: 0, saman_play: 0, ws_guven: 0 },
      bolen: BASELINE_WEIGHT,
      realW: 0,
      count: 0,
      hotkeyYesW: 0,
      hotkeyYes: 0,
      hotkeyNo: 0,
    };
  }

  for (const v of votes) {
    if (v.status !== "approved") continue;
    const a = acc[v.target_id];
    if (!a) continue; // silinmiş fare

    const w = weightOf(slotById[v.voter_id]);
    // Oyun kıyaslanacağı taban: verildiği anda dondurulmuş olan. Eski
    // kayıtlarda bu bilgi yok, o zaman hedefin güncel tabanı kullanılır.
    const oyTabani =
      typeof v.target_baseline === "number"
        ? v.target_baseline
        : tabanById[v.target_id] ?? 0;

    a.bolen += w;
    a.realW += w;
    a.count += 1;
    for (const d of DIM_IDS) {
      a.farkSums[d] += ((v.scores?.[d] ?? 0) - oyTabani) * w;
    }
    if (v.hotkey) {
      a.hotkeyYesW += w;
      a.hotkeyYes += 1;
    } else {
      a.hotkeyNo += 1;
    }
  }

  const out: VoteAgg = {};
  for (const [id, a] of Object.entries(acc)) {
    const cipa = tabanById[id] ?? 0;
    const avg = {} as Scores;
    for (const d of DIM_IDS) {
      const fark = a.bolen > 0 ? a.farkSums[d] / a.bolen : 0;
      // 0..100 dışına taşmasın: çok düşük oylar tabanı sıfırın altına itemez.
      avg[d] = Math.max(0, Math.min(100, cipa + fark));
    }
    const overall = DIM_IDS.reduce((n, d) => n + avg[d], 0) / DIM_IDS.length;

    out[id] = {
      count: a.count, // yalnızca gerçek onaylı oylar
      avg,
      overall,
      hotkeyYesPct: a.realW > 0 ? (a.hotkeyYesW / a.realW) * 100 : 0,
      hotkeyYes: a.hotkeyYes,
      hotkeyNo: a.hotkeyNo,
    };
  }
  return out;
}
