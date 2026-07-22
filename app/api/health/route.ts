import { NextResponse } from "next/server";
import { cloudConfigured, supabaseService, MICE_TABLE } from "@/lib/supabase";
import { authorityDebug } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Teşhis: sistemin gerçekte hangi durumda olduğunu söyler.
 * Tarayıcıda /api/health açılır. Gecikme/bağlantı sorunlarında ilk bakılacak yer.
 * Gizli bilgi döndürmez — sadece "var mı / kaç satır" bilgisi.
 */
export async function GET() {
  const now = new Date().toISOString();
  const info: Record<string, unknown> = {
    zaman: now,
    // Bu değer her istekte değişmeli. Değişmiyorsa yanıt ÖNBELLEKTEN geliyordur.
    damga: Date.now(),
    surum: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "yerel",
    ortam: process.env.VERCEL_ENV ?? "local",
    cloudAcik: cloudConfigured,
    servisAnahtariVar: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    adminSifresiVar: Boolean(process.env.ADMIN_PASSWORD),
    authSecretVar: Boolean(process.env.AUTH_SECRET),
  };

  const c = supabaseService();
  if (!c) {
    info.veritabani = "BAGLI DEGIL — SUPABASE_SERVICE_ROLE_KEY eksik veya hatali";
    return NextResponse.json(info, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const [mice, votes, approved, pending, auth] = await Promise.all([
      c.from(MICE_TABLE).select("id", { count: "exact", head: true }),
      c.from("votes").select("id", { count: "exact", head: true }),
      c.from("votes").select("id", { count: "exact", head: true }).eq("status", "approved"),
      c.from("votes").select("id", { count: "exact", head: true }).eq("status", "pending"),
      c.from("authorities").select("name", { count: "exact", head: true }),
    ]);

    const firstErr =
      mice.error || votes.error || approved.error || pending.error || auth.error;
    if (firstErr) {
      info.veritabani = "HATA";
      info.hata = firstErr.message;
    } else {
      info.veritabani = "BAGLI";
      info.sayilar = {
        fare: mice.count ?? 0,
        oy_toplam: votes.count ?? 0,
        oy_onayli: approved.count ?? 0,
        oy_bekleyen: pending.count ?? 0,
        yetkili: auth.count ?? 0,
      };

      // Sayım (HEAD) çalışıp gerçek okuma çalışmayabiliyor. Bu yüzden
      // yetkilileri GERÇEKTEN okuyup sonucu (ya da hatayı) buraya yazıyoruz.
      const real = await c.from("authorities").select("name");
      info.yetkililer = real.error
        ? { hata: real.error.message, kod: real.error.code ?? null }
        : ((real.data ?? []) as { name: string }[]).map((r) => r.name);
      info.sonYetkiliIslemi = authorityDebug.son;

      // Puanlama göçü: oylar kendi taban puanını saklayabiliyor mu?
      const oySutun = await c.from("votes").select("target_baseline").limit(1);
      info.oyTabaniSutunu = oySutun.error
        ? {
            durum: "YOK",
            etki:
              "Oy verme çalışır ama oylar eski mantıkla (hedefin güncel tabanına göre) değerlendirilir.",
            yapilacak:
              "Supabase → SQL Editor: alter table public.votes add column if not exists target_baseline integer;",
          }
        : { durum: "VAR" };

      // TFM Bülteni — settings tablosu gerçekte ne durumda?
      const ayar = await c.from("settings").select("key,value");
      if (ayar.error) {
        info.bulten = {
          tablo: "OKUNAMIYOR",
          hata: ayar.error.message,
          kod: ayar.error.code ?? null,
          yapilacak:
            "Supabase → SQL Editor: create table if not exists public.settings (key text primary key, value text not null default ''); alter table public.settings enable row level security;",
        };
      } else {
        const satirlar = (ayar.data ?? []) as { key: string; value: string }[];
        const t = satirlar.find((r) => r.key === "ticker");
        let cozulmus: unknown = null;
        try {
          cozulmus = t ? JSON.parse(t.value) : null;
        } catch {
          cozulmus = "JSON cozulemedi: " + (t?.value ?? "").slice(0, 120);
        }
        info.bulten = {
          tablo: "TAMAM",
          satirSayisi: satirlar.length,
          anahtarlar: satirlar.map((r) => r.key),
          tickerKaydi: cozulmus,
        };
      }

      // Hangi sorgu bicimi bu tabloda patliyor? (salt-okunur test)
      const [ordered, filtered] = await Promise.all([
        c.from("authorities").select("name").order("name"),
        c.from("authorities").select("name").in("name", ["Blacklean"]),
      ]);
      info.sorguTesti = {
        order: ordered.error ? `HATA: ${ordered.error.message}` : "calisiyor",
        inFiltresi: filtered.error
          ? `HATA: ${filtered.error.message}`
          : "calisiyor",
      };

      // Giris tanilama — sifre ICERIGI asla donmez, sadece "var mi" bilgisi.
      const roster = await c.from(MICE_TABLE).select("nickname,username,password");
      if (roster.error) {
        info.girisTanilama = { hata: roster.error.message };
      } else {
        const rows = (roster.data ?? []) as {
          nickname: string;
          username: string;
          password: string;
        }[];
        info.girisTanilama = {
          sifresiOlmayanFare: rows.filter((r) => !(r.password ?? "").trim())
            .length,
          sifresiBoslukluFare: rows.filter(
            (r) => (r.password ?? "") !== (r.password ?? "").trim()
          ).length,
          girisAdiNicktenFarkli: rows
            .filter(
              (r) =>
                (r.username ?? "").trim() &&
                (r.username ?? "").trim().toLowerCase() !==
                  (r.nickname ?? "").trim().toLowerCase()
            )
            .map((r) => ({ nick: r.nickname, girisAdi: r.username })),
          ayniNicktenBirdenFazla: Object.entries(
            rows.reduce<Record<string, number>>((acc, r) => {
              const k = (r.nickname ?? "").trim().toLocaleLowerCase("tr");
              if (k) acc[k] = (acc[k] ?? 0) + 1;
              return acc;
            }, {})
          )
            .filter(([, n]) => n > 1)
            .map(([nick, adet]) => ({ nick, adet })),
        };
      }
    }

  } catch (e: any) {
    info.veritabani = "HATA";
    info.hata = e?.message ?? "bilinmeyen";
  }

  return NextResponse.json(info, { headers: { "Cache-Control": "no-store" } });
}
