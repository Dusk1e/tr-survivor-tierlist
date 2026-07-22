import "server-only";
import crypto from "crypto";
import { MICE_TABLE, supabaseService } from "./supabase";
import { Mouse, MouseInput, PermId, Scores, Vote, VoteStatus } from "./types";
import { SEED_MICE } from "./seed";
import { sanitizePerms } from "./perms";
import { tierOf } from "./tiers";

/**
 * Server-side data access (cloud mode). ALL access goes through the service
 * role — the tables have RLS enabled with no anon policies, so the anon key
 * can never read passwords or write anything directly.
 */

const VOTES_TABLE = "votes";
const AUTHORITIES_TABLE = "authorities";

function db() {
  const c = supabaseService();
  if (!c) throw new Error("Supabase service role yapılandırılmamış");
  return c;
}

function rowToMouse(r: any): Mouse {
  return {
    id: r.id,
    nickname: r.nickname ?? "",
    title: r.title ?? "",
    image_url: r.image_url ?? "",
    tier: r.tier ?? "de",
    sort: r.sort ?? 0,
    username: r.username ?? "",
    password: r.password ?? "",
    permissions: sanitizePerms(r.permissions),
    epoch: r.epoch ?? 0,
    partner_id: r.partner_id ?? null,
    created_at: r.created_at,
  };
}

/** partner_id sütunu yoksa ne yapılacağını açıkça söyleyen hata. */
function esHatasi(msg: string): Error {
  if (/partner_id/i.test(msg))
    return new Error(
      "Aşk Köşesi için veritabanı güncellemesi gerekiyor. Supabase → SQL Editor'de şunu çalıştır: " +
        "alter table public.mice add column if not exists partner_id uuid references public.mice(id) on delete set null;"
    );
  return new Error(msg);
}

export function stripPassword(m: Mouse): Mouse {
  return { ...m, password: "" };
}

/* ================================ mice ================================== */

export async function listMice(includePasswords: boolean): Promise<Mouse[]> {
  const c = db();
  const { data, error } = await c
    .from(MICE_TABLE)
    .select("*")
    .order("tier", { ascending: true })
    .order("sort", { ascending: true });
  if (error) throw new Error(error.message);

  let rows = (data ?? []).map(rowToMouse);

  // First run: seed an empty table so the site isn't blank.
  if (rows.length === 0) {
    const seedRows = SEED_MICE.map(({ id, created_at, ...rest }) => rest);
    const { data: seeded, error: seedErr } = await c
      .from(MICE_TABLE)
      .insert(seedRows)
      .select("*");
    if (!seedErr && seeded) rows = seeded.map(rowToMouse);
  }

  return includePasswords ? rows : rows.map(stripPassword);
}

