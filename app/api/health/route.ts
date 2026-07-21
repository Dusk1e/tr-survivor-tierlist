import { NextResponse } from "next/server";
import { cloudConfigured, supabaseService, MICE_TABLE } from "@/lib/supabase";

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
    }
  } catch (e: any) {
    info.veritabani = "HATA";
    info.hata = e?.message ?? "bilinmeyen";
  }

  return NextResponse.json(info, { headers: { "Cache-Control": "no-store" } });
}