export async function getMouse(id: string): Promise<Mouse | null> {
  // maybeSingle: 0 satır = null (hata değil). Gerçek hatalar artık yutulmuyor.
  const { data, error } = await db()
    .from(MICE_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Fare okunamadı: ${error.message}`);
  return data ? rowToMouse(data) : null;
}

export async function createMouse(input: MouseInput): Promise<Mouse> {
  const row = {
    id: crypto.randomUUID(),
    ...input,
    permissions: sanitizePerms(input.permissions),
    epoch: 0,
  };
  const { data, error } = await db()
    .from(MICE_TABLE)
    .insert(row)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return rowToMouse(data);
}

/** Patch a mouse. Password/permission changes bump epoch (forced re-login). */
export async function updateMouse(
  id: string,
  patch: Partial<MouseInput>
): Promise<Mouse> {
  const current = await getMouse(id);
  if (!current) throw new Error("Fare bulunamadı");

  const payload: Record<string, unknown> = { ...patch };
  if (patch.permissions !== undefined)
    payload.permissions = sanitizePerms(patch.permissions);

  // Epoch SADECE değer gerçekten değiştiyse artar. Eskiden alanın patch'te
  // bulunması yetiyordu; panel fareyi her kaydettiğinde (tier değişimi,
  // sürükleme, isim düzeltme) aynı şifre tekrar gönderildiği için epoch
  // artıyor ve o farenin açık oturumu düşüyordu — "otomatik atıyor".
  const pwChanged =
    patch.password !== undefined && patch.password !== (current.password ?? "");
  const permsChanged =
    patch.permissions !== undefined &&
    sanitizePerms(patch.permissions).slice().sort().join(",") !==
      (current.permissions ?? []).slice().sort().join(",");
  if (pwChanged || permsChanged) payload.epoch = (current.epoch ?? 0) + 1;

  const { data, error } = await db()
    .from(MICE_TABLE)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return rowToMouse(data);
}

export async function deleteMouse(id: string): Promise<void> {
  const { error } = await db().from(MICE_TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function findMouseByCredentials(
  username: string,
  password: string
): Promise<Mouse | null> {
  const uname = username.trim().toLowerCase();
  const { data, error } = await db().from(MICE_TABLE).select("*");
  if (error) throw new Error(`Fareler okunamadı: ${error.message}`);
  const rows = (data ?? []).map(rowToMouse);

  // Giriş HEM kullanıcı adı HEM nick ile kabul edilir. Eskiden sadece
  // "username || nickname" karşılaştırılıyordu; panelden nick değiştirilip
  // (Alwesh -> Alwesh#0000) kullanıcı adı eski kalınca hesap kilitleniyordu.
  const adlari = (m: Mouse) =>
    [m.username, m.nickname]
      .map((s) => (s ?? "").trim().toLowerCase())
      .filter(Boolean);

  return (
    rows.find(
      (m) => adlari(m).includes(uname) && (m.password ?? "") === password
    ) ?? null
  );
}

/* ================================ votes ================================= */

function rowToVote(r: any): Vote {
  return {
    id: r.id,
    voter_id: r.voter_id,
    voter_nick: r.voter_nick ?? "",
    target_id: r.target_id,
    target_nick: r.target_nick ?? "",
    scores: {
      fare_play: r.fare_play ?? 0,
      saman_play: r.saman_play ?? 0,
      ws_guven: r.ws_guven ?? 0,
    },
    hotkey: !!r.hotkey,
    status: (r.status ?? "pending") as VoteStatus,
    target_baseline:
      typeof r.target_baseline === "number" ? r.target_baseline : null,
    created_at: r.created_at ?? "",
    decided_at: r.decided_at ?? undefined,
    decided_by: r.decided_by ?? undefined,
  };
}

export async function listVotes(): Promise<Vote[]> {
  const { data, error } = await db()
    .from(VOTES_TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToVote);
}

/** Submit/resubmit: approved votes are locked; others upsert to pending. */
export async function submitVote(
  voter: Mouse,
  targetId: string,
  scores: Scores,
  hotkey: boolean
): Promise<void> {
  const c = db();
  const target = await getMouse(targetId);
  if (!target) throw new Error("Hedef fare bulunamadı");

  const { data: existing } = await c
    .from(VOTES_TABLE)
    .select("*")
    .eq("voter_id", voter.id)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing && existing.status === "approved") {
    throw new Error("Onaylanmış puanın artık değiştirilemez.");
  }

  const temel = {
    voter_id: voter.id,
    voter_nick: voter.nickname,
    target_id: targetId,
    target_nick: target.nickname,
    fare_play: scores.fare_play,
    saman_play: scores.saman_play,
    ws_guven: scores.ws_guven,
    hotkey,
    status: "pending",
    decided_at: null,
    decided_by: null,
  };

  // Oyun "artı mı eksi mi" olduğu bu değere göre belirlenir ve bir daha
  // değişmez. Hedef sonradan tier değiştirse bile oy yeniden yorumlanmaz.
  const row = { ...temel, target_baseline: tierOf(target.tier).baseline };

  const yaz = (veri: Record<string, unknown>) =>
    existing
      ? c.from(VOTES_TABLE).update(veri).eq("id", existing.id)
      : c.from(VOTES_TABLE).insert({ id: crypto.randomUUID(), ...veri });

  const { error } = await yaz(row);
  if (!error) return;

  // target_baseline sütunu henüz eklenmemişse oy verme TAMAMEN kilitlenmesin:
  // sütunsuz tekrar dene. Bu durumda oy, eski davranışla (hedefin güncel
  // tabanına göre) değerlendirilir; SQL çalıştırılınca yeni oylar tabanını
  // kaydetmeye başlar.
  if (/target_baseline/i.test(error.message)) {
    const { error: ikinci } = await yaz(temel);
    if (!ikinci) return;
    throw new Error(ikinci.message);
  }

  throw new Error(error.message);
}

export async function decideVote(
  voteId: string,
  action: "approve" | "reject",
  decidedBy: string
): Promise<void> {
  const { error } = await db()
    .from(VOTES_TABLE)
    .update({
      status: action === "approve" ? "approved" : "rejected",
      decided_at: new Date().toISOString(),
      decided_by: decidedBy,
    })
    .eq("id", voteId);
  if (error) throw new Error(error.message);
}

/* =============================== ayarlar ================================ */

const SETTINGS_TABLE = "settings";

/** settings tablosu yoksa ne yapılacağını açıkça söyleyen hata. */
function ayarHatasi(msg: string): Error {
  if (/settings/i.test(msg) && /(exist|relation|schema|bulunam)/i.test(msg))
    return new Error(
      "Son Dakika bandı için veritabanı güncellemesi gerekiyor. Supabase → SQL Editor: " +
        "create table if not exists public.settings (key text primary key, value text not null default ''); " +
        "alter table public.settings enable row level security;"
    );
  return new Error(msg);
}

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await db()
    .from(SETTINGS_TABLE)
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw ayarHatasi(error.message);
  return (data as { value: string } | null)?.value ?? null;
}

/**
 * Ayar yazar. upsert(onConflict) KULLANMAZ: tabloda "key" üzerinde tekil
 * kısıt yoksa upsert hata verir ve kayıt sessizce düşer. Bunun yerine önce
 * bakar, varsa günceller, yoksa ekler — kısıt olsa da olmasa da çalışır.
 * (Yetkili listesinde de aynı dersi almıştık.)
 */
export async function setSetting(key: string, value: string): Promise<void> {
  const c = db();

  const mevcut = await c
    .from(SETTINGS_TABLE)
    .select("key")
    .eq("key", key)
    .maybeSingle();
  if (mevcut.error) throw ayarHatasi(mevcut.error.message);

  if (mevcut.data) {
    const { error } = await c
      .from(SETTINGS_TABLE)
      .update({ value })
      .eq("key", key);
    if (error) throw ayarHatasi(error.message);
  } else {
    const { error } = await c.from(SETTINGS_TABLE).insert([{ key, value }]);
    if (error) throw ayarHatasi(error.message);
  }

  // Gerçekten yazıldı mı? Sessiz başarısızlığa izin verme.
  const dogrula = await c
    .from(SETTINGS_TABLE)
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (dogrula.error) throw ayarHatasi(dogrula.error.message);
  if (!dogrula.data || (dogrula.data as { value: string }).value !== value)
    throw new Error(
      "Kayıt veritabanına yazılamadı (yazma sonrası doğrulama başarısız). " +
        "settings tablosunun izinlerini kontrol et."
    );
}

/* ============================== aşk köşesi ============================== */

/** Eşi varsa bağı iki taraftan da koparır. */
export async function clearCouple(id: string): Promise<void> {
  const c = db();
  const m = await getMouse(id);
  if (!m) return;

  const eski = m.partner_id ?? null;
  const a = await c.from(MICE_TABLE).update({ partner_id: null }).eq("id", id);
  if (a.error) throw esHatasi(a.error.message);

  if (eski) {
    const b = await c
      .from(MICE_TABLE)
      .update({ partner_id: null })
      .eq("id", eski);
    if (b.error) throw esHatasi(b.error.message);
  }
}

/**
 * İki fareyi çift yapar. Bağ KARŞILIKLIDIR — iki kayıt da birbirini gösterir.
 * Varsa eski eşler önce serbest bırakılır, yani kimse iki ilişkide kalmaz.
 * `tasi` true ise ikisi de Aşk Köşesi'ne (de) alınır.
 */
export async function setCouple(
  aId: string,
  bId: string,
  tasi = true
): Promise<void> {
  if (!aId || !bId) throw new Error("İki fare de seçilmeli");
  if (aId === bId) throw new Error("Bir fare kendisiyle eşleştirilemez");

  const [a, b] = await Promise.all([getMouse(aId), getMouse(bId)]);
  if (!a || !b) throw new Error("Fare bulunamadı");

  await clearCouple(aId);
  await clearCouple(bId);

  const c = db();
  const yama = (partner: string) =>
    tasi ? { partner_id: partner, tier: "de" } : { partner_id: partner };

  const r1 = await c.from(MICE_TABLE).update(yama(bId)).eq("id", aId);
  if (r1.error) throw esHatasi(r1.error.message);

  const r2 = await c.from(MICE_TABLE).update(yama(aId)).eq("id", bId);
  if (r2.error) throw esHatasi(r2.error.message);
}

/* ============================= authorities ============================= */

export async function listAuthorities(): Promise<string[]> {
  // NOT: Sıralamayı Postgres'e YAPTIRMIYORUZ. `.order("name")` bu tabloda
  // sessizce hata döndürüyordu; hata yutulunca liste boş görünüyor ve
  // "eklendi, sonra silindi" gibi algılanıyordu. Sıralama artık JS tarafında,
  // Türkçe alfabeye göre yapılıyor.
  const { data, error } = await db().from(AUTHORITIES_TABLE).select("name");
  if (error) throw new Error(`Yetkililer okunamadı: ${error.message}`);
  return ((data ?? []) as { name: string }[])
    .map((r) => (r?.name ?? "").trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "tr"));
}

/**
 * Son yetkili işleminin izi — teşhis için. /api/health içinde görünür.
 * Sunucu belleğinde tutulur, kalıcı değildir, gizli bilgi içermez.
 */
export const authorityDebug: { son: unknown } = { son: null };

/**
 * TEK isim ekler ve güncel listeyi döner.
 *
 * ÖNEMLİ: Burada "listede olmayanı sil" mantığı YOKTUR. Eski tasarım panelden
 * tüm listeyi alıp eksikleri siliyordu; panelin listesi bir an için eksik
 * olduğunda (yavaş okuma, yarış durumu, eski sekme) yeni eklenen isim
 * saniyeler içinde kendi kendine siliniyordu. Artık ekleme sadece ekler.
 */
export async function addAuthority(name: string): Promise<string[]> {
  const clean = name.trim().slice(0, 30);
  if (!clean) throw new Error("İsim boş olamaz");

  const { error } = await db()
    .from(AUTHORITIES_TABLE)
    .upsert([{ name: clean }], { onConflict: "name" });
  if (error) throw new Error(`"${clean}" eklenemedi: ${error.message}`);

  const list = await listAuthorities();
  authorityDebug.son = { islem: "ekle", isim: clean, sonucListe: list };
  return list;
}

/** TEK isim siler ve güncel listeyi döner. */
export async function removeAuthority(name: string): Promise<string[]> {
  const clean = name.trim();
  if (!clean) throw new Error("İsim boş olamaz");

  const { error } = await db()
    .from(AUTHORITIES_TABLE)
    .delete()
    .eq("name", clean);
  if (error) throw new Error(`"${clean}" silinemedi: ${error.message}`);

  const list = await listAuthorities();
  authorityDebug.son = { islem: "sil", isim: clean, sonucListe: list };
  return list;
}

/* ============================ oy bakımı ================================= */

/** Bir oyu tamamen kaldırır (sahibi iptal ederse ya da admin temizlerse). */
export async function deleteVote(voteId: string): Promise<void> {
  const { error } = await db().from(VOTES_TABLE).delete().eq("id", voteId);
  if (error) throw new Error(error.message);
}

/** Tek bir oyu getirir (sahiplik kontrolü için). */
export async function getVote(voteId: string): Promise<Vote | null> {
  const { data } = await db()
    .from(VOTES_TABLE)
    .select("*")
    .eq("id", voteId)
    .maybeSingle();
  return data ? rowToVote(data) : null;
}

/** TÜM oyları siler (admin: sıfırlama). */
/* --------------------- oyları sıfırlama ve geri alma -------------------- */

/** Son sıfırlamanın yedeği bu anahtarda saklanır (settings tablosu). */
const OY_YEDEK_ANAHTARI = "oy_yedegi";

/** Yedek çok şişmesin — bunun üstü zaten tek tıkla geri alınacak bir şey değil. */
const YEDEK_UST_SINIR = 5000;

interface OyYedegi {
  zaman: string;
  satirlar: Record<string, unknown>[];
}

/**
 * TÜM oyları siler — ama ÖNCE yedekler. Yedek alınamazsa silme yapılmaz;
 * geri dönüşü olmayan bir işlemi yedeksiz yapmak doğru olmaz.
 * Yedek yalnızca son sıfırlamayı tutar.
 */
export async function purgeVotes(): Promise<number> {
  const c = db();

  const { data, error: okuHata } = await c.from(VOTES_TABLE).select("*");
  if (okuHata) throw new Error(`Oylar okunamadı: ${okuHata.message}`);
  const satirlar = (data ?? []) as Record<string, unknown>[];

  // Silinecek bir şey yoksa YEDEĞE DOKUNMA. Aksi hâlde biri sıfırlama
  // düğmesine iki kez basınca ikinci basış yedeği boş listeyle ezer ve
  // ilk sıfırlama geri alınamaz hâle gelirdi.
  if (satirlar.length === 0) return 0;

  if (satirlar.length > YEDEK_UST_SINIR)
    throw new Error(
      `Çok fazla oy var (${satirlar.length}). Güvenli yedek alınamadığı için sıfırlama durduruldu.`
    );

  const yedek: OyYedegi = { zaman: new Date().toISOString(), satirlar };
  try {
    await setSetting(OY_YEDEK_ANAHTARI, JSON.stringify(yedek));
  } catch (e: any) {
    throw new Error(
      `Yedek alınamadığı için sıfırlama yapılmadı: ${e?.message ?? "bilinmeyen hata"}`
    );
  }

  const { error } = await c.from(VOTES_TABLE).delete().not("id", "is", null);
  if (error) throw new Error(error.message);
  return satirlar.length;
}

/** Yedek var mı, kaç oy ve ne zaman alınmış? */
export async function oyYedegiBilgisi(): Promise<{
  adet: number;
  zaman: string;
} | null> {
  let ham: string | null = null;
  try {
    ham = await getSetting(OY_YEDEK_ANAHTARI);
  } catch {
    return null; // settings tablosu yoksa geri alma da yok
  }
  if (!ham) return null;
  try {
    const y = JSON.parse(ham) as OyYedegi;
    if (!Array.isArray(y?.satirlar)) return null;
    return { adet: y.satirlar.length, zaman: y.zaman ?? "" };
  } catch {
    return null;
  }
}

/**
 * Son sıfırlamayı geri alır. Araya girmiş durumlara dayanıklıdır:
 *  - Silinmiş fareye ait oylar atlanır (yabancı anahtar hatası vermesin)
 *  - Sıfırlamadan sonra yeniden verilmiş oylar korunur, üzerine yazılmaz
 *    (voter_id + target_id tekil kısıtı)
 * Başarılı olursa yedek temizlenir; iki kez geri alma olmaz.
 */
export async function restoreVotes(): Promise<{
  geriYuklenen: number;
  atlanan: number;
}> {
  const c = db();

  const ham = await getSetting(OY_YEDEK_ANAHTARI);
  if (!ham) throw new Error("Geri alınacak bir yedek yok.");

  let yedek: OyYedegi;
  try {
    yedek = JSON.parse(ham) as OyYedegi;
  } catch {
    throw new Error("Yedek okunamadı (bozuk kayıt).");
  }
  const satirlar = Array.isArray(yedek?.satirlar) ? yedek.satirlar : [];
  if (satirlar.length === 0) throw new Error("Yedek boş.");

  // Hâlâ var olan fareler
  const { data: fareler, error: fareHata } = await c
    .from(MICE_TABLE)
    .select("id");
  if (fareHata) throw new Error(`Fareler okunamadı: ${fareHata.message}`);
  const mevcutFare = new Set((fareler ?? []).map((r: any) => r.id));

  // Sıfırlamadan sonra verilmiş oylar
  const { data: simdiki, error: oyHata } = await c
    .from(VOTES_TABLE)
    .select("voter_id,target_id");
  if (oyHata) throw new Error(`Mevcut oylar okunamadı: ${oyHata.message}`);
  const dolu = new Set(
    (simdiki ?? []).map((r: any) => `${r.voter_id}|${r.target_id}`)
  );

  const yuklenecek = satirlar.filter((r) => {
    const v = r.voter_id as string;
    const t = r.target_id as string;
    if (!mevcutFare.has(v) || !mevcutFare.has(t)) return false;
    return !dolu.has(`${v}|${t}`);
  });
  const atlanan = satirlar.length - yuklenecek.length;

  // Tek seferde binlerce satır göndermek istek boyutunu şişirir; parçala.
  let yuklenen = 0;
  for (let i = 0; i < yuklenecek.length; i += 400) {
    const parca = yuklenecek.slice(i, i + 400);
    const { error } = await c.from(VOTES_TABLE).insert(parca);
    if (error)
      throw new Error(
        yuklenen > 0
          ? `${yuklenen} oy geri yüklendi, gerisi yüklenemedi: ${error.message}. Yedek duruyor, tekrar deneyebilirsin.`
          : `Geri yüklenemedi: ${error.message}`
      );
    yuklenen += parca.length;
  }

  // Tek kullanımlık: geri alındıktan sonra yedek silinir. Yedeği temizlerken
  // bir aksilik olursa geri yükleme yine de başarılı sayılır (oylar yerinde);
  // ikinci bir geri alma denemesi zaten hepsini "atlanan" olarak görür.
  try {
    await setSetting(OY_YEDEK_ANAHTARI, "");
  } catch {
    /* yedek temizlenemedi — sorun değil */
  }

  return { geriYuklenen: yuklenen, atlanan };
}

/* ========================= permission helpers =========================== */

export async function mouseHasPerm(
  mouseId: string,
  epoch: number,
  perm: PermId
): Promise<Mouse | null> {
  const m = await getMouse(mouseId);
  if (!m) return null;
  if ((m.epoch ?? 0) !== epoch) return null; // stale session
  return m.permissions?.includes(perm) ? m : null;
}

/** Validate a mouse session (epoch must match). */
export async function validMouse(
  mouseId: string,
  epoch: number
): Promise<Mouse | null> {
  const m = await getMouse(mouseId);
  if (!m) return null;
  return (m.epoch ?? 0) === epoch ? m : null;
}
